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

  // ---------- ตรวจจับชื่อและสิทธิ์ผู้ใช้งาน ----------
  const normName = n => str(n).replace(/^(คุณครู|ครู|คุณ|นาย|นางสาว|นาง|นายช่าง|ช่าง|อาจารย์|อ\.)\s*/, '').replace(/\s+/g, '').toLowerCase();

  function getTechEmailFromName(name) {
    if (!name) return '';
    const norm = normName(name);
    if (!norm) return '';
    let users = window.cachedUsers;
    if (!users) {
      try {
        const raw = localStorage.getItem('cached_system_users');
        if (raw) users = JSON.parse(raw);
      } catch (e) {}
    }
    if (Array.isArray(users)) {
      for (const u of users) {
        if (normName(u[1]) === norm) return (u[0] || '').trim();
      }
    }
    return '';
  }

  function canManageJob(job) {
    if (!job) return false;
    // 1. Role เป็น Admin, Executive หรือ Supervisor
    const isSupervisor = (typeof isAdminLoggedIn !== 'undefined' && isAdminLoggedIn) || 
                         (typeof currentRole !== 'undefined' && (currentRole === 'Executive' || currentRole === 'Supervisor' || currentRole === 'Admin'));
    if (isSupervisor) return true;

    // 2. ตรวจสอบอีเมลช่าง
    const myEmail = ((typeof currentEmail === 'string' ? currentEmail : '') || (localStorage.getItem('logged_email') || '')).trim().toLowerCase();
    const jobTechEmail = ((job.techEmail || '') || getTechEmailFromName(job.tech)).trim().toLowerCase();
    if (myEmail && jobTechEmail && myEmail === jobTechEmail) return true;

    // 3. ตรวจสอบชื่อช่าง (ตัดคำนำหน้า เช่น คุณครู, ครู, นาย, นางสาว ฯลฯ)
    const myName = ((typeof currentTeacher === 'string' ? currentTeacher : '') || (localStorage.getItem('logged_teacher') || '')).trim();
    if (job.tech && myName) {
      const meNorm = normName(myName);
      const techNorm = normName(job.tech);
      if (meNorm && techNorm) {
        if (meNorm === techNorm) return true;
        if (meNorm.length >= 3 && techNorm.length >= 3 && (meNorm.includes(techNorm) || techNorm.includes(meNorm))) return true;
      }
    }
    return false;
  }

  // ---------- แปลงแถวข้อมูลจาก Sheet ให้อยู่ในรูปแบบเดียวกัน ----------
  // อาคาร (เรียงเก่า→ใหม่): 0 เวลา,1 หัวข้อ,2 รายละเอียด,3 ผู้แจ้ง,4 สถานะ,5 รูปแจ้ง,6 รายละเอียดการแก้ไข,7 ช่าง,8 รูปผลงาน,9 ค่าใช้จ่าย,10 ใบเสร็จ,11 ความเร่งด่วน,12 หน่วยงาน,13 สถานที่,14 วันที่พบปัญหา,15 ติดต่อ
  function fromBuilding(r, idx) {
    const tech = str(r[7]);
    return makeJob('building', idx + 1, r, {
      image: r[5], fixDetail: r[6], tech, techEmail: getTechEmailFromName(tech), proof: r[8], cost: r[9], urgency: r[11]
    }, idx);
  }

  function fromAdvanced(type, r, seq, idx) {
    const tech = str(r[8]);
    return makeJob(type, seq, r, {
      image: isUrl(r[5]) ? r[5] : '',
      fixDetail: r[7], tech, techEmail: getTechEmailFromName(tech), proof: r[6], cost: r[9],
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
      techEmail: docData.techEmail || '',
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
      techEmail: x.techEmail || '',
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
          if (detailPage && detailPage.classList.contains('active') && state.currentJobId) {
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
    const isInProgress = /กำลัง|รอตรวจรับ|แก้ไข/.test(job.status) || job.step === 2;
    const isDone = job.group === 'done' || job.step >= 3;
    const isCancelled = job.group === 'cancel';

    if (job.fixDetail) {
      body = `<div class="flex items-start gap-3">
        <div class="w-10 h-10 rounded-full bg-[#265D5A] text-white flex items-center justify-center shrink-0 shadow-sm"><i class="fa-solid fa-user-gear"></i></div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-1 flex-wrap">
            <span class="text-xs font-semibold text-slate-700">${esc(job.tech) || 'ช่างผู้รับผิดชอบ'}</span>
            ${job.techEmail ? `<span class="text-[10px] text-slate-400">(${esc(job.techEmail)})</span>` : ''}
            ${isInProgress ? '<span class="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium">กำลังดำเนินการ</span>' : ''}
          </div>
          <div class="bg-white border border-[#B0EDE6] rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-slate-700 whitespace-pre-line shadow-sm">${esc(job.fixDetail)}</div>
        </div></div>`;
    } else if (job.tech) {
      const statusNotice = isInProgress
        ? '<span class="text-xs text-emerald-600 font-semibold flex items-center gap-1.5 mt-1"><span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>ช่างเริ่มดำเนินการแล้ว และกำลังปฏิบัติงาน</span>'
        : '<span class="text-xs text-amber-600 font-medium flex items-center gap-1.5 mt-1"><i class="fa-regular fa-clock"></i>มอบหมายช่างแล้ว (รอช่างเริ่มดำเนินงาน)</span>';

      body = `<div class="flex items-center gap-3 text-sm text-slate-500">
        <div class="w-10 h-10 rounded-full bg-[#B0EDE6] text-[#265D5A] flex items-center justify-center shrink-0 shadow-sm"><i class="fa-solid fa-user-gear"></i></div>
        <div>
          <b class="text-slate-800 font-semibold">${esc(job.tech)}</b> ${job.techEmail ? `<span class="text-xs text-slate-400 font-normal">(${esc(job.techEmail)})</span>` : ''} รับผิดชอบงานนี้
          <br>${statusNotice}
        </div></div>`;
    } else {
      body = `<div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-sm text-slate-500">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center shrink-0"><i class="fa-regular fa-hourglass-half"></i></div>
          <div>ยังไม่มีช่างรับงาน<br><span class="text-xs text-slate-400">เมื่อมีการมอบหมายช่าง ข้อความและปุ่มจัดการจะแสดงที่นี่</span></div>
        </div>
        ${((typeof isAdminLoggedIn !== 'undefined' && isAdminLoggedIn) || (typeof currentRole !== 'undefined' && (currentRole === 'Executive' || currentRole === 'Supervisor' || currentRole === 'Admin'))) ? 
          `<button onclick="TrackUI.assignTech('${job.id}')" class="bg-[#265D5A] hover:bg-[#1a3f3d] text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm w-full sm:w-auto flex items-center justify-center gap-1.5"><i class="fa-solid fa-user-plus"></i>มอบหมายงาน</button>` : ''}
      </div>`;
    }
    
    let extra = '';
    const canManage = canManageJob(job);
    const isSupervisor = (typeof isAdminLoggedIn !== 'undefined' && isAdminLoggedIn) || 
                         (typeof currentRole !== 'undefined' && (currentRole === 'Executive' || currentRole === 'Supervisor' || currentRole === 'Admin'));

    if (job.tech && !isDone && !isCancelled && canManage) {
      if (!isInProgress) {
        // ขั้นตอนที่ 2: มอบหมายช่างแล้ว แต่ยังไม่เริ่มทำ -> แสดงปุ่มเด่น "รับงาน / เริ่มดำเนินงาน"
        extra = `<div class="mt-4 flex flex-wrap gap-2 justify-end border-t border-[#B0EDE6]/50 pt-3">
          <button onclick="TrackUI.startJob('${job.id}')" class="bg-[#265D5A] hover:bg-[#1a3f3d] text-white px-5 py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all shadow-md hover:shadow-lg flex items-center gap-2">
            <i class="fa-solid fa-screwdriver-wrench"></i> <span>รับงาน / เริ่มดำเนินงาน</span>
          </button>
          ${isSupervisor ? 
            `<button onclick="TrackUI.assignTech('${job.id}')" class="bg-white border border-[#265D5A] text-[#265D5A] hover:bg-[#F3FCFA] px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-1.5"><i class="fa-solid fa-user-pen"></i>เปลี่ยนช่าง</button>` : ''}
        </div>`;
      } else {
        // ขั้นตอนที่ 3: กำลังดำเนินการอยู่ -> แสดงปุ่ม "แจ้งความคืบหน้า" และ "ซ่อมเสร็จแล้ว / ปิดงาน"
        extra = `<div class="mt-4 flex flex-wrap gap-2 justify-end border-t border-[#B0EDE6]/50 pt-3">
          <button onclick="TrackUI.updateProgress('${job.id}')" class="bg-white border border-[#265D5A] text-[#265D5A] hover:bg-[#F3FCFA] px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold transition shadow-sm flex items-center gap-1.5">
            <i class="fa-solid fa-comment-dots text-emerald-600"></i> <span>แจ้งความคืบหน้า</span>
          </button>
          <button onclick="TrackUI.closeJob('${job.id}')" class="bg-[#10b981] hover:bg-[#059669] text-white px-5 py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all shadow-md hover:shadow-lg flex items-center gap-2">
            <i class="fa-solid fa-check-circle"></i> <span>ซ่อมเสร็จแล้ว / ปิดงาน</span>
          </button>
          ${isSupervisor ? 
            `<button onclick="TrackUI.assignTech('${job.id}')" class="bg-white border border-slate-300 text-slate-600 hover:bg-slate-50 px-3 py-2.5 rounded-xl text-xs font-semibold transition flex items-center gap-1"><i class="fa-solid fa-user-pen"></i>เปลี่ยนช่าง</button>` : ''}
        </div>`;
      }
    }

    return `<section class="rounded-2xl border border-[#B0EDE6] bg-[#F3FCFA] p-5 mb-4 shadow-sm">
      <div class="flex items-center justify-between gap-2 mb-3">
        <h3 class="font-semibold text-[#265D5A] flex items-center gap-2"><i class="fa-solid fa-comments"></i>ข้อความจากช่าง</h3>
        ${job.tech && isInProgress ? '<span class="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-100/80 px-2.5 py-0.5 rounded-full"><span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>กำลังลงมือ</span>' : ''}
      </div>
      ${body}
      ${extra}
      ${job.proof || job.cost ? `<div class="mt-4 pt-4 border-t border-[#B0EDE6] flex flex-col sm:flex-row gap-4 sm:items-end">
        ${imageBlock(job.proof, 'รูปผลการซ่อม')}
        ${job.cost ? `<div class="text-sm text-slate-600"><span class="text-xs text-slate-400 block">ค่าใช้จ่าย</span>${esc(job.cost)} บาท</div>` : ''}
      </div>` : ''}
    </section>`;
  }

  async function open(id) {
    state.currentJobId = id;
    let job = state.jobs.find(j => j.id === id);
    if (!job && window.firestoreDb) {
      try {
        const docSnap = await window.firestoreDb.collection('tickets').doc(id).get();
        if (docSnap.exists) {
          job = fromFirebase(docSnap.data());
          state.jobs.unshift(job);
        }
      } catch (e) {
        console.warn('Fallback get ticket from Firestore:', e);
      }
    }
    if (!job) return alertBox('warning', 'ไม่พบงาน', 'อาจถูกลบหรือย้ายไปแล้ว กรุณารีเฟรชรายการ');
    nav('page-track-detail');
    const box = $('track-detail-body');
    if (!box) return;
    const t = TYPES[job.type] || { label: 'งานทั่วไป', prefix: 'T', icon: 'fa-wrench', chip: 'bg-slate-100 text-slate-700' };
    
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

  // ---------- ฟังก์ชันปิดงาน (สำหรับช่าง/หัวหน้า) ----------
  async function closeJob(jobId) {
    const job = state.jobs.find(j => j.id === jobId);
    if (!job) return;

    const isSupervisor = (typeof isAdminLoggedIn !== 'undefined' && isAdminLoggedIn) || (typeof currentRole !== 'undefined' && (currentRole === 'Executive' || currentRole === 'Supervisor'));

    const x = await Swal.fire({
      title: 'อัปเดต / ปิดงาน',
      html: `<div class="text-left space-y-3 mt-4 text-slate-900">
               <input id="techName" class="w-full p-2.5 border rounded-lg bg-slate-50" placeholder="ชื่อช่างผู้ซ่อม" value="${job.tech || ''}" readonly>
               <textarea id="fixDetail" rows="2" class="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-[#265D5A] outline-none" placeholder="ซ่อมหรือแก้ไขอะไรไปบ้าง?">${job.fixDetail || ''}</textarea>
               <label class="block text-xs font-semibold text-slate-600 mt-2">รูปภาพผลการซ่อม (บังคับ)</label>
               <input type="file" id="proofFile" accept="image/*" class="w-full p-2 border rounded-lg text-sm bg-slate-50">
               <hr class="my-2 border-slate-200">
               <label class="block text-xs font-semibold text-slate-600">ค่าใช้จ่ายในการซ่อม (บาท) [ไม่บังคับ]</label>
               <input type="number" id="repairCost" min="0" class="w-full p-2.5 border rounded-lg bg-slate-50 focus:ring-2 focus:ring-[#265D5A] outline-none" placeholder="0" value="${job.cost || ''}">
               <label class="block text-xs font-semibold text-slate-600 mt-2">เอกสารใบเสร็จ / เบิกจ่าย [ไม่บังคับ]</label>
               <input type="file" id="receiptFile" accept="image/*,application/pdf" class="w-full p-2 border rounded-lg text-sm bg-slate-50">
             </div>`,
      focusConfirm: false, showCancelButton: true, confirmButtonText: isSupervisor ? 'บันทึกปิดงาน' : 'ส่งงาน (เสร็จสิ้น)', cancelButtonText: 'ยกเลิก',
      preConfirm: () => {
        const techName = document.getElementById('techName').value.trim();
        const fixDetail = document.getElementById('fixDetail').value.trim();
        const file = document.getElementById('proofFile').files[0];
        const cost = document.getElementById('repairCost').value.trim();
        const receipt = document.getElementById('receiptFile').files[0];
        if (!fixDetail || !file) return Swal.showValidationMessage('กรุณากรอกรายละเอียดการแก้ไข และแนบรูปภาพผลการซ่อมให้ครบถ้วนครับ');
        return { techName, fixDetail, file, cost, receipt };
      }
    });

    if (!x.isConfirmed) return;

    if (typeof submitAction === 'function' && typeof readFile === 'function') {
      submitAction(
        async () => {
          const file = await readFile(x.value.file);
          let receiptFile = null;
          if (x.value.receipt) {
            receiptFile = await readFile(x.value.receipt);
          }

          const action = job.type === 'building' ? 'update_task_proof' : 'update_adv_task';
          const tabType = job.type === 'project' ? 'project' : (job.type === 'it' ? 'it' : (job.type === 'av' ? 'av-repair' : ''));
          const newStatus = isSupervisor ? 'เสร็จสิ้น' : 'เสร็จสิ้น';

          // Update Firebase first for snappy UI
          if (window.firestoreDb) {
            await window.firestoreDb.collection('tickets').doc(jobId).set({
              status: newStatus,
              fixDetail: x.value.fixDetail,
              cost: x.value.cost,
              updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
          }
          
          return ResourceHubCore.api.post({
            action: action,
            tabType: tabType,
            rowIndex: job.originalIndex,
            technician: x.value.techName,
            fixDetail: x.value.fixDetail,
            file: file,
            cost: x.value.cost,
            receiptFile: receiptFile,
            status: newStatus
          });
        },
        'อัปเดตและปิดงานเรียบร้อย!',
        () => {
          // Firebase Snapshot will handle the reload
        }
      );
    } else {
      Swal.fire('Error', 'ไม่พบฟังก์ชันที่จำเป็น กรุณารีเฟรชหน้าเว็บ', 'error');
    }
  }

  // ---------- มอบหมายช่างซ่อม (Assign Technician) ----------
  async function assignTech(jobId) {
    const job = state.jobs.find(j => j.id === jobId);
    if (!job) return;
    
    // ตรวจสอบ Cache รายชื่อผู้ใช้ก่อน เพื่อให้เปิดหน้าต่างได้ทันทีโดยไม่ต้องรอดึงข้อมูล
    let users = window.cachedUsers;
    if (!users) {
      try {
        const raw = localStorage.getItem('cached_system_users');
        if (raw) users = JSON.parse(raw);
      } catch (e) {}
    }
    if (!users) {
      Swal.fire({title: 'กำลังโหลดรายชื่อช่าง...', allowOutsideClick: false, didOpen: () => Swal.showLoading()});
      try {
        users = await ResourceHubCore.api.get('get_users');
        window.cachedUsers = users;
        try { localStorage.setItem('cached_system_users', JSON.stringify(users)); } catch(e) {}
      } catch (e) {
        Swal.fire('Error', 'ไม่สามารถโหลดรายชื่อช่างได้', 'error');
        return;
      }
      Swal.close();
    }

    const techList = [];
    users.forEach(u => {
      const email = u[0] ? u[0].toString().trim() : '';
      const name = u[1] ? u[1].toString().trim() : '';
      const role = u[2] ? u[2].toString().trim() : '';
      if (role === 'Tech' || role === 'AV') {
        techList.push({ name, email });
      }
    });

    if (techList.length === 0) {
      Swal.fire('Info', 'ไม่พบรายชื่อช่าง (Tech) หรือเจ้าหน้าที่โสตฯ (AV) ในระบบ', 'info');
      return;
    }

    const urgencyArr = ['ด่วนที่สุด (ภายใน 2 ชม.)', 'ด่วน (ภายใน 24 ชม.)', 'ปานกลาง (2-3 วัน)', 'ตามคิว (ทั่วไป)'];
    let urgencyHtml = '<option value="">ไม่ระบุความเร่งด่วน</option>';
    urgencyArr.forEach(u => {
      const selected = (job.urgency === u) ? 'selected' : '';
      urgencyHtml += `<option value="${u}" ${selected}>${u}</option>`;
    });

    let techOptionsHtml = '<option value="" data-email="">-- ยังไม่มอบหมายช่าง --</option>';
    techList.forEach(t => {
      const selected = (job.tech === t.name) ? 'selected' : '';
      const label = t.email ? `${t.name} (${t.email})` : t.name;
      techOptionsHtml += `<option value="${esc(t.name)}" data-email="${esc(t.email)}" ${selected}>${esc(label)}</option>`;
    });

    const formHtml = `
      <div class="text-left space-y-4 text-slate-800 mt-4 border-t pt-4">
        <div>
          <label class="block text-xs font-semibold mb-2 text-slate-700">ช่างที่รับผิดชอบ (ชื่อ และ อีเมล)</label>
          <select id="assignTechName" class="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-[#265D5A] outline-none text-sm bg-slate-50">
            ${techOptionsHtml}
          </select>
        </div>
        <div>
          <label class="block text-xs font-semibold mb-2 text-slate-700">ความเร่งด่วน</label>
          <select id="assignUrgency" class="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-[#265D5A] outline-none text-sm bg-slate-50">
            ${urgencyHtml}
          </select>
        </div>
      </div>
    `;

    const { value: formValues } = await Swal.fire({
      title: 'มอบหมายช่างซ่อม',
      html: formHtml,
      showCancelButton: true,
      confirmButtonText: '<i class="fa-solid fa-check mr-1"></i> ตกลง',
      confirmButtonColor: '#265D5A',
      cancelButtonText: 'ยกเลิก',
      cancelButtonColor: '#64748b',
      preConfirm: () => {
        const select = document.getElementById('assignTechName');
        const techName = select.value;
        const techEmail = select.options[select.selectedIndex]?.dataset?.email || '';
        const urgency = document.getElementById('assignUrgency').value;
        return { techName, techEmail, urgency };
      }
    });
    
    if (formValues) {
      const { techName, techEmail, urgency } = formValues;
      Swal.fire({title: 'กำลังบันทึกและแจ้งเตือนช่าง...', allowOutsideClick: false, didOpen: () => Swal.showLoading()});
      
      // กำหนดชื่อ Sheet ให้ตรงกับ CONFIG ใน Code.gs เสมอ ('Tasks' มี s)
      const sheetMap = { 'building': 'Tasks', 'it': 'IT_Repairs', 'av': 'AV_Repairs', 'project': 'Facility_Projects' };
      const sheetName = sheetMap[job.type] || 'Tasks';
      
      try {
         // 1. อัปเดตลง Firebase ทันที เพื่อให้ทุกคนเห็นการเปลี่ยนแปลง Real-time (0.2 วิ)
         if (window.firestoreDb) {
            let updateData = {
              techName: techName,
              techEmail: techEmail,
              updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            if (techName && (!job.status || job.status === 'รอดำเนินการ')) {
              updateData.status = 'มอบหมายช่างแล้ว';
            }
            if (urgency) updateData.urgency = urgency;
            await window.firestoreDb.collection('tickets').doc(jobId).set(updateData, { merge: true });
         }
      
         // 2. อัปเดตลง Google Sheets เป็น Backup พร้อมส่งอีเมลแจ้งเตือนถึงช่างคนนั้น
         await ResourceHubCore.api.post({
           action: 'edit_assignment',
           sheetName: sheetName,
           ticketId: jobId,
           rowIndex: job.originalIndex,
           technician: techName,
           technicianEmail: techEmail,
           urgency: urgency
         });
        
        const successMsg = techEmail ? `มอบหมายงานและส่งอีเมลแจ้ง ${esc(techName)} (${esc(techEmail)}) เรียบร้อยแล้ว` : 'มอบหมายช่างสำเร็จ!';
        Swal.fire({icon: 'success', title: 'สำเร็จ!', text: successMsg, confirmButtonColor: '#265D5A', timer: 2500});
      } catch (err) {
        console.error('assignTech error:', err);
        Swal.fire('Error', 'ไม่สามารถมอบหมายงานได้: ' + (err.message || ''), 'error');
      }
    }
  }

  // ---------- ช่างกดรับงานและเริ่มดำเนินงาน (Start Job) ----------
  async function startJob(jobId) {
    let job = state.jobs.find(j => j.id === jobId);
    if (!job) return;

    const { value: note, isConfirmed } = await Swal.fire({
      title: '🛠️ ยืนยันรับงานและเริ่มดำเนินงาน?',
      html: `
        <div class="text-left text-sm text-slate-600 mb-3 space-y-1">
          <p>ยืนยันการรับงานและเริ่มลงมือปฏิบัติงานสำหรับรายการนี้</p>
          <p class="text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg p-2.5">
            <i class="fa-solid fa-circle-info mr-1"></i>สถานะจะเปลี่ยนเป็น <b>"กำลังดำเนินการ"</b> ทันที เพื่อแจ้งให้ผู้แจ้งและระบบทราบ
          </p>
        </div>
        <textarea id="startJobNote" rows="2" class="w-full p-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-[#265D5A] outline-none" placeholder="ข้อความสั้นๆ ถึงผู้แจ้ง (ไม่บังคับ เช่น กำลังเข้าไปดูหน้างานครับ)"></textarea>
      `,
      showCancelButton: true,
      confirmButtonText: '<i class="fa-solid fa-play mr-1"></i> เริ่มดำเนินงาน',
      confirmButtonColor: '#265D5A',
      cancelButtonText: 'ยกเลิก',
      cancelButtonColor: '#64748b',
      preConfirm: () => {
        const el = document.getElementById('startJobNote');
        return el ? el.value.trim() : '';
      }
    });

    if (!isConfirmed) return;

    Swal.fire({
      title: 'กำลังเริ่มดำเนินงาน...',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    try {
      const myNameStr = typeof currentTeacher === 'string' ? currentTeacher.trim() : (localStorage.getItem('logged_teacher') || '').trim();
      const techName = job.tech || myNameStr || 'ช่างผู้รับผิดชอบ';

      // 1. อัปเดต Firestore ทันที (Real-time 0.2s)
      if (window.firestoreDb) {
        const updatePayload = {
          status: 'กำลังดำเนินการ',
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        if (note) {
          updatePayload.fixDetail = note;
        }
        await window.firestoreDb.collection('tickets').doc(jobId).set(updatePayload, { merge: true });

        // ส่งข้อความแจ้งเตือนอัตโนมัติเข้าห้องแชทของงานนั้น
        if (typeof FirebaseChat !== 'undefined' && FirebaseChat.send) {
          const chatMsg = note ? `🔧 ช่าง ${techName} เริ่มดำเนินการแล้ว: ${note}` : `🔧 ช่าง ${techName} เริ่มดำเนินงานแล้ว`;
          try {
            await FirebaseChat.send(jobId, techName, 'tech', chatMsg);
          } catch (chatErr) {
            console.warn('Auto chat notification error:', chatErr);
          }
        }
      }

      // 2. ซิงค์ Google Sheets ในเบื้องหลัง
      const sheetMap = { 'building': 'Tasks', 'it': 'IT_Repairs', 'av': 'AV_Repairs', 'project': 'Facility_Projects' };
      const sheetName = sheetMap[job.type] || 'Tasks';
      ResourceHubCore.api.post({
        action: 'update_task_status',
        sheetName: sheetName,
        ticketId: jobId,
        rowIndex: job.originalIndex,
        status: 'กำลังดำเนินการ',
        technician: techName,
        fixDetail: note || ''
      }).catch(err => console.warn('Sync start status to Sheets error:', err));

      // Local state update immediately
      job.status = 'กำลังดำเนินการ';
      job.step = 2;
      job.group = 'progress';
      if (note) job.fixDetail = note;
      open(jobId);

      Swal.fire({
        icon: 'success',
        title: 'เริ่มดำเนินงานแล้ว!',
        text: 'สถานะเปลี่ยนเป็น "กำลังดำเนินการ" เรียบร้อยแล้ว',
        timer: 1600,
        showConfirmButton: false
      });
    } catch (err) {
      console.error('startJob error:', err);
      Swal.fire('Error', 'ไม่สามารถเริ่มงานได้: ' + (err.message || ''), 'error');
    }
  }

  // ---------- ช่างแจ้งความคืบหน้าระหว่างซ่อม (Update Progress) ----------
  async function updateProgress(jobId) {
    let job = state.jobs.find(j => j.id === jobId);
    if (!job) return;

    const { value: note, isConfirmed } = await Swal.fire({
      title: '💬 แจ้งความคืบหน้างาน',
      html: `
        <div class="text-left text-sm text-slate-600 mb-3 space-y-1">
          <p>บันทึกหรือทิ้งโน้ตอัปเดตความคืบหน้าให้ผู้แจ้งและทีมงานทราบ</p>
          <p class="text-xs text-slate-400">เช่น กำลังรออะไหล่ หรือ ดำเนินการแก้ไขระบบไฟเรียบร้อย กำลังทดสอบ</p>
        </div>
        <textarea id="progressNote" rows="3" class="w-full p-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-[#265D5A] outline-none" placeholder="ระบุความคืบหน้า...">${job.fixDetail || ''}</textarea>
      `,
      showCancelButton: true,
      confirmButtonText: '<i class="fa-solid fa-paper-plane mr-1"></i> บันทึกความคืบหน้า',
      confirmButtonColor: '#265D5A',
      cancelButtonText: 'ยกเลิก',
      cancelButtonColor: '#64748b',
      preConfirm: () => {
        const el = document.getElementById('progressNote');
        const val = el ? el.value.trim() : '';
        if (!val) {
          Swal.showValidationMessage('กรุณากรอกข้อความความคืบหน้า');
          return false;
        }
        return val;
      }
    });

    if (!isConfirmed || !note) return;

    Swal.fire({
      title: 'กำลังบันทึกความคืบหน้า...',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    try {
      const myNameStr = typeof currentTeacher === 'string' ? currentTeacher.trim() : (localStorage.getItem('logged_teacher') || '').trim();
      const techName = job.tech || myNameStr || 'ช่างผู้รับผิดชอบ';

      if (window.firestoreDb) {
        await window.firestoreDb.collection('tickets').doc(jobId).set({
          fixDetail: note,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        if (typeof FirebaseChat !== 'undefined' && FirebaseChat.send) {
          try {
            await FirebaseChat.send(jobId, techName, 'tech', `📢 แจ้งความคืบหน้า: ${note}`);
          } catch(e) {}
        }
      }

      const sheetMap = { 'building': 'Tasks', 'it': 'IT_Repairs', 'av': 'AV_Repairs', 'project': 'Facility_Projects' };
      const sheetName = sheetMap[job.type] || 'Tasks';
      ResourceHubCore.api.post({
        action: 'append_task_details',
        sheetName: sheetName,
        rowIndex: job.originalIndex,
        newDetails: note
      }).catch(err => console.warn('Sync progress note to Sheets error:', err));

      job.fixDetail = note;
      open(jobId);

      Swal.fire({
        icon: 'success',
        title: 'บันทึกสำเร็จ!',
        text: 'แจ้งความคืบหน้าเรียบร้อยแล้ว',
        timer: 1500,
        showConfirmButton: false
      });
    } catch (err) {
      console.error('updateProgress error:', err);
      Swal.fire('Error', 'ไม่สามารถบันทึกได้: ' + (err.message || ''), 'error');
    }
  }

  function renderChatMessages(messages) {
    const box = $('track-chat-messages');
    if (!box) return;
    
    if (messages.length === 0) {
      box.innerHTML = '<div class="text-center text-slate-400 text-sm mt-10">ยังไม่มีข้อความสนทนา เริ่มพิมพ์สอบถามได้เลยครับ</div>';
      return;
    }
    
    const myName = isAdminLoggedIn ? 'Admin' : ((typeof currentTeacher === 'string' && currentTeacher) ? currentTeacher : (currentTeacher?.name || 'Unknown'));
    
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
      
      const senderName = isAdminLoggedIn ? 'Admin' : ((typeof currentTeacher === 'string' && currentTeacher) ? currentTeacher : (currentTeacher?.name || 'Unknown'));
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




  // ---------- ดึงข้อมูลจาก Google Sheets เข้า Firebase (Optimized Batch Write & Silent Auto-Sync) ----------
  async function migrateFromSheets(silent = false) {
    if (!window.firestoreDb) {
      if (!silent) alertBox('error', 'ข้อผิดพลาด', 'ยังไม่ได้เชื่อมต่อ Firebase');
      return;
    }

    if (!silent) {
      const confirm = await Swal.fire({
        title: 'ดึงข้อมูลจาก Google Sheet?',
        html: 'ระบบจะดึงข้อมูลทั้งหมดจาก Google Sheets และบันทึกเข้า Firebase<br><b>รายการที่มีอยู่แล้วจะไม่ถูกทับ</b>',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: '<i class="fa-solid fa-cloud-arrow-down mr-1"></i> ดึงข้อมูลทันที',
        confirmButtonColor: '#265D5A',
        cancelButtonText: 'ยกเลิก',
        cancelButtonColor: '#64748b'
      });
      if (!confirm.isConfirmed) return;

      Swal.fire({
        title: 'กำลังซิงก์ข้อมูลจาก Sheet...',
        html: 'กำลังเชื่อมต่อและดึงข้อมูลทุกหมวด<br>กรุณารอสักครู่ (ประมาณ 1-3 วินาที)',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      });
    }

    try {
      const [buildingData, avData, advData] = await Promise.all([
        ResourceHubCore.api.get('get_tasks').catch(() => []),
        ResourceHubCore.api.get('get_av_requests').catch(() => []),
        ResourceHubCore.api.get('get_adv_tasks').catch(() => ({ it: [], av: [], project: [] }))
      ]);

      const parseDateToTs = (v) => {
        if (!v) return null;
        if (v instanceof Date) return firebase.firestore.Timestamp.fromDate(v);
        const parsed = parseDate(v);
        if (parsed && !isNaN(parsed)) return firebase.firestore.Timestamp.fromDate(parsed);
        const d = new Date(v);
        return isNaN(d) ? null : firebase.firestore.Timestamp.fromDate(d);
      };

      const items = [];

      // 1. อาคาร
      if (Array.isArray(buildingData)) {
        buildingData.forEach((row, idx) => {
          if (!row || !row[0]) return;
          items.push({
            ticketId: row[16] || `BLD-LEG-${String(idx+1).padStart(3,'0')}`,
            type: 'building',
            subject: row[1] || row[2] || 'แจ้งซ่อมบำรุงอาคาร',
            detail: row[2] || '',
            reporterName: row[3] || '',
            status: row[4] || 'รอดำเนินการ',
            fileUrl: (row[5] && row[5] !== '-') ? row[5] : '',
            fixDetail: row[6] || '',
            techName: row[7] || '',
            proofUrl: (row[8] && row[8] !== '-') ? row[8] : '',
            cost: row[9] || '',
            urgency: row[11] || '',
            dept: row[12] || '',
            location: row[13] || '',
            incidentDate: parseDateToTs(row[14]),
            contact: row[15] || '',
            createdAt: parseDateToTs(row[0]) || firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            isMigrated: true
          });
        });
      }

      // 2. ยืมโสตฯ
      if (Array.isArray(avData)) {
        avData.forEach((row, idx) => {
          if (!row || !row[0]) return;
          items.push({
            ticketId: `AV-REQ-${String(idx+1).padStart(3,'0')}`,
            type: 'av',
            subject: 'ขอยืม-คืนโสตทัศนูปกรณ์',
            detail: row[2] || '',
            reporterName: row[1] || '',
            status: row[5] || 'จัดเตรียมแล้ว',
            location: row[4] ? String(row[4]) : '',
            techName: row[6] || '',
            incidentDate: parseDateToTs(row[3]),
            createdAt: parseDateToTs(row[0]) || firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            isMigrated: true
          });
        });
      }

      // 3. IT
      if (advData && Array.isArray(advData.it)) {
        advData.it.forEach((row, idx) => {
          if (!row || !row[0]) return;
          items.push({
            ticketId: `IT-LEG-${String(idx+1).padStart(3,'0')}`,
            type: 'it',
            subject: row[1] || 'แจ้งซ่อมไอที',
            detail: row[2] || '',
            reporterName: row[3] || '',
            status: row[4] || 'รอดำเนินการ',
            urgency: row[6] || '',
            createdAt: parseDateToTs(row[0]) || firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            isMigrated: true
          });
        });
      }

      // 4. ซ่อมโสตฯ
      if (advData && Array.isArray(advData.av)) {
        advData.av.forEach((row, idx) => {
          if (!row || !row[0]) return;
          items.push({
            ticketId: `AV-REP-${String(idx+1).padStart(3,'0')}`,
            type: 'av',
            subject: row[1] || 'แจ้งซ่อมอุปกรณ์โสตฯ',
            detail: row[2] || '',
            reporterName: row[3] || '',
            status: row[4] || 'รอดำเนินการ',
            urgency: row[6] || '',
            createdAt: parseDateToTs(row[0]) || firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            isMigrated: true
          });
        });
      }

      // 5. โครงการ
      if (advData && Array.isArray(advData.project)) {
        advData.project.forEach((row, idx) => {
          if (!row || !row[0]) return;
          items.push({
            ticketId: `PRJ-LEG-${String(idx+1).padStart(3,'0')}`,
            type: 'project',
            subject: row[1] || 'เสนอโครงการ/จัดซื้อ',
            detail: row[2] || '',
            reporterName: row[3] || '',
            status: row[4] || 'รอพิจารณาอนุมัติ',
            urgency: row[6] || '',
            createdAt: parseDateToTs(row[0]) || firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            isMigrated: true
          });
        });
      }

      if (!items.length) {
        if (!silent) throw new Error('ไม่พบข้อมูลจาก Google Sheet');
        return;
      }

      // ตรวจสอบ ID ที่มีอยู่แล้วใน Firebase เพียง 1 query เดียว (ไม่ต้อง loop get)
      const existingSnap = await window.firestoreDb.collection('tickets').get();
      const existingIds = new Set();
      existingSnap.forEach(doc => existingIds.add(doc.id));

      const newItems = items.filter(item => !existingIds.has(item.ticketId));

      // บันทึกเฉพาะรายการใหม่ด้วย Batch Write (เร็วสูงสุด 500 รายการต่อ 1 request)
      if (newItems.length > 0) {
        const batchSize = 450;
        for (let i = 0; i < newItems.length; i += batchSize) {
          const chunk = newItems.slice(i, i + batchSize);
          const batch = window.firestoreDb.batch();
          chunk.forEach(item => {
            const ref = window.firestoreDb.collection('tickets').doc(item.ticketId);
            batch.set(ref, item);
          });
          await batch.commit();
        }
      }

      const added = newItems.length;
      state.loaded = false;
      await load(true);

      if (!silent) {
        Swal.fire({
          icon: 'success',
          title: 'ซิงก์ข้อมูลสำเร็จ!',
          html: `เพิ่มรายการใหม่ <b>${added}</b> รายการ (จากทั้งหมด ${items.length} รายการใน Sheet)`,
          confirmButtonColor: '#265D5A'
        });
      } else {
        console.log(`[AutoSync] Synced ${added} new items from Sheets into Firebase.`);
      }

    } catch (e) {
      console.error(e);
      if (!silent) {
        Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: e.message, confirmButtonColor: '#e11d48' });
      }
    }
  }

  // ตัวกระตุ้น Silent Auto-Sync เบื้องหลัง (ไม่รบกวนหน้าจอ ไม่เด้ง Modal)
  let lastAutoSyncTime = 0;
  function triggerSilentAutoSync() {
    const isManager = (typeof isAdminLoggedIn !== 'undefined' && isAdminLoggedIn) || 
                      (typeof currentRole !== 'undefined' && (currentRole === 'Executive' || currentRole === 'Supervisor' || currentRole === 'Admin'));
    if (!isManager) return;
    const now = Date.now();
    // อนุญาตให้รันเบื้องหลังสูงสุด 1 ครั้งทุกๆ 10 นาที
    if (now - lastAutoSyncTime > 10 * 60 * 1000) {
      lastAutoSyncTime = now;
      setTimeout(() => {
        migrateFromSheets(true).catch(e => console.warn('Silent auto-sync:', e));
      }, 3000);
    }
  }

  // ---------- Actions ----------
  return {
    load,
    open,
    startJob,
    updateProgress,
    assignTech,
    closeJob,
    submitChat,
    previewChatImage,
    clearChatImage,
    migrateFromSheets,
    backToList() {
      state.currentJobId = null;
      nav('page-track');
    },
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
    // เปิดหน้ารายการพร้อมตั้งค่าเริ่มต้น (เช่น หลังแจ้งซ่อมเสร็จ หรือกดจัดการงานจากการ์ด)
    show(opts = {}) {
      state.currentJobId = null;
      if (opts.mineOnly !== undefined) state.mineOnly = !!opts.mineOnly && !!currentTeacher;
      if (opts.type !== undefined) state.type = opts.type;
      if (opts.status !== undefined) state.status = opts.status;
      if (opts.force) state.loaded = false;
      nav('page-track');
      render();
      load(opts.force);
      triggerSilentAutoSync();
    }
  };
})();

window.TrackUI = TrackUI;

// ปุ่ม/ลิงก์เดิมที่เคยเปิด Modal ติดตามงาน ให้มาที่หน้าติดตามงานใหม่แทน
window.openTrackModal = function () { TrackUI.show(); };
window.promptTrackTicket = function () { TrackUI.show({ mineOnly: true }); };
window.loadFbAdminTickets = function () {
  const type = $('fb-admin-filter-type')?.value || 'all';
  const status = $('fb-admin-filter-status')?.value || 'all';
  TrackUI.show({ type: type === 'all' ? 'all' : type, status: status === 'all' ? 'all' : status });
};
