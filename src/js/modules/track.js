// ============================================================
// ระบบติดตามงานซ่อม (Job Tracking)
// - หน้า page-track        : รายการงานทั้งหมดในระบบ + ค้นหา/กรอง
// - หน้า page-track-detail : รายละเอียดงาน, ความคืบหน้า, ข้อความจากช่าง
// ดึงข้อมูลจาก Google Sheets ผ่าน GAS (get_tasks + get_adv_tasks)
// ============================================================

const TrackUI = (() => {
  // ---------- สถานะของหน้า ----------
  const state = {
    jobs: [],
    loaded: false,
    loading: false,
    search: '',
    status: 'all',   // all | pending | progress | done
    type: 'all',     // all | building | it | av | project
    mineOnly: false,
    searchTimer: null
  };

  let currentChatUnsubscribe = null;
  let currentChatTicketId = null;
  let currentChatImageFile = null;

  // ---------- ข้อมูลประเภทงาน ----------
  const TYPES = {
    building: { label: 'ซ่อมอาคาร', prefix: 'B', icon: 'fa-wrench', chip: 'bg-[#B0EDE6] text-[#265D5A]' },
    it: { label: 'ซ่อมไอที', prefix: 'IT', icon: 'fa-desktop', chip: 'bg-sky-100 text-sky-700' },
    av: { label: 'ซ่อมโสตฯ', prefix: 'AV', icon: 'fa-camera', chip: 'bg-amber-100 text-amber-700' },
    project: { label: 'โครงการ', prefix: 'PJ', icon: 'fa-building-circle-check', chip: 'bg-violet-100 text-violet-700' }
  };

  // ---------- ขั้นตอนความคืบหน้า ----------
  const STEPS = [
    { label: 'แจ้งเรื่อง', icon: 'fa-paper-plane' },
    { label: 'รับเรื่อง / มอบหมายช่าง', icon: 'fa-user-check' },
    { label: 'กำลังดำเนินการ', icon: 'fa-screwdriver-wrench' },
    { label: 'เสร็จสิ้น', icon: 'fa-flag-checkered' }
  ];

  const esc = v => (v === null || v === undefined) ? '' : sanitizeHtml(String(v));
  const str = v => (v === null || v === undefined) ? '' : String(v).trim();
  const isUrl = v => /^https?:\/\//i.test(str(v));
  const pad = n => String(n).padStart(3, '0');

  // แปลงสถานะเป็นหมวด + ลำดับขั้นตอน
  function classify(status, tech) {
    const s = str(status);
    if (/ยกเลิก|ไม่อนุมัติ|ปฏิเสธ/.test(s)) return { group: 'cancel', step: -1 };
    if (/เสร็จ|เรียบร้อยแล้ว|ปิดงาน/.test(s)) return { group: 'done', step: 3 };
    if (/กำลัง|รอตรวจรับ|แก้ไข/.test(s)) return { group: 'progress', step: 2 };
    if (/มอบหมาย|อนุมัติ|รับเรื่องแล้ว|รับงาน/.test(s) && !/^รอ/.test(s)) return { group: 'progress', step: 1 };
    if (tech) return { group: 'progress', step: 1 };
    return { group: 'pending', step: 0 };
  }

  // แปลงวันที่จาก Sheet ("dd/MM/yyyy HH:mm[:ss]" หรือ ISO) เป็น Date
  function parseDate(v) {
    const s = str(v);
    if (!s) return null;
    const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
    if (m) {
      let y = Number(m[3]);
      if (y < 100) y += 2000;
      if (y > 2400) y -= 543;               // ปี พ.ศ. เต็ม
      else if (y >= 1940 && y < 2000) y += 57; // ปี พ.ศ. 2 หลักที่ Sheet ตีความเป็น 19xx
      return new Date(y, Number(m[2]) - 1, Number(m[1]), Number(m[4] || 0), Number(m[5] || 0));
    }
    const d = new Date(s);
    return isNaN(d) ? null : d;
  }

  function fmtDate(d, withTime = true) {
    if (!d) return '-';
    const opt = withTime ? { dateStyle: 'medium', timeStyle: 'short' } : { dateStyle: 'medium' };
    return d.toLocaleString('th-TH', opt) + (withTime ? ' น.' : '');
  }

  function timeAgo(d) {
    if (!d) return '';
    const diff = (Date.now() - d.getTime()) / 1000;
    if (diff < 60) return 'เมื่อสักครู่';
    if (diff < 3600) return Math.floor(diff / 60) + ' นาทีที่แล้ว';
    if (diff < 86400) return Math.floor(diff / 3600) + ' ชั่วโมงที่แล้ว';
    if (diff < 86400 * 30) return Math.floor(diff / 86400) + ' วันที่แล้ว';
    return fmtDate(d, false);
  }

  function driveThumb(url, size = 'w600') {
    const u = str(url);
    const m = u.match(/\/d\/([a-zA-Z0-9_-]+)/) || u.match(/id=([a-zA-Z0-9_-]+)/);
    return m ? `https://drive.google.com/thumbnail?id=${m[1]}&sz=${size}` : u;
  }

  // ---------- แปลงแถวข้อมูลจาก Sheet ให้อยู่ในรูปแบบเดียวกัน ----------
  // อาคาร (เรียงเก่า→ใหม่): 0 เวลา,1 หัวข้อ,2 รายละเอียด,3 ผู้แจ้ง,4 สถานะ,5 รูปแจ้ง,6 รายละเอียดการแก้ไข,7 ช่าง,8 รูปผลงาน,9 ค่าใช้จ่าย,10 ใบเสร็จ,11 ความเร่งด่วน,12 หน่วยงาน,13 สถานที่,14 วันที่พบปัญหา,15 ติดต่อ
  function fromBuilding(r, idx) {
    const tech = str(r[7]);
    return makeJob('building', idx + 1, r, {
      image: r[5], fixDetail: r[6], tech, proof: r[8], cost: r[9], urgency: r[11]
    }, idx);
  }

  function fromAdvanced(type, r, seq, idx) {
    return makeJob(type, seq, r, {
      image: isUrl(r[5]) ? r[5] : '',
      fixDetail: r[7], tech: str(r[8]), proof: r[6], cost: r[9],
      urgency: str(r[11]) || (!isUrl(r[5]) && str(r[5]) !== '-' ? r[5] : '')
    }, idx);
  }

  function fromFirebase(docData) {
    const status = docData.status || 'รอดำเนินการ';
    const cls = classify(status, docData.techName);
    
    let createdDate = null;
    if (docData.createdAt && docData.createdAt.toDate) {
      createdDate = docData.createdAt.toDate();
    }
    
    let incidentDate = null;
    if (docData.incidentDate && docData.incidentDate.toDate) {
      incidentDate = docData.incidentDate.toDate();
    }
    
    return {
      id: docData.ticketId,
      originalIndex: docData.originalIndex || 0,
      type: docData.type,
      created: createdDate,
      createdRaw: createdDate ? fmtDate(createdDate, false) : '',
      subject: docData.subject || 'ไม่ระบุหัวข้อ',
      detail: docData.detail || '',
      reporter: docData.reporterName || '',
      status: status,
      group: cls.group,
      step: cls.step,
      image: docData.fileUrl || '',
      fixDetail: docData.fixDetail || '',
      tech: docData.techName || '',
      proof: docData.proofUrl || '',
      cost: docData.cost || '',
      urgency: docData.urgency || '',
      dept: docData.dept || '',
      location: docData.location || '',
      incident: incidentDate,
      contact: docData.contact || ''
    };
  }

  function makeJob(type, seq, r, x, originalIndex) {
    const status = str(r[4]) || (type === 'project' ? 'รอพิจารณาอนุมัติ' : 'รอดำเนินการ');
    const created = parseDate(r[0]);
    const cls = classify(status, x.tech);
    return {
      id: `${TYPES[type].prefix}-${pad(seq)}`,
      originalIndex, // Added to map back to the Google Sheet row
      type,
      created,
      createdRaw: str(r[0]),
      subject: str(r[1]) || 'ไม่ระบุหัวข้อ',
      detail: str(r[2]),
      reporter: str(r[3]),
      status,
      group: cls.group,
      step: cls.step,
      image: isUrl(x.image) ? str(x.image) : '',
      fixDetail: str(x.fixDetail) === '-' ? '' : str(x.fixDetail),
      tech: x.tech,
      proof: isUrl(x.proof) ? str(x.proof) : '',
      cost: str(x.cost) === '-' ? '' : str(x.cost),
      urgency: str(x.urgency) === '-' ? '' : str(x.urgency),
      dept: str(r[12]),
      location: str(r[13]),
      incident: parseDate(r[14]),
      contact: str(r[15])
    };
  }

  // ---------- ตรวจว่าเป็นงานของผู้ใช้ปัจจุบันหรือไม่ ----------
  const normName = n => str(n).replace(/^(คุณครู|ครู|คุณ|นาย|นางสาว|นาง|อ\.)\s*/, '').replace(/\s+/g, '').toLowerCase();
  function isMine(job) {
    if (typeof currentTeacher === 'undefined' || !currentTeacher) return false;
    const me = normName(currentTeacher);
    const rep = normName(job.reporter);
    if (!me || !rep) return false;
    if (me === rep) return true;
    return (me.length >= 3 && rep.includes(me)) || (rep.length >= 3 && me.includes(rep));
  }

  // ---------- โหลดข้อมูล ----------
  let unsubscribeTickets = null;
  
  async function load(force = false) {
    if (state.loading) return;
    if (state.loaded && !force) { render(); return; }
    


    state.loading = true;
    renderSkeleton();
    const btn = $('track-refresh-btn');
    if (btn) btn.querySelector('i')?.classList.add('fa-spin');

    if (!window.firestoreDb) {
      setTimeout(() => { state.loading = false; load(force); }, 1000);
      return;
    }

    try {
      if (unsubscribeTickets) unsubscribeTickets();
      
      // ดึงข้อมูล Real-time จาก Firebase Collection 'tickets'
      unsubscribeTickets = window.firestoreDb.collection('tickets')
        .orderBy('createdAt', 'desc')
        .onSnapshot((snapshot) => {
          const jobs = [];
          snapshot.forEach(doc => jobs.push(fromFirebase(doc.data())));
          
          state.jobs = jobs;
          state.loaded = true;
          
          if (state.loading) {
            state.loading = false;
            if (btn) btn.querySelector('i')?.classList.remove('fa-spin');
          }
          
          render();
          
          // ถ้าเปิดหน้ารายละเอียดค้างไว้ ให้ดึงข้อมูลมาอัปเดตแบบเนียนๆ
          const detailPage = $('page-track-detail');
          if (detailPage && !detailPage.classList.contains('hidden') && state.currentJobId) {
             open(state.currentJobId);
          }
        }, (err) => {
          console.error("Firebase listen error:", err);
          state.loading = false;
          if (btn) btn.querySelector('i')?.classList.remove('fa-spin');
        });
        
    } catch (e) {
      console.error('Track load error:', e);
      const list = $('track-list');
      if (list) list.innerHTML = `<div class="col-span-full p-8 text-center text-rose-500 bg-rose-50 rounded-2xl border border-rose-100">
        <i class="fa-solid fa-triangle-exclamation text-2xl mb-2"></i><br>โหลดข้อมูลไม่สำเร็จ: ${esc(e.message)}
        <br><button onclick="TrackUI.load(true)" class="mt-3 px-4 py-2 bg-white rounded-xl border border-rose-200 text-sm">ลองใหม่</button></div>`;
      state.loading = false;
      if (btn) btn.querySelector('i')?.classList.remove('fa-spin');
    }
  }

  // ---------- กรองข้อมูล ----------
  function filtered(ignoreStatus = false) {
    const q = state.search.toLowerCase();
    return state.jobs.filter(j => {
      if (state.type !== 'all' && j.type !== state.type) return false;
      if (state.mineOnly && !isMine(j)) return false;
      if (!ignoreStatus && state.status !== 'all') {
        if (state.status === 'progress' && j.group !== 'progress') return false;
        if (state.status === 'pending' && j.group !== 'pending') return false;
        if (state.status === 'done' && j.group !== 'done') return false;
      }
      if (q) {
        const hay = [j.id, j.subject, j.detail, j.reporter, j.location, j.dept, j.tech, j.status, TYPES[j.type].label]
          .join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }

  // ---------- แสดงผล ----------
  function statusBadge(job, size = 'text-xs') {
    const map = {
      pending: 'bg-rose-50 text-rose-600 border-rose-200',
      progress: 'bg-amber-50 text-amber-700 border-amber-200',
      done: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      cancel: 'bg-slate-100 text-slate-500 border-slate-200'
    };
    const dot = { pending: 'bg-rose-500 animate-pulse', progress: 'bg-amber-500', done: 'bg-emerald-500', cancel: 'bg-slate-400' };
    return `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${size} font-semibold border ${map[job.group]}">
      <span class="w-1.5 h-1.5 rounded-full ${dot[job.group]}"></span>${esc(job.status)}</span>`;
  }

  function miniProgress(job) {
    if (job.group === 'cancel') return '<div class="h-1.5 rounded-full bg-slate-200"></div>';
    const pct = ((job.step + 1) / STEPS.length) * 100;
    const color = job.group === 'done' ? 'bg-emerald-500' : job.group === 'progress' ? 'bg-amber-400' : 'bg-rose-400';
    return `<div class="h-1.5 rounded-full bg-slate-100 overflow-hidden"><div class="h-full ${color} rounded-full transition-all" style="width:${pct}%"></div></div>`;
  }

  function renderSkeleton() {
    const list = $('track-list');
    if (!list) return;
    list.innerHTML = Array.from({ length: 4 }).map(() => `
      <div class="p-5 rounded-2xl border border-slate-100 bg-white animate-pulse">
        <div class="flex justify-between mb-4"><div class="h-4 w-20 bg-slate-100 rounded"></div><div class="h-5 w-24 bg-slate-100 rounded-full"></div></div>
        <div class="h-5 w-3/4 bg-slate-100 rounded mb-2"></div>
        <div class="h-4 w-1/2 bg-slate-100 rounded mb-5"></div>
        <div class="h-1.5 w-full bg-slate-100 rounded-full"></div>
      </div>`).join('');
    if ($('track-result-info')) $('track-result-info').textContent = 'กำลังโหลดคิวงาน...';
  }

  function updateControls() {
    $$('#track-summary .track-stat').forEach(b => {
      const on = b.dataset.status === state.status;
      b.classList.toggle('border-[#265D5A]', on);
      b.classList.toggle('ring-2', on);
      b.classList.toggle('ring-[#B0EDE6]', on);
      b.classList.toggle('border-slate-200', !on);
    });
    $$('#track-type-filters .track-type').forEach(b => {
      const on = b.dataset.type === state.type;
      b.className = 'track-type px-3.5 py-2 rounded-full text-xs font-medium border transition-colors ' +
        (on ? 'bg-[#265D5A] text-white border-[#265D5A]' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50');
    });
    const mine = $('track-mine-btn');
    if (mine) {
      mine.className = 'px-4 py-2 rounded-full text-sm font-medium border transition-colors flex items-center gap-2 ' +
        (state.mineOnly ? 'bg-[#265D5A] text-white border-[#265D5A]' : 'border-[#265D5A]/30 text-[#265D5A] bg-white hover:bg-[#E0F7F4]');
    }
  }

  function render() {
    updateControls();
    
    // Show migrate button for Admins/Supervisors only
    if (typeof isAdminLoggedIn !== 'undefined' && isAdminLoggedIn) {
       const btn = $('track-migrate-btn');
       if (btn) btn.classList.remove('hidden');
    }

    const list = $('track-list');
    if (!list) return;

    // ตัวเลขสรุป (ตามประเภท/ค้นหา/งานของฉัน แต่ไม่กรองสถานะ)
    const base = filtered(true);
    const count = g => base.filter(j => j.group === g).length;
    if ($('track-count-all')) $('track-count-all').textContent = base.length;
    if ($('track-count-pending')) $('track-count-pending').textContent = count('pending');
    if ($('track-count-progress')) $('track-count-progress').textContent = count('progress');
    if ($('track-count-done')) $('track-count-done').textContent = count('done');

    const items = filtered();
    if ($('track-result-info')) {
      $('track-result-info').textContent = `พบ ${items.length} งาน` + (state.mineOnly ? ' (เฉพาะงานของฉัน)' : '') + ' · เรียงจากล่าสุด';
    }

    if (!items.length) {
      list.innerHTML = `<div class="col-span-full p-10 text-center text-slate-500 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
        <i class="fa-regular fa-folder-open text-3xl mb-3 text-slate-300"></i><br>
        ${state.search || state.mineOnly || state.status !== 'all' || state.type !== 'all' ? 'ไม่พบงานที่ตรงกับเงื่อนไข ลองเปลี่ยนคำค้นหาหรือตัวกรอง' : 'ยังไม่มีงานในระบบ'}
      </div>`;
      return;
    }

    list.innerHTML = items.map(j => {
      const t = TYPES[j.type];
      const mine = isMine(j);
      return `
      <button onclick="TrackUI.open('${j.id}')" id="track-item-${j.id}"
        class="text-left p-5 rounded-2xl border ${mine ? 'border-[#265D5A]/40 bg-[#F3FCFA]' : 'border-slate-200 bg-white'} hover:border-[#265D5A]/50 hover:shadow-lg hover:-translate-y-0.5 transition-all group">
        <div class="flex items-start justify-between gap-3 mb-3">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">#${j.id}</span>
            <span class="text-[11px] px-2 py-0.5 rounded-md ${t.chip}"><i class="fa-solid ${t.icon} mr-1"></i>${t.label}</span>
            ${mine ? '<span class="text-[11px] px-2 py-0.5 rounded-md bg-[#265D5A] text-white">งานของฉัน</span>' : ''}
          </div>
          ${statusBadge(j, 'text-[11px]')}
        </div>
        <h3 class="font-semibold text-slate-800 text-base leading-snug mb-1 group-hover:text-[#265D5A]">${esc(j.subject)}</h3>
        <p class="text-sm text-slate-500 line-clamp-2 mb-3">${esc(j.detail) || '<span class="text-slate-300">ไม่มีรายละเอียดเพิ่มเติม</span>'}</p>
        <div class="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 mb-4">
          ${j.location ? `<span><i class="fa-solid fa-location-dot text-slate-400 mr-1"></i>${esc(j.location)}</span>` : ''}
          <span><i class="fa-solid fa-user text-slate-400 mr-1"></i>${esc(j.reporter) || 'ไม่ระบุ'}</span>
          <span><i class="fa-regular fa-clock text-slate-400 mr-1"></i>${timeAgo(j.created) || esc(j.createdRaw)}</span>
        </div>
        ${miniProgress(j)}
        <div class="flex items-center justify-between mt-3 text-xs">
          <span class="text-slate-500">${j.tech ? `<i class="fa-solid fa-user-gear text-[#265D5A] mr-1"></i>ช่าง: <b class="text-slate-700 font-medium">${esc(j.tech)}</b>` : '<i class="fa-regular fa-hourglass-half mr-1"></i>รอมอบหมายช่าง'}</span>
          ${j.fixDetail ? '<span class="text-[#265D5A] font-medium"><i class="fa-solid fa-comment-dots mr-1"></i>มีข้อความจากช่าง</span>' : '<span class="text-slate-300 group-hover:text-[#265D5A]">ดูรายละเอียด ›</span>'}
        </div>
      </button>`;
    }).join('');
  }

  // ---------- หน้ารายละเอียด ----------
  function stepper(job) {
    if (job.group === 'cancel') {
      return `<div class="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-600 text-sm flex items-center gap-3">
        <i class="fa-solid fa-ban text-slate-400 text-xl"></i> งานนี้ถูก${esc(job.status)}</div>`;
    }
    return `<ol class="relative grid grid-cols-4 gap-1">
      ${STEPS.map((s, i) => {
        const done = i <= job.step;
        const current = i === job.step && job.group !== 'done';
        const circle = done
          ? (current ? 'bg-amber-400 text-white ring-4 ring-amber-100' : 'bg-[#265D5A] text-white')
          : 'bg-white text-slate-300 border-2 border-slate-200';
        const line = i < STEPS.length - 1
          ? `<span class="absolute top-5 left-1/2 w-full h-1 ${i < job.step ? 'bg-[#265D5A]' : 'bg-slate-200'}"></span>` : '';
        return `<li class="relative flex flex-col items-center text-center">
          ${line}
          <span class="relative z-10 w-10 h-10 rounded-full flex items-center justify-center ${circle} transition-all">
            <i class="fa-solid ${done && !current ? 'fa-check' : s.icon} text-sm"></i></span>
          <span class="mt-2 text-[11px] md:text-xs leading-tight ${done ? 'text-slate-800 font-semibold' : 'text-slate-400'}">${s.label}</span>
          ${current ? '<span class="mt-1 text-[10px] text-amber-600 font-medium">ขั้นตอนปัจจุบัน</span>' : ''}
        </li>`;
      }).join('')}
    </ol>`;
  }

  function infoRow(icon, label, value) {
    if (!value) return '';
    return `<div class="flex gap-3 py-2.5 border-b border-slate-100 last:border-0">
      <i class="fa-solid ${icon} w-5 text-center text-slate-400 mt-0.5"></i>
      <div class="flex-1 min-w-0"><div class="text-xs text-slate-400">${label}</div>
      <div class="text-sm text-slate-700 break-words">${value}</div></div></div>`;
  }

  function imageBlock(url, caption) {
    if (!url) return '';
    return `<button onclick="showImageModal('${esc(url)}')" class="group relative block rounded-xl overflow-hidden border border-slate-200 bg-slate-50 w-full sm:w-56">
      <img src="${driveThumb(url)}" alt="${caption}" class="w-full h-40 object-cover group-hover:scale-105 transition-transform" loading="lazy"
        onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'h-40 flex items-center justify-center text-slate-400 text-sm',innerHTML:'<i class=&quot;fa-solid fa-image mr-2&quot;></i>เปิดดูรูปภาพ'}))">
      <span class="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent text-white text-xs p-2 text-left">
        <i class="fa-solid fa-magnifying-glass-plus mr-1"></i>${caption}</span></button>`;
  }

  function techMessage(job) {
    let body;
    if (job.fixDetail) {
      body = `<div class="flex items-start gap-3">
        <div class="w-10 h-10 rounded-full bg-[#265D5A] text-white flex items-center justify-center shrink-0"><i class="fa-solid fa-user-gear"></i></div>
        <div class="flex-1 min-w-0">
          <div class="text-xs text-slate-500 mb-1">${esc(job.tech) || 'ช่างผู้รับผิดชอบ'}</div>
          <div class="bg-white border border-[#B0EDE6] rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-slate-700 whitespace-pre-line shadow-sm">${esc(job.fixDetail)}</div>
        </div></div>`;
    } else if (job.tech) {
      body = `<div class="flex items-center gap-3 text-sm text-slate-500">
        <div class="w-10 h-10 rounded-full bg-[#B0EDE6] text-[#265D5A] flex items-center justify-center shrink-0"><i class="fa-solid fa-user-gear"></i></div>
        <div><b class="text-slate-700 font-medium">${esc(job.tech)}</b> รับผิดชอบงานนี้แล้ว<br><span class="text-xs">ช่างยังไม่ได้ระบุรายละเอียดสิ่งที่ต้องแก้ไข</span></div></div>`;
    } else {
      body = `<div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-sm text-slate-500">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center shrink-0"><i class="fa-regular fa-hourglass-half"></i></div>
          <div>ยังไม่มีช่างรับงาน<br><span class="text-xs">เมื่อมีการมอบหมายช่าง ข้อความจากช่างจะแสดงที่นี่</span></div>
        </div>
        ${isAdminLoggedIn || (typeof currentRole !== 'undefined' && (currentRole === 'Executive' || currentRole === 'Supervisor')) ? 
          `<button onclick="TrackUI.assignTech('${job.id}')" class="bg-[#265D5A] hover:bg-[#1a3f3d] text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm w-full sm:w-auto"><i class="fa-solid fa-user-plus mr-1"></i>มอบหมายงาน</button>` : ''}
      </div>`;
    }
    
    let extra = '';
    if (job.tech && (isAdminLoggedIn || (typeof currentRole !== 'undefined' && (currentRole === 'Executive' || currentRole === 'Supervisor')))) {
      extra = `<div class="mt-3 text-right"><button onclick="TrackUI.assignTech('${job.id}')" class="text-[#265D5A] hover:text-[#1a3f3d] text-xs font-bold underline"><i class="fa-solid fa-user-pen mr-1"></i>เปลี่ยนช่างที่รับผิดชอบ</button></div>`;
    }

    return `<section class="rounded-2xl border border-[#B0EDE6] bg-[#F3FCFA] p-5 mb-4">
      <h3 class="font-semibold text-[#265D5A] mb-4 flex items-center gap-2"><i class="fa-solid fa-comments"></i>ข้อความจากช่าง</h3>
      ${body}
      ${extra}
      ${job.proof || job.cost ? `<div class="mt-4 pt-4 border-t border-[#B0EDE6] flex flex-col sm:flex-row gap-4 sm:items-end">
        ${imageBlock(job.proof, 'รูปผลการซ่อม')}
        ${job.cost ? `<div class="text-sm text-slate-600"><span class="text-xs text-slate-400 block">ค่าใช้จ่าย</span>${esc(job.cost)} บาท</div>` : ''}
      </div>` : ''}
    </section>`;
  }

  function open(id) {
    state.currentJobId = id;
    const job = state.jobs.find(j => j.id === id);
    if (!job) return alertBox('warning', 'ไม่พบงาน', 'อาจถูกลบหรือย้ายไปแล้ว กรุณารีเฟรชรายการ');
    nav('page-track-detail');
    const box = $('track-detail-body');
    if (!box) return;
    const t = TYPES[job.type];
    
    // Determine target sheet name based on job type
    let targetSheet = '';
    if (job.type === 'building') targetSheet = 'Task'; // From V6 Code.gs SHEET_NAME is default "Task" or similar. wait, let's just pass job type
    
    box.innerHTML = `
      <section class="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 mb-4 shadow-sm">
        <div class="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="font-mono text-sm font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">#${job.id}</span>
            <span class="text-xs px-2.5 py-1 rounded-lg ${t.chip}"><i class="fa-solid ${t.icon} mr-1"></i>${t.label}</span>
            ${job.urgency ? `<span class="text-xs px-2.5 py-1 rounded-lg bg-rose-50 text-rose-600 border border-rose-100"><i class="fa-solid fa-bolt mr-1"></i>${esc(job.urgency)}</span>` : ''}
          </div>
          ${statusBadge(job, 'text-sm')}
        </div>
        <h2 class="text-xl md:text-2xl font-semibold text-slate-800 mb-1">${esc(job.subject)}</h2>
        <p class="text-xs text-slate-400 mb-6"><i class="fa-regular fa-clock mr-1"></i>แจ้งเมื่อ ${job.created ? fmtDate(job.created) : esc(job.createdRaw)}${job.created ? ` (${timeAgo(job.created)})` : ''}</p>
        <h3 class="text-sm font-semibold text-slate-700 mb-4">ความคืบหน้า</h3>
        ${stepper(job)}
      </section>

      ${techMessage(job)}

      <section class="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 shadow-sm">
        <h3 class="font-semibold text-slate-800 mb-3 flex items-center gap-2"><i class="fa-solid fa-clipboard-list text-[#265D5A]"></i>รายละเอียดที่ผู้ใช้แจ้ง</h3>
        <div class="bg-slate-50 rounded-xl border border-slate-100 p-4 text-sm text-slate-700 whitespace-pre-line mb-3">${esc(job.detail) || '<span class="text-slate-400">ไม่มีรายละเอียดเพิ่มเติม</span>'}</div>
        ${infoRow('fa-user', 'ผู้แจ้ง', esc(job.reporter))}
        ${infoRow('fa-building', 'หน่วยงาน / ฝ่าย', esc(job.dept))}
        ${infoRow('fa-location-dot', 'สถานที่', esc(job.location))}
        ${infoRow('fa-calendar-day', job.type === 'project' ? 'วันที่ต้องการ' : 'วันที่พบปัญหา', job.incident ? fmtDate(job.incident) : '')}
        ${infoRow('fa-phone', 'ช่องทางติดต่อ', esc(job.contact))}
        ${job.image ? `<div class="mt-4">${imageBlock(job.image, 'รูปที่ผู้แจ้งแนบมา')}</div>` : ''}
      </section>`;

    // --- Chat Section Setup ---
    const chatSection = $('track-chat-section');
    if (chatSection) chatSection.classList.remove('hidden');
    
    if (currentChatUnsubscribe) currentChatUnsubscribe();
    currentChatTicketId = id;
    if (typeof FirebaseChat !== 'undefined' && FirebaseChat.listen) {
       currentChatUnsubscribe = FirebaseChat.listen(id, renderChatMessages);
    }
  }

  // ---------- แชทแบบ Real-time ----------
  async function assignTech(jobId) {
    const job = state.jobs.find(j => j.id === jobId);
    if (!job) return;
    
    const { value: techName } = await Swal.fire({
      title: 'มอบหมายช่างซ่อม',
      input: 'text',
      inputLabel: 'ระบุชื่อช่างที่รับผิดชอบ',
      inputValue: job.tech || '',
      showCancelButton: true,
      confirmButtonText: 'บันทึก',
      cancelButtonText: 'ยกเลิก'
    });
    
    if (techName) {
      Swal.fire({title: 'กำลังบันทึก...', allowOutsideClick: false, didOpen: () => Swal.showLoading()});
      
      let sheetMap = { 'building': 'Task', 'it': 'IT_Repairs', 'av': 'AV_Repairs', 'project': 'Facility_Projects' };
      let sheetName = sheetMap[job.type] || 'Task';
      
      try {
        // อัปเดตลง Firebase เพื่อให้ UI ทุกคนเปลี่ยนทันที (Real-time)
        if (window.firestoreDb) {
           await window.firestoreDb.collection('tickets').doc(jobId).set({
             techName: techName,
             updatedAt: firebase.firestore.FieldValue.serverTimestamp()
           }, { merge: true });
        }
      
        // อัปเดตลง Google Sheets เป็น Backup
        await ResourceHubCore.api.post({
          action: 'edit_assignment',
          sheetName: sheetName,
          rowIndex: job.originalIndex,
          technician: techName
        });
        
        Swal.fire({icon: 'success', title: 'มอบหมายช่างสำเร็จ!', showConfirmButton: false, timer: 1500});
        // ไม่ต้องเรียก open(jobId) เองแล้ว เพราะ Firebase .onSnapshot จะทำงานและรีเฟรช UI ให้เอง
      } catch (err) {
        Swal.fire('Error', 'ไม่สามารถมอบหมายงานได้', 'error');
      }
    }
  }

  function renderChatMessages(messages) {
    const box = $('track-chat-messages');
    if (!box) return;
    
    if (messages.length === 0) {
      box.innerHTML = '<div class="text-center text-slate-400 text-sm mt-10">ยังไม่มีข้อความสนทนา เริ่มพิมพ์สอบถามได้เลยครับ</div>';
      return;
    }
    
    const myName = isAdminLoggedIn ? 'Admin' : (typeof currentTeacher !== 'undefined' && currentTeacher ? currentTeacher.name : 'Unknown');
    
    box.innerHTML = messages.map(msg => {
      const isMe = msg.senderName === myName;
      const time = msg.timestamp ? new Date(msg.timestamp.toDate()).toLocaleTimeString('th-TH', {hour: '2-digit', minute:'2-digit'}) : 'กำลังส่ง...';
      const roleColor = (msg.role === 'admin' || msg.role === 'tech') ? 'text-[#265D5A]' : 'text-slate-500';
      
      let attachmentHtml = '';
      if (msg.attachmentUrl) {
        attachmentHtml = `<div class="mt-2"><img src="${driveThumb(msg.attachmentUrl)}" onclick="showImageModal('${esc(msg.attachmentUrl)}')" class="rounded-lg max-w-full h-auto max-h-40 object-cover cursor-pointer hover:opacity-90 border"></div>`;
      }
      
      if (isMe) {
        return `
        <div class="flex flex-col items-end w-full">
          <div class="text-[10px] text-slate-400 mb-1 mr-1">ฉัน · ${time}</div>
          <div class="bg-blue-600 text-white rounded-2xl rounded-tr-sm px-4 py-2.5 max-w-[85%] shadow-sm">
            <div class="text-sm whitespace-pre-wrap">${esc(msg.message)}</div>
            ${attachmentHtml}
          </div>
        </div>`;
      } else {
        return `
        <div class="flex flex-col items-start w-full">
          <div class="text-[10px] ${roleColor} font-medium mb-1 ml-1">${esc(msg.senderName)} · ${time}</div>
          <div class="bg-white border border-slate-200 text-slate-700 rounded-2xl rounded-tl-sm px-4 py-2.5 max-w-[85%] shadow-sm">
            <div class="text-sm whitespace-pre-wrap">${esc(msg.message)}</div>
            ${attachmentHtml}
          </div>
        </div>`;
      }
    }).join('');
    
    // Auto scroll to bottom
    setTimeout(() => { box.scrollTop = box.scrollHeight; }, 100);
  }

  async function submitChat(e) {
    e.preventDefault();
    if (!currentChatTicketId || !FirebaseChat) return;
    
    const input = $('track-chat-input');
    const msg = input.value.trim();
    if (!msg && !currentChatImageFile) return;
    
    const btn = $('track-chat-submit');
    const originalContent = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
    btn.disabled = true;
    input.disabled = true;
    
    try {
      let attachmentUrl = '';
      
      // Upload image to Drive via GAS if exists
      if (currentChatImageFile) {
        // ใช้ readFile(file) จาก main.js
        const fileData = await window.readFile(currentChatImageFile);
        if (fileData) {
           const res = await ResourceHubCore.api.post({ action: 'upload_chat_image', file: fileData });
           if (res && res.fileUrl) attachmentUrl = res.fileUrl;
        }
      }
      
      const senderName = isAdminLoggedIn ? 'Admin' : (typeof currentTeacher !== 'undefined' && currentTeacher ? currentTeacher.name : 'Unknown');
      const role = isAdminLoggedIn ? 'admin' : 'user';
      
      await FirebaseChat.send(currentChatTicketId, senderName, role, msg, attachmentUrl);
      
      input.value = '';
      clearChatImage();
      
    } catch (err) {
      console.error(err);
      alertBox('error', 'ส่งข้อความไม่สำเร็จ', err.message);
    } finally {
      btn.innerHTML = originalContent;
      btn.disabled = false;
      input.disabled = false;
      input.focus();
    }
  }

  function previewChatImage(input) {
    const file = input.files[0];
    if (!file) return clearChatImage();
    
    currentChatImageFile = file;
    const reader = new FileReader();
    reader.onload = e => {
      $('track-chat-preview-img').src = e.target.result;
      $('track-chat-preview').classList.remove('hidden');
    };
    reader.readAsDataURL(file);
  }
  
  function clearChatImage() {
    currentChatImageFile = null;
    if ($('track-chat-image')) $('track-chat-image').value = '';
    if ($('track-chat-preview')) $('track-chat-preview').classList.add('hidden');
    if ($('track-chat-preview-img')) $('track-chat-preview-img').src = '';
  }

  // ---------- Migration Script ----------
  async function migrateToFirebase() {
    if (!firestoreDb) return alertBox('error', 'ข้อผิดพลาด', 'ยังไม่ได้เชื่อมต่อ Firebase');
    if (!confirm('ยืนยันการย้ายข้อมูลทั้งหมดจาก Google Sheets ไปยัง Firebase?')) return;
    
    Swal.fire({title: 'กำลังย้ายข้อมูล...', html: 'กรุณารอสักครู่ (อาจใช้เวลา 1-2 นาที)', allowOutsideClick: false, didOpen: () => Swal.showLoading()});
    
    try {
      let count = 0;
      for (const job of state.jobs) {
        const docRef = firestoreDb.collection('tickets').doc(job.id);
        
        let createdAt = firebase.firestore.FieldValue.serverTimestamp();
        if (job.created && !isNaN(job.created.getTime())) {
           createdAt = firebase.firestore.Timestamp.fromDate(job.created);
        }
        
        let incidentDate = null;
        if (job.incident && !isNaN(job.incident.getTime())) {
           incidentDate = firebase.firestore.Timestamp.fromDate(job.incident);
        }
        
        await docRef.set({
          ticketId: job.id,
          type: job.type,
          status: job.status,
          createdAt: createdAt,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
          subject: job.subject || '',
          detail: job.detail || '',
          reporterName: job.reporter || '',
          fileUrl: job.image || '',
          fixDetail: job.fixDetail || '',
          techName: job.tech || '',
          proofUrl: job.proof || '',
          cost: job.cost || '',
          urgency: job.urgency || '',
          dept: job.dept || '',
          location: job.location || '',
          incidentDate: incidentDate,
          contact: job.contact || '',
          originalIndex: job.originalIndex || 0,
          isMigrated: true
        }, { merge: true });
        count++;
      }
      
      Swal.fire('สำเร็จ!', `ย้ายข้อมูลทั้งหมด ${count} รายการไปยัง Firebase เรียบร้อยแล้ว`, 'success');
    } catch (e) {
      console.error(e);
      Swal.fire('ข้อผิดพลาด', 'การย้ายข้อมูลล้มเหลว: ' + e.message, 'error');
    }
  }

  // ---------- Actions ----------
  return {
    load,
    open,
    assignTech,
    submitChat,
    previewChatImage,
    clearChatImage,
    migrateToFirebase,
    onSearch(v) {
      clearTimeout(state.searchTimer);
      state.searchTimer = setTimeout(() => { state.search = str(v); render(); }, 150);
    },
    setStatus(s) { state.status = s; render(); },
    setType(t) { state.type = t; render(); },
    toggleMine() {
      if (typeof currentTeacher === 'undefined' || !currentTeacher) {
        return alertBox('info', 'ต้องเข้าสู่ระบบ', 'กรุณาเข้าสู่ระบบเพื่อดูงานของคุณ');
      }
      state.mineOnly = !state.mineOnly;
      render();
    },
    // เปิดหน้ารายการพร้อมตั้งค่าเริ่มต้น (เช่น หลังแจ้งซ่อมเสร็จ ให้เห็นงานของตัวเอง)
    show(opts = {}) {
      if (opts.mineOnly !== undefined) state.mineOnly = !!opts.mineOnly && !!currentTeacher;
      if (opts.force) state.loaded = false;
      nav('page-track');
      load(opts.force);
    }
  };
})();

window.TrackUI = TrackUI;

// ปุ่ม/ลิงก์เดิมที่เคยเปิด Modal ติดตามงาน ให้มาที่หน้าติดตามงานใหม่แทน
window.openTrackModal = function () { TrackUI.show(); };
window.promptTrackTicket = function () { TrackUI.show({ mineOnly: true }); };
