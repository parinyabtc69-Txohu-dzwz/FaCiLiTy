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
    showArchived: false,
    searchTimer: null
  };

  let currentChatUnsubscribe = null;
  let currentChatTicketId = null;
  let currentChatImageFile = null;

  // ---------- ข้อมูลประเภทงาน ----------
  const TYPES = {
    building: { label: 'ซ่อมอาคาร', prefix: 'BLD', icon: 'fa-wrench', chip: 'bg-[#B0EDE6] text-[#265D5A]' },
    it: { label: 'ซ่อมไอที', prefix: 'IT', icon: 'fa-desktop', chip: 'bg-sky-100 text-sky-700' },
    av: { label: 'ซ่อมโสตฯ', prefix: 'AV', icon: 'fa-camera', chip: 'bg-amber-100 text-amber-700' },
    project: { label: 'โครงการ', prefix: 'PRJ', icon: 'fa-building-circle-check', chip: 'bg-violet-100 text-violet-700' }
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

  function getUserRole() {
    const r = (typeof currentRole !== 'undefined' && currentRole) ? currentRole : (localStorage.getItem('logged_role') || '');
    if (r) return r;
    if (typeof isAdminLoggedIn !== 'undefined' && isAdminLoggedIn) return 'Admin';
    return 'Teacher';
  }

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
    const role = getUserRole();
    // ผู้บริหารเข้ามาดูภาพรวมเท่านั้น ไม่ปฏิบัติการหรือจัดการงานซ่อมรายวัน
    if (role === 'Executive') return false;

    // 1. Role เป็น Admin หรือ Supervisor
    if (role === 'Supervisor' || role === 'Admin') return true;

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

  // ตรวจสอบว่าเป็นผู้แจ้งเรื่อง (เจ้าของงานตัวจริง) หรือไม่
  function isReporter(job) {
    if (!job) return false;
    const myName = ((typeof currentTeacher === 'string' ? currentTeacher : (currentTeacher?.name || '')) || (localStorage.getItem('logged_teacher') || '')).trim();
    const myEmail = ((typeof currentEmail === 'string' ? currentEmail : '') || (localStorage.getItem('logged_email') || '')).trim().toLowerCase();
    if (myName && job.reporter) {
      const me = normName(myName);
      const rep = normName(job.reporter);
      if (me && rep && (me === rep || (me.length >= 3 && rep.includes(me)) || (rep.length >= 3 && me.includes(rep)))) {
        return true;
      }
    }
    if (myEmail && job.reporterEmail && myEmail === job.reporterEmail.trim().toLowerCase()) {
      return true;
    }
    if (myEmail && job.contact && job.contact.trim().toLowerCase().includes(myEmail)) {
      return true;
    }
    return false;
  }

  function canDeleteJob(job) {
    if (!job) return false;
    const role = getUserRole();
    if (role === 'Executive') return false; // ผู้บริหารไม่ลบงานซ่อม ป้องกันข้อมูลสูญหาย
    // 1. ระดับหัวหน้างาน หรือ แอดมิน
    if (role === 'Supervisor' || role === 'Admin') return true;
    // 2. ผู้แจ้งเรื่อง (เจ้าของงาน)
    if (isReporter(job)) return true;
    return false;
  }

  function canSnoozeJob(job) {
    if (!job) return false;
    const role = getUserRole();
    if (role === 'Executive') return false; // ผู้บริหารไม่ปรับความเร่งด่วนหรือเลื่อนเวลา
    return canManageJob(job);
  }

  // ---------- ระบบจัดการสถานะอ่านแล้ว/ยังไม่อ่าน (Gmail Style) ----------
  function getReadSet() {
    try {
      const userKey = (typeof currentEmail === 'string' && currentEmail) || (typeof currentTeacher === 'string' && currentTeacher) || 'guest';
      const raw = localStorage.getItem('read_tickets_' + userKey);
      return new Set(raw ? JSON.parse(raw) : []);
    } catch(e) {
      return new Set();
    }
  }

  function saveReadSet(readSet) {
    try {
      const userKey = (typeof currentEmail === 'string' && currentEmail) || (typeof currentTeacher === 'string' && currentTeacher) || 'guest';
      localStorage.setItem('read_tickets_' + userKey, JSON.stringify([...readSet]));
    } catch(e) {}
  }

  function toggleRead(jobId, event) {
    if (event) event.stopPropagation();
    const readSet = getReadSet();
    const isRead = readSet.has(jobId);
    if (isRead) {
      readSet.delete(jobId);
    } else {
      readSet.add(jobId);
    }
    saveReadSet(readSet);
    render();
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'info',
      title: isRead ? 'ทำเครื่องหมายว่า "ยังไม่อ่าน"' : 'ทำเครื่องหมายว่า "อ่านแล้ว"',
      showConfirmButton: false,
      timer: 1500
    });
  }

  // ---------- จัดเก็บเข้าคลัง / ยกเลิกการจัดเก็บ (Archive) ----------
  async function toggleArchive(jobId, event) {
    if (event) event.stopPropagation();
    const job = state.jobs.find(j => j.id === jobId);
    if (!job) return;

    const newArchived = !job.isArchived;
    const actionText = newArchived ? 'จัดเก็บงานเข้าคลังเรียบร้อย' : 'นำงานกลับมาที่คิวปกติเรียบร้อย';

    try {
      if (window.firestoreDb) {
        await window.firestoreDb.collection('tickets').doc(job.id).update({
          isArchived: newArchived
        });
      }
      job.isArchived = newArchived;
      render();
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: actionText,
        showConfirmButton: false,
        timer: 2000
      });
    } catch (err) {
      console.error('Archive error:', err);
      Swal.fire('ข้อผิดพลาด', 'ไม่สามารถเปลี่ยนสถานะการจัดเก็บได้: ' + err.message, 'error');
    }
  }

  function toggleArchived() {
    state.showArchived = !state.showArchived;
    const btn = $('track-archived-btn');
    if (btn) {
      if (state.showArchived) {
        btn.classList.add('bg-[#265D5A]', 'text-white', 'border-[#265D5A]');
        btn.classList.remove('bg-white', 'text-slate-600', 'border-slate-200');
      } else {
        btn.classList.remove('bg-[#265D5A]', 'text-white', 'border-[#265D5A]');
        btn.classList.add('bg-white', 'text-slate-600', 'border-slate-200');
      }
    }
    render();
  }

  // ---------- ลบงานออกจากระบบ (Delete) ----------
  async function deleteJob(jobId, event) {
    if (event) event.stopPropagation();
    const job = state.jobs.find(j => j.id === jobId);
    if (!job) return;

    if (!canDeleteJob(job)) {
      Swal.fire({
        icon: 'error',
        title: 'ไม่มีสิทธิ์ลบรายการนี้',
        text: 'เฉพาะเจ้าของงาน (ผู้แจ้ง) หรือระดับหัวหน้างาน/ผู้ดูแลระบบเท่านั้นที่สามารถลบได้'
      });
      return;
    }

    const confirm = await Swal.fire({
      title: 'ยืนยันการลบงาน?',
      html: `คุณต้องการลบงาน <b>#${job.id}</b> (${esc(job.subject)}) หรือไม่?<br><span class="text-xs text-rose-500">ข้อมูลที่ลบจะไม่สามารถกู้คืนได้</span>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'ใช่, ลบเลย',
      cancelButtonText: 'ยกเลิก'
    });

    if (!confirm.isConfirmed) return;

    Swal.fire({ title: 'กำลังลบข้อมูล...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
    try {
      if (window.firestoreDb) {
        await window.firestoreDb.collection('tickets').doc(job.id).delete();
      }
      state.jobs = state.jobs.filter(j => j.id !== jobId);
      render();
      Swal.fire('สำเร็จ', 'ลบงานเรียบร้อยแล้ว', 'success');
    } catch (err) {
      console.error('Delete job error:', err);
      Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถลบงานได้: ' + err.message, 'error');
    }
  }

  // ---------- เลื่อนเวลา / ปรับความเร่งด่วน (Snooze) ----------
  async function openSnooze(jobId, event) {
    if (event) event.stopPropagation();
    const job = state.jobs.find(j => j.id === jobId);
    if (!job) return;

    if (!canSnoozeJob(job)) {
      Swal.fire({
        icon: 'warning',
        title: 'ไม่มีสิทธิ์ตั้งเตือน/ปรับความเร่งด่วน',
        text: 'เฉพาะช่างผู้รับผิดชอบงาน หรือระดับหัวหน้างาน/ผู้ดูแลระบบเท่านั้น'
      });
      return;
    }

    const { value: formValues } = await Swal.fire({
      title: 'ตั้งเตือน / ปรับความเร่งด่วน',
      html: `
        <div class="text-left space-y-4 pt-2">
          <div>
            <label class="block text-xs font-semibold text-slate-600 mb-1">ระดับความเร่งด่วน (Urgency)</label>
            <select id="swal-snooze-urgency" class="w-full p-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-[#265D5A]">
              <option value="ด่วนที่สุด (ภายใน 2 ชม.)" ${job.urgency?.includes('2 ชม.') ? 'selected' : ''}>🔴 ด่วนที่สุด (ภายใน 2 ชม.)</option>
              <option value="ด่วน (ภายใน 24 ชม.)" ${job.urgency?.includes('24 ชม.') ? 'selected' : ''}>🟡 ด่วน (ภายใน 24 ชม.)</option>
              <option value="ปานกลาง (2-3 วัน)" ${job.urgency?.includes('2-3 วัน') ? 'selected' : ''}>🔵 ปานกลาง (2-3 วัน)</option>
              <option value="ตามคิว (ทั่วไป)" ${!job.urgency || job.urgency?.includes('ทั่วไป') ? 'selected' : ''}>⚪ ตามคิว (ทั่วไป)</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-600 mb-1">บันทึกช่วยจำ / เลื่อนกำหนดติดตาม</label>
            <input type="text" id="swal-snooze-note" class="w-full p-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-[#265D5A]" placeholder="เช่น เลื่อนตรวจเช็คพรุ่งนี้ 09:00 น." value="${esc(job.snoozeNote || '')}">
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'บันทึก',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#265D5A',
      preConfirm: () => {
        return {
          urgency: document.getElementById('swal-snooze-urgency').value,
          note: document.getElementById('swal-snooze-note').value.trim()
        };
      }
    });

    if (!formValues) return;

    try {
      if (window.firestoreDb) {
        await window.firestoreDb.collection('tickets').doc(job.id).update({
          urgency: formValues.urgency,
          snoozeNote: formValues.note
        });
      }
      job.urgency = formValues.urgency;
      job.snoozeNote = formValues.note;
      render();
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'บันทึกข้อมูลเรียบร้อยแล้ว',
        showConfirmButton: false,
        timer: 2000
      });
    } catch (err) {
      console.error('Snooze update error:', err);
      Swal.fire('ข้อผิดพลาด', err.message, 'error');
    }
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
      reporter: docData.reporterName || docData.reporter || '',
      reporterEmail: docData.reporterEmail || docData.email || '',
      status: status,
      group: cls.group,
      step: cls.step,
      image: docData.fileUrl || '',
      fixDetail: docData.fixDetail || '',
      tech: docData.techName || docData.tech || '',
      techEmail: docData.techEmail || '',
      proof: docData.proofUrl || '',
      cost: docData.cost || '',
      urgency: docData.urgency || '',
      dept: docData.dept || '',
      location: docData.location || '',
      incident: incidentDate,
      contact: docData.contact || '',
      isArchived: Boolean(docData.isArchived),
      snoozeNote: docData.snoozeNote || '',
      approvedBy: docData.approvedBy || '',
      approvedAt: docData.approvedAt ? (docData.approvedAt.toDate ? docData.approvedAt.toDate() : docData.approvedAt) : null,
      approvalNote: docData.approvalNote || '',
      allocatedBudget: docData.allocatedBudget || '',
      rejectedBy: docData.rejectedBy || ''
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
    if (!job) return false;
    // 1. ตนเองเป็นผู้แจ้งเรื่อง
    if (isReporter(job)) return true;

    // 2. ถ้าเป็นช่าง (Tech) หรือ เจ้าหน้าที่โสตฯ (AV) งานที่ได้รับมอบหมายก็นับเป็น "งานของฉัน" ด้วย
    const role = getUserRole();
    if (role === 'Tech' || role === 'AV') {
      if (canManageJob(job)) return true;
    }

    return false;
  }

  // ---------- สิทธิ์การมองเห็นคิวงานตาม Role ----------
  function isJobVisibleForRole(job, role) {
    if (!job) return false;
    // ผู้ใช้งานระบบ (Teacher): เห็นเฉพาะงานของตนเองเท่านั้นอย่างเด็ดขาด
    if (role === 'Teacher') {
      return isMine(job);
    }

    // งานของตนเอง (แจ้งเอง หรือ ได้รับมอบหมาย) ให้เห็นเสมอ
    if (isMine(job)) return true;

    // สิทธิ์การมองเห็นคิวงานส่วนกลาง
    if (role === 'Admin' || role === 'Supervisor' || role === 'Executive') {
      return true; // เห็นทุกประเภท 100%
    }
    if (role === 'Tech') {
      // ช่างอาคาร/ไอที เห็นงานอาคารและไอที
      return job.type === 'building' || job.type === 'it';
    }
    if (role === 'AV') {
      // เจ้าหน้าที่โสตฯ เห็นงานโสตฯ
      return job.type === 'av';
    }
    // Staff / อื่นๆ
    if (role === 'Staff') {
      return job.type === 'building' || job.type === 'it' || job.type === 'av';
    }
    return isMine(job);
  }

  function sanitizeTypeForRole(role, currentType) {
    if (currentType === 'all') return 'all';
    if (role === 'Tech' && (currentType === 'av' || currentType === 'project')) return 'all';
    if (role === 'AV' && (currentType === 'building' || currentType === 'it' || currentType === 'project')) return 'all';
    if ((role === 'Teacher' || role === 'Staff') && currentType === 'project') return 'all';
    return currentType;
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
          let hasLegacyId = false;
          snapshot.forEach(doc => {
            const data = doc.data();
            const tid = data.ticketId || doc.id || '';
            if (/\d{10,}/.test(tid) || tid.includes('-LEG-') || tid.includes('-REQ-') || tid.includes('-REP-')) {
              hasLegacyId = true;
            }
            jobs.push(fromFirebase(data));
          });
          
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

          // ตรวจจับและปรับรหัสคิวงานเก่าให้เป็นรหัสสั้นใหม่อัตโนมัติ (BLD-01)
          if (hasLegacyId && !state.reindexing) {
            state.reindexing = true;
            setTimeout(() => { reindexTickets(false); }, 1500);
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
    const role = getUserRole();
    return state.jobs.filter(j => {
      // ตรวจสอบสิทธิ์การมองเห็นตาม Role
      if (!isJobVisibleForRole(j, role)) return false;
      if (role === 'Teacher' && !isMine(j)) return false;

      if (state.showArchived) {
        if (!j.isArchived) return false;
      } else {
        if (j.isArchived) return false;
      }
      if (state.type !== 'all' && j.type !== state.type) return false;
      if (state.mineOnly && !isMine(j)) return false;
      if (!ignoreStatus && state.status !== 'all') {
        if (state.status === 'progress' && j.group !== 'progress') return false;
        if (state.status === 'pending' && j.group !== 'pending') return false;
        if (state.status === 'done' && j.group !== 'done') return false;
      }
      if (q) {
        const hay = [j.id, j.subject, j.detail, j.reporter, j.location, j.dept, j.tech, j.status, TYPES[j.type]?.label || '']
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
    const role = getUserRole();

    // 0. อัปเดตข้อความหัวข้อตาม Role
    const sub = $('track-header-subtitle');
    if (sub) {
      sub.textContent = (role === 'Teacher')
        ? 'ติดตามสถานะงานซ่อมของคุณ กดที่งานเพื่อดูรายละเอียดและข้อความจากช่าง'
        : 'ดูคิวงานทั้งหมดในระบบ กดที่งานเพื่อดูรายละเอียดและข้อความจากช่าง';
    }

    // 1. ตัวเลือกสถานะ (สำหรับ Teacher เปลี่ยนป้าย "งานทั้งหมด" เป็น "งานของตัวเอง")
    const allLabel = $('track-stat-all-label') || document.querySelector('#track-summary .track-stat[data-status="all"] > div:first-child');
    if (allLabel) {
      allLabel.textContent = (role === 'Teacher') ? 'งานของตัวเอง' : 'งานทั้งหมด';
    }

    $$('#track-summary .track-stat').forEach(b => {
      const on = b.dataset.status === state.status;
      b.classList.toggle('border-[#265D5A]', on);
      b.classList.toggle('ring-2', on);
      b.classList.toggle('ring-[#B0EDE6]', on);
      b.classList.toggle('border-slate-200', !on);
    });

    // 2. แถบประเภทงาน (Pills) กรองตาม Role
    $$('#track-type-filters .track-type').forEach(b => {
      const t = b.dataset.type;
      let isAllowed = true;
      if (role === 'Tech') {
        isAllowed = (t === 'all' || t === 'building' || t === 'it');
      } else if (role === 'AV') {
        isAllowed = (t === 'all' || t === 'av');
      } else if (role === 'Teacher' || role === 'Staff') {
        isAllowed = (t !== 'project');
      }
      b.classList.toggle('hidden', !isAllowed);

      const on = t === state.type;
      b.className = 'track-type px-3.5 py-2 rounded-full text-xs font-medium border transition-colors ' +
        (!isAllowed ? 'hidden ' : '') +
        (on ? 'bg-[#265D5A] text-white border-[#265D5A]' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50');
    });

    // 3. ปุ่ม "เฉพาะงานของฉัน" / "งานของตัวเอง"
    const mine = $('track-mine-btn');
    if (mine) {
      if (role === 'Teacher') {
        mine.innerHTML = '<i class="fa-solid fa-user"></i> งานของตัวเอง';
        mine.className = 'px-4 py-2 rounded-full text-sm font-medium border transition-colors flex items-center gap-2 bg-[#265D5A] text-white border-[#265D5A] cursor-default shadow-sm';
        mine.title = 'สิทธิ์ผู้ใช้งานระบบ: แสดงเฉพาะงานของตนเอง';
      } else {
        mine.innerHTML = '<i class="fa-solid fa-user"></i> เฉพาะงานของฉัน';
        mine.className = 'px-4 py-2 rounded-full text-sm font-medium border transition-colors flex items-center gap-2 ' +
          (state.mineOnly ? 'bg-[#265D5A] text-white border-[#265D5A]' : 'border-[#265D5A]/30 text-[#265D5A] bg-white hover:bg-[#E0F7F4]');
        mine.title = '';
      }
    }

    // 4. ปุ่ม "ดึงข้อมูลจาก Sheet" (เฉพาะ Admin และ Supervisor)
    const migrateBtn = $('track-migrate-btn');
    if (migrateBtn) {
      if (role === 'Admin' || role === 'Supervisor') {
        migrateBtn.classList.remove('hidden');
      } else {
        migrateBtn.classList.add('hidden');
      }
    }

    // 4.1 ปุ่ม "จัดลำดับเลขคิวใหม่" (เฉพาะ Admin และ Supervisor)
    const reindexBtn = $('track-reindex-btn');
    if (reindexBtn) {
      if (role === 'Admin' || role === 'Supervisor') {
        reindexBtn.classList.remove('hidden');
      } else {
        reindexBtn.classList.add('hidden');
      }
    }

    // 5. ปุ่ม "คลังจัดเก็บ" (เฉพาะ Admin และ Supervisor)
    const archiveBtn = $('track-archived-btn');
    if (archiveBtn) {
      if (role === 'Admin' || role === 'Supervisor') {
        archiveBtn.classList.remove('hidden');
        archiveBtn.classList.add('flex');
      } else {
        archiveBtn.classList.add('hidden');
        archiveBtn.classList.remove('flex');
      }
    }
  }

  function render() {
    updateControls();

    const list = $('track-list');
    if (!list) return;

    const role = getUserRole();

    // ตัวเลขสรุป (ตามประเภท/ค้นหา/งานของฉัน แต่ไม่กรองสถานะ)
    const base = filtered(true);
    const count = g => base.filter(j => j.group === g).length;
    if ($('track-count-all')) $('track-count-all').textContent = base.length;
    if ($('track-count-pending')) $('track-count-pending').textContent = count('pending');
    if ($('track-count-progress')) $('track-count-progress').textContent = count('progress');
    if ($('track-count-done')) $('track-count-done').textContent = count('done');

    const items = filtered();
    if ($('track-result-info')) {
      if (role === 'Teacher') {
        $('track-result-info').textContent = `พบ ${items.length} งาน (งานของตัวเอง) · เรียงจากล่าสุด`;
      } else {
        $('track-result-info').textContent = `พบ ${items.length} งาน` + (state.mineOnly ? ' (เฉพาะงานของฉัน)' : '') + ' · เรียงจากล่าสุด';
      }
    }

    if (!items.length) {
      if (role === 'Teacher') {
        list.innerHTML = `<div class="col-span-full p-10 text-center text-slate-500 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
          <i class="fa-regular fa-folder-open text-3xl mb-3 text-slate-300"></i>
          <div class="font-medium text-slate-700 mb-1">${state.search || state.status !== 'all' || state.type !== 'all' ? 'ไม่พบงานที่ตรงกับเงื่อนไข' : 'ยังไม่มีประวัติการแจ้งซ่อมของคุณในระบบ'}</div>
          <p class="text-xs text-slate-400 mb-4">${state.search || state.status !== 'all' || state.type !== 'all' ? 'ลองเปลี่ยนคำค้นหาหรือตัวกรองสถานะ' : 'เมื่อคุณแจ้งซ่อมผ่านระบบ รายการงานของคุณจะมาแสดงที่นี่เพื่อติดตามสถานะ'}</p>
          <button onclick="nav('page-repair')" class="px-4 py-2 bg-[#265D5A] text-white text-xs font-medium rounded-xl shadow-sm hover:bg-[#1f4b48] transition-colors"><i class="fa-solid fa-plus mr-1"></i> แจ้งซ่อมใหม่</button>
        </div>`;
      } else {
        list.innerHTML = `<div class="col-span-full p-10 text-center text-slate-500 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
          <i class="fa-regular fa-folder-open text-3xl mb-3 text-slate-300"></i><br>
          ${state.search || state.mineOnly || state.status !== 'all' || state.type !== 'all' ? 'ไม่พบงานที่ตรงกับเงื่อนไข ลองเปลี่ยนคำค้นหาหรือตัวกรอง' : 'ยังไม่มีงานในระบบ'}
        </div>`;
      }
      return;
    }

    const dotColors = {
      pending: 'bg-rose-500 ring-2 ring-rose-200 animate-pulse',
      progress: 'bg-amber-400 ring-2 ring-amber-200',
      done: 'bg-emerald-500 ring-2 ring-emerald-200',
      cancel: 'bg-slate-400 ring-2 ring-slate-200'
    };

    const readSet = getReadSet();

    list.innerHTML = items.map(j => {
      const t = TYPES[j.type] || { chip: 'bg-slate-100 text-slate-600', icon: 'fa-wrench', label: 'ทั่วไป' };
      const mine = isMine(j);
      const dotCls = dotColors[j.group] || 'bg-slate-400';
      const isRead = readSet.has(j.id);
      const userCanDelete = canDeleteJob(j);

      return `
      <div onclick="TrackUI.open('${j.id}')" role="button" tabindex="0" id="track-item-${j.id}"
        class="w-full text-left px-4 py-3.5 rounded-2xl border ${mine ? 'border-[#265D5A]/40 bg-[#F3FCFA]' : 'border-slate-200/90 bg-white'} hover:border-[#265D5A]/50 hover:bg-slate-50 hover:shadow-md hover:-translate-y-0.5 transition-all group shadow-sm flex flex-col md:flex-row md:items-center gap-2 md:gap-4 cursor-pointer select-none">
        
        <!-- ฝั่งซ้าย: จุดสถานะ, รหัสงาน, ป้ายประเภท, ป้ายงานของฉัน -->
        <div class="flex items-center gap-2.5 shrink-0">
          <span class="w-2.5 h-2.5 rounded-full ${dotCls} shrink-0" title="${esc(j.status)}"></span>
          <span class="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md shrink-0">#${j.id}</span>
          <span class="text-[11px] px-2 py-0.5 rounded-md ${t.chip} shrink-0 font-medium"><i class="fa-solid ${t.icon} mr-1"></i>${t.label}</span>
          ${mine ? '<span class="text-[10px] px-2 py-0.5 rounded-md bg-[#265D5A] text-white font-medium shrink-0">งานของฉัน</span>' : ''}
        </div>

        <!-- ส่วนกลาง: ชื่อหัวข้องานหนา - รายละเอียดงานสีเทา บังคับบรรทัดเดียว (Truncate) -->
        <div class="flex-1 min-w-0 truncate text-sm">
          <span class="${isRead ? 'font-medium text-slate-700' : 'font-bold text-slate-900'} group-hover:text-[#265D5A] transition-colors">${esc(j.subject)}</span>
          <span class="text-slate-300 mx-1.5">-</span>
          <span class="${isRead ? 'text-slate-400 font-light' : 'text-slate-600 font-normal'} truncate">${esc(j.detail) || 'ไม่มีรายละเอียดเพิ่มเติม'}</span>
        </div>

        <!-- ฝั่งขวา: สลับระหว่าง [ช่าง/เวลา] ปกติ กับ [Gmail Actions 4 ปุ่ม] เมื่อ Hover -->
        <div class="relative shrink-0 md:ml-auto h-8 flex items-center justify-end">
          <!-- ข้อมูลปกติ (ซ่อนเมื่อ Hover บน Desktop) -->
          <div class="flex items-center gap-3 text-xs text-slate-500 md:group-hover:opacity-0 md:group-hover:pointer-events-none transition-opacity duration-150">
            <span class="text-slate-600 truncate max-w-[130px] md:max-w-[160px]">${j.tech ? `<i class="fa-solid fa-user-gear text-[#265D5A] mr-1"></i>${esc(j.tech)}` : '<i class="fa-regular fa-hourglass-half mr-1 text-slate-400"></i>รอมอบหมาย'}</span>
            <span class="text-slate-300">·</span>
            <span class="whitespace-nowrap text-slate-400"><i class="fa-regular fa-clock mr-1 text-slate-300"></i>${timeAgo(j.created) || esc(j.createdRaw)}</span>
          </div>

          <!-- Gmail Action Icons (แสดงแทนที่ช่าง/เวลาเมื่อ Hover บน Desktop) -->
          <div class="hidden md:group-hover:flex items-center gap-1.5 absolute right-0 transition-all">
            <!-- 1. Snooze / Urgency นาฬิกา (เฉพาะช่างที่รับผิดชอบ/หัวหน้า/แอดมิน) -->
            ${canSnoozeJob(j) ? `
            <button type="button" onclick="TrackUI.openSnooze('${j.id}', event)" class="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-colors" title="ตั้งเตือน / ปรับความเร่งด่วน">
              <i class="fa-regular fa-clock text-sm"></i>
            </button>` : ''}

            <!-- 2. Delete ถังขยะ (ตรวจสอบสิทธิ์) -->
            <button type="button" onclick="TrackUI.deleteJob('${j.id}', event)" class="w-8 h-8 rounded-full flex items-center justify-center ${userCanDelete ? 'text-slate-500 hover:text-rose-600 hover:bg-rose-100' : 'text-slate-300 cursor-not-allowed hover:bg-slate-100'}" title="${userCanDelete ? 'ลบงานนี้' : 'ไม่มีสิทธิ์ลบ (เฉพาะผู้แจ้ง/หัวหน้างาน/แอดมิน)'}">
              <i class="fa-regular fa-trash-can text-sm"></i>
            </button>
          </div>
        </div>
      </div>`;
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
        ${(getUserRole() === 'Supervisor' || getUserRole() === 'Admin') ? 
          `<button onclick="TrackUI.assignTech('${job.id}')" class="bg-[#265D5A] hover:bg-[#1a3f3d] text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm w-full sm:w-auto flex items-center justify-center gap-1.5"><i class="fa-solid fa-user-plus"></i>มอบหมายงาน</button>` : ''}
      </div>`;
    }
    
    let extra = '';
    const canManage = canManageJob(job);
    const role = getUserRole();
    const isSupervisor = (role === 'Supervisor' || role === 'Admin');

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

  // ---------- ส่วนการพิจารณาอนุมัติโครงการสำหรับผู้บริหาร (Executive Approval Section) ----------
  function renderProjectApprovalSection(job) {
    if (!job || job.type !== 'project') return '';
    const role = getUserRole();
    const isExecutiveOrAdmin = (role === 'Executive' || role === 'Admin');
    const isApproved = /อนุมัติ/.test(job.status) && !/รอ/.test(job.status);
    const isRejected = /ไม่อนุมัติ|ยกเลิก|ปฏิเสธ/.test(job.status);
    const isPending = !isApproved && !isRejected;

    if (isPending) {
      if (isExecutiveOrAdmin) {
        return `<section class="rounded-2xl border-2 border-violet-300 bg-gradient-to-br from-violet-50/90 via-white to-purple-50/50 p-5 md:p-6 mb-4 shadow-sm">
          <div class="flex items-start gap-3.5">
            <div class="w-11 h-11 rounded-2xl bg-[#8b5cf6] text-white flex items-center justify-center shrink-0 shadow-md text-lg">
              <i class="fa-solid fa-stamp"></i>
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1 flex-wrap">
                <h3 class="font-bold text-slate-800 text-base">การพิจารณาอนุมัติโครงการ (สำหรับผู้บริหาร)</h3>
                <span class="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-violet-100 text-violet-800">
                  <span class="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse"></span>รอการพิจารณา
                </span>
              </div>
              <p class="text-xs text-slate-500 leading-relaxed">โครงการนี้รอการตรวจสอบรายละเอียด งบประมาณ และลงนามอนุมัติจากท่านผู้บริหาร</p>
              
              <div class="mt-4 flex flex-wrap gap-2.5">
                <button onclick="TrackUI.approveProject('${job.id}')" class="bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white px-5 py-2.5 rounded-xl text-xs md:text-sm font-bold transition shadow-sm flex items-center gap-2">
                  <i class="fa-solid fa-circle-check text-sm"></i> <span>อนุมัติโครงการ</span>
                </button>
                <button onclick="TrackUI.rejectProject('${job.id}')" class="bg-white border border-rose-300 text-rose-600 hover:bg-rose-50 active:scale-[0.98] px-4 py-2.5 rounded-xl text-xs md:text-sm font-semibold transition shadow-sm flex items-center gap-2">
                  <i class="fa-solid fa-circle-xmark text-sm"></i> <span>ไม่อนุมัติ / ส่งกลับแก้ไข</span>
                </button>
              </div>
            </div>
          </div>
        </section>`;
      } else {
        return `<section class="rounded-2xl border border-violet-200 bg-violet-50/60 p-4 mb-4 shadow-sm flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center shrink-0 text-base">
            <i class="fa-solid fa-hourglass-half animate-pulse"></i>
          </div>
          <div class="text-xs text-violet-900 leading-relaxed">
            <b class="block text-sm font-semibold text-violet-950 mb-0.5">รอการพิจารณาจากผู้บริหาร</b>
            โครงการนี้อยู่ในขั้นตอนการพิจารณาอนุมัติงบประมาณและโครงการโดยฝ่ายบริหาร (Executive Approval Pending)
          </div>
        </section>`;
      }
    }

    if (isApproved) {
      return `<section class="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50/70 to-white p-5 mb-4 shadow-sm">
        <div class="flex items-start gap-3">
          <div class="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm text-base">
            <i class="fa-solid fa-check"></i>
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between flex-wrap gap-2 mb-1">
              <h4 class="font-bold text-slate-800 text-sm md:text-base text-emerald-950 flex items-center gap-2">
                โครงการได้รับการอนุมัติแล้ว
                <span class="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">Approved</span>
              </h4>
              ${job.allocatedBudget ? `<span class="text-xs font-bold bg-emerald-100/80 text-emerald-800 px-3 py-1 rounded-lg border border-emerald-200"><i class="fa-solid fa-coins mr-1"></i>งบที่จัดสรร: ${esc(job.allocatedBudget)} บาท</span>` : ''}
            </div>
            <div class="text-xs text-slate-500 mb-2">
              ${job.approvedBy ? `ผู้อนุมัติ: <b class="text-slate-700">${esc(job.approvedBy)}</b>` : ''}
              ${job.approvedAt ? ` &nbsp;·&nbsp; วันที่อนุมัติ: ${fmtDate(parseDate(job.approvedAt) || job.approvedAt)}` : ''}
            </div>
            ${job.approvalNote ? `<div class="bg-white p-3 rounded-xl border border-emerald-100 text-xs text-slate-700 shadow-2xs"><b>บันทึกความเห็นผู้บริหาร:</b> ${esc(job.approvalNote)}</div>` : ''}
          </div>
        </div>
      </section>`;
    }

    if (isRejected) {
      return `<section class="rounded-2xl border border-rose-200 bg-gradient-to-br from-rose-50/70 to-white p-5 mb-4 shadow-sm">
        <div class="flex items-start gap-3">
          <div class="w-10 h-10 rounded-full bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-sm text-base">
            <i class="fa-solid fa-xmark"></i>
          </div>
          <div class="flex-1 min-w-0">
            <h4 class="font-bold text-rose-950 text-sm md:text-base mb-1 flex items-center gap-2">
              โครงการไม่ได้รับการอนุมัติ / ตีกลับ
              <span class="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">Rejected</span>
            </h4>
            <div class="text-xs text-slate-500 mb-2">
              ${job.rejectedBy ? `พิจารณาโดย: <b class="text-slate-700">${esc(job.rejectedBy)}</b>` : ''}
            </div>
            ${job.approvalNote ? `<div class="bg-white p-3 rounded-xl border border-rose-100 text-xs text-rose-800 shadow-2xs"><b>เหตุผล:</b> ${esc(job.approvalNote)}</div>` : ''}
          </div>
        </div>
      </section>`;
    }

    return '';
  }

  async function open(id) {
    state.currentJobId = id;
    // มาร์กว่าอ่านแล้วอัตโนมัติเมื่อเปิดดูรายละเอียด
    try {
      const readSet = getReadSet();
      if (!readSet.has(id)) {
        readSet.add(id);
        saveReadSet(readSet);
      }
    } catch(e) {}
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

      ${job.type === 'project' ? renderProjectApprovalSection(job) : ''}
      ${(job.type !== 'project' || job.tech) ? techMessage(job) : ''}

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

    const role = getUserRole();
    const isSupervisor = (role === 'Supervisor' || role === 'Admin');

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
    const role = getUserRole();
    if (role !== 'Admin' && role !== 'Supervisor') {
      Swal.fire('ไม่มีสิทธิ์', 'เฉพาะหัวหน้างานหรือผู้ดูแลระบบเท่านั้นที่สามารถมอบหมายงานหรือเปลี่ยนช่างได้', 'warning');
      return;
    }
    const job = state.jobs.find(j => j.id === jobId);
    if (!job) return;
    
    // ใช้ Cache ของ Tech/AV list เพื่อให้โหลดไว (กรองเฉพาะช่างเทคนิคและโสตฯ เท่านั้น ตัด Admin ทิ้งทุกกรณี)
    let techList = window.cachedTechList;
    if (Array.isArray(techList)) {
      techList = techList.filter(t => t && (t.role === 'Tech' || t.role === 'AV'));
      window.cachedTechList = techList;
    }
    if (!techList || techList.length === 0) {
      Swal.fire({title: 'กำลังโหลดรายชื่อช่าง...', allowOutsideClick: false, didOpen: () => Swal.showLoading()});
      
      let gasUsers = [];
      let fbUsers = [];
      
      // ดึงจาก Google Sheets
      try {
        gasUsers = await ResourceHubCore.api.get('get_users');
      } catch (e) {
        console.warn('Cannot fetch from GAS', e);
      }
      
      // ดึงจาก Firebase
      if (window.firestoreDb) {
        try {
          const snap = await window.firestoreDb.collection('users').get();
          snap.forEach(doc => {
            const data = doc.data();
            data.email = doc.id; // ใช้ Document ID เป็น email
            fbUsers.push(data);
          });
        } catch (e) {
          console.warn('Cannot fetch from Firebase', e);
        }
      }
      
      // รวมข้อมูลจากทั้งสองแหล่งโดยใช้ Email เป็น Key
      const userMap = new Map();
      
      gasUsers.forEach(u => {
        const email = u[0] ? u[0].toString().trim().toLowerCase() : '';
        const name = u[1] ? u[1].toString().trim() : '';
        const role = u[2] ? u[2].toString().trim() : '';
        if (email) userMap.set(email, { name, role, originalEmail: u[0].toString().trim() });
      });
      
      fbUsers.forEach(u => {
        const email = u.email ? u.email.toString().trim().toLowerCase() : '';
        const name = u.name ? u.name.toString().trim() : '';
        const role = u.role ? u.role.toString().trim() : '';
        if (email) {
          const existing = userMap.get(email) || {};
          userMap.set(email, {
            name: name || existing.name || '',
            role: role || existing.role || '',
            originalEmail: existing.originalEmail || u.email
          });
        }
      });
      
      // กรองเฉพาะ Tech และ AV เท่านั้น (ตัด Admin และผู้ใช้อื่นๆ ออก 100%)
      techList = [];
      userMap.forEach(user => {
        const r = (user.role || '').trim();
        if (r === 'Tech' || r === 'AV') {
          techList.push({ name: user.name, email: user.originalEmail, role: r, phone: user.phone || '' });
        }
      });
      
      window.cachedTechList = techList;
      Swal.close();
    }

    // ดึงข้อมูลช่างภายนอก (Master Data Mechanics จาก Firestore / MasterData)
    let masterMechanics = [];
    if (window.MasterData && typeof window.MasterData.getState === 'function') {
      const mdState = window.MasterData.getState();
      if (Array.isArray(mdState.mechanics) && mdState.mechanics.length > 0) {
        masterMechanics = mdState.mechanics;
      }
    }
    if ((!masterMechanics || masterMechanics.length === 0) && window.firestoreDb) {
      try {
        const mecDoc = await window.firestoreDb.collection('master_data').doc('mechanics').get();
        if (mecDoc.exists) {
          const d = mecDoc.data();
          masterMechanics = Array.isArray(d?.items) ? d.items : [];
        }
      } catch (e) {
        console.warn('Cannot fetch master mechanics', e);
      }
    }

    if (techList.length === 0 && masterMechanics.length === 0) {
      Swal.fire('Info', 'ไม่พบรายชื่อช่าง (Tech) หรือเจ้าหน้าที่โสตฯ (AV) ในระบบ', 'info');
      return;
    }

    function formatRoleName(role) {
      if (!role) return 'ช่างเทคนิค';
      const r = String(role).trim();
      if (r === 'Tech') return 'ช่างเทคนิค';
      if (r === 'AV') return 'เจ้าหน้าที่โสตฯ';
      if (r === 'Admin') return 'ผู้ดูแลระบบ';
      if (r === 'Supervisor') return 'หัวหน้างาน';
      return r;
    }

    function getTechWorkload(techName) {
      if (!techName) return { active: 0, completed: 0, total: 0 };
      const target = techName.trim().toLowerCase();
      let active = 0, completed = 0, total = 0;
      (state.jobs || []).forEach(j => {
        const jt = (j.tech || j.technician || '').trim().toLowerCase();
        if (jt && (jt === target || jt.includes(target) || target.includes(jt))) {
          total++;
          const st = (j.status || '').trim();
          if (st === 'เสร็จสิ้น' || st === 'ปิดงาน' || st === 'ยกเลิก') {
            completed++;
          } else {
            active++;
          }
        }
      });
      return { active, completed, total };
    }

    const urgencyArr = ['ด่วนที่สุด (ภายใน 2 ชม.)', 'ด่วน (ภายใน 24 ชม.)', 'ปานกลาง (2-3 วัน)', 'ตามคิว (ทั่วไป)'];
    let urgencyHtml = '<option value="">ไม่ระบุความเร่งด่วน</option>';
    urgencyArr.forEach(u => {
      const selected = (job.urgency === u) ? 'selected' : '';
      urgencyHtml += `<option value="${u}" ${selected}>${u}</option>`;
    });

    let techOptionsHtml = '<option value="" data-email="" data-phone="" data-skills="" data-role="" data-active="0" data-completed="0" data-total="0">-- ยังไม่มอบหมายช่าง --</option>';

    if (techList.length > 0) {
      techOptionsHtml += `<optgroup label="👤 เจ้าหน้าที่ / ช่างประจำระบบ">`;
      techList.forEach(t => {
        if (!t || t.role === 'Admin' || (t.role !== 'Tech' && t.role !== 'AV')) return;
        const selected = (job.tech === t.name) ? 'selected' : '';
        const roleLabel = formatRoleName(t.role);
        const stats = getTechWorkload(t.name);
        const emailPart = t.email ? ` (${t.email} - ${roleLabel})` : ` (${roleLabel})`;
        const label = `${t.name}${emailPart} [ค้าง: ${stats.active} | รวม: ${stats.total}]`;
        techOptionsHtml += `<option value="${esc(t.name)}" data-email="${esc(t.email)}" data-role="${esc(roleLabel)}" data-phone="${esc(t.phone || '')}" data-skills="" data-active="${stats.active}" data-completed="${stats.completed}" data-total="${stats.total}" ${selected}>${esc(label)}</option>`;
      });
      techOptionsHtml += `</optgroup>`;
    }

    if (masterMechanics.length > 0) {
      techOptionsHtml += `<optgroup label="🔨 ช่างภายนอก / ผู้รับเหมา (Master Data)">`;
      masterMechanics.forEach(m => {
        const selected = (job.tech === m.name) ? 'selected' : '';
        const stats = getTechWorkload(m.name);
        const phonePart = m.phone ? ` (${m.phone}` : ' (';
        const skillPart = m.skills ? ` - ${m.skills})` : ')';
        const label = `${m.name}${phonePart}${skillPart} [ค้าง: ${stats.active} | รวม: ${stats.total}]`;
        techOptionsHtml += `<option value="${esc(m.name)}" data-email="" data-role="ช่างภายนอก / ผู้รับเหมา" data-phone="${esc(m.phone || '')}" data-skills="${esc(m.skills || '')}" data-active="${stats.active}" data-completed="${stats.completed}" data-total="${stats.total}" ${selected}>${esc(label)}</option>`;
      });
      techOptionsHtml += `</optgroup>`;
    }

    const formHtml = `
      <div class="text-left space-y-3.5 text-slate-800 mt-3 border-t pt-3">
        <div>
          <label class="block text-xs font-semibold mb-1.5 text-slate-700">ช่างที่รับผิดชอบ (ชื่อ, อีเมล/เบอร์โทร, ตำแหน่ง)</label>
          <select id="assignTechName" class="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#265D5A] outline-none text-xs bg-slate-50 font-medium">
            ${techOptionsHtml}
          </select>
        </div>
        
        <!-- ข้อมูลช่าง / สถิติงาน (Live Card จากรูป 2 & ข้อมูลสถิติ) -->
        <div id="techDetailCard" class="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-2 transition-all"></div>

        <div>
          <label class="block text-xs font-semibold mb-1.5 text-slate-700">ระดับความเร่งด่วน</label>
          <select id="assignUrgency" class="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#265D5A] outline-none text-xs bg-slate-50 font-medium">
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
      didOpen: () => {
        const select = document.getElementById('assignTechName');
        const card = document.getElementById('techDetailCard');
        if (!select || !card) return;
        
        function renderCard() {
          const opt = select.options[select.selectedIndex];
          if (!opt || !select.value) {
            card.innerHTML = `
              <div class="text-slate-400 text-center py-2 flex items-center justify-center gap-1.5 text-xs">
                <i class="fa-solid fa-circle-info text-slate-400"></i> เลือกช่างเพื่อดูข้อมูลเบอร์โทร ทักษะ และสถิติภาระงาน
              </div>`;
            return;
          }
          const role = opt.dataset.role || 'ช่าง';
          const email = opt.dataset.email || '';
          const phone = opt.dataset.phone || '';
          const skills = opt.dataset.skills || '';
          const active = opt.dataset.active || '0';
          const completed = opt.dataset.completed || '0';
          const total = opt.dataset.total || '0';

          card.innerHTML = `
            <div class="flex items-center justify-between pb-1.5 border-b border-slate-200">
              <span class="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                <i class="fa-solid fa-user-gear text-[#265D5A]"></i> ${esc(select.value)}
              </span>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#265D5A]/10 text-[#265D5A] border border-[#265D5A]/20">
                ${esc(role)}
              </span>
            </div>
            <div class="grid grid-cols-2 gap-2 pt-1 text-slate-600 text-xs">
              ${email ? `<div><span class="text-slate-400">อีเมล:</span> <span class="font-medium text-slate-700">${esc(email)}</span></div>` : ''}
              <div><span class="text-slate-400">เบอร์โทร:</span> ${phone ? `<a href="tel:${esc(phone)}" class="text-blue-600 font-bold hover:underline">${esc(phone)} <i class="fa-solid fa-phone text-[10px] ml-0.5"></i></a>` : '<span class="text-slate-400">ไม่ระบุ</span>'}</div>
              ${skills ? `<div class="col-span-2"><span class="text-slate-400">ทักษะ/ความชำนาญ:</span> <span class="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">${esc(skills)}</span></div>` : ''}
            </div>
            <div class="mt-2 pt-2 border-t border-slate-200 flex items-center justify-between text-[11px]">
              <div class="flex items-center gap-1 text-amber-700 font-medium">
                <i class="fa-solid fa-clock-rotate-left"></i> งานค้าง: <span class="font-bold text-amber-800 text-xs">${active}</span> งาน
              </div>
              <div class="flex items-center gap-1 text-emerald-700 font-medium">
                <i class="fa-solid fa-circle-check"></i> สำเร็จ: <span class="font-bold text-emerald-800 text-xs">${completed}</span> งาน
              </div>
              <div class="flex items-center gap-1 text-slate-700 font-medium">
                <i class="fa-solid fa-list-check"></i> รวม: <span class="font-bold text-slate-900 text-xs">${total}</span> งาน
              </div>
            </div>
          `;
        }
        select.addEventListener('change', renderCard);
        renderCard();
      },
      preConfirm: () => {
        const select = document.getElementById('assignTechName');
        const opt = select.options[select.selectedIndex];
        const techName = select.value;
        const techEmail = opt?.dataset?.email || '';
        const techPhone = opt?.dataset?.phone || '';
        const techSkills = opt?.dataset?.skills || '';
        const techRole = opt?.dataset?.role || '';
        const urgency = document.getElementById('assignUrgency').value;
        return { techName, techEmail, techPhone, techSkills, techRole, urgency };
      }
    });
    
    if (formValues) {
      const { techName, techEmail, techPhone, techSkills, techRole, urgency } = formValues;
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
              techPhone: techPhone,
              techSkills: techSkills,
              techRole: techRole,
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
           technicianPhone: techPhone,
           urgency: urgency
         });
        
        const successMsg = techEmail ? `มอบหมายงานและส่งอีเมลแจ้ง ${esc(techName)} (${esc(techEmail)}) เรียบร้อยแล้ว` : (techName ? `มอบหมาย ${esc(techName)} เรียบร้อยแล้ว` : 'ยกเลิกการมอบหมายช่างสำเร็จ');
        Swal.fire({icon: 'success', title: 'สำเร็จ!', text: successMsg, confirmButtonColor: '#265D5A', timer: 2500});
      } catch (err) {
        console.error('assignTech error:', err);
        Swal.fire('Error', 'ไม่สามารถมอบหมายงานได้: ' + (err.message || ''), 'error');
      }
    }
  }

  // ---------- ฟังก์ชันอนุมัติโครงการใหญ่ (สำหรับผู้บริหาร / Executive) ----------
  async function approveProject(jobId) {
    const role = getUserRole();
    if (role !== 'Executive' && role !== 'Admin') {
      Swal.fire('ไม่มีสิทธิ์', 'เฉพาะผู้บริหารหรือผู้ดูแลระบบเท่านั้นที่สามารถอนุมัติโครงการได้', 'warning');
      return;
    }
    const job = state.jobs.find(j => j.id === jobId);
    if (!job) return;

    const { value: formValues } = await Swal.fire({
      title: 'อนุมัติโครงการ',
      html: `
        <div class="text-left space-y-3 mt-3 text-slate-800 text-xs md:text-sm">
          <div class="p-3 bg-violet-50 rounded-xl border border-violet-100">
            <span class="text-xs text-violet-700 font-semibold block mb-0.5">โครงการที่เสนอ:</span>
            <span class="font-bold text-slate-800 text-sm md:text-base">${esc(job.subject)}</span>
            <div class="text-[11px] text-slate-500 mt-1">ผู้เสนอ: ${esc(job.reporter)} (${esc(job.dept || '-')})</div>
          </div>
          <div>
            <label class="block font-semibold mb-1 text-slate-700">บันทึกความเห็นการอนุมัติของผู้บริหาร <span class="text-rose-500">*</span></label>
            <textarea id="apprNote" rows="3" class="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-xs" placeholder="เช่น อนุมัติตามที่เสนอ ให้ฝ่ายอาคารเริ่มประสานงานผู้รับเหมา..."></textarea>
          </div>
          <div>
            <label class="block font-semibold mb-1 text-slate-700">งบประมาณที่จัดสรร (บาท) <span class="text-slate-400 font-normal">[ถ้ามี]</span></label>
            <input type="number" id="apprBudget" class="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-xs" placeholder="เช่น 50000" min="0">
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: '<i class="fa-solid fa-check mr-1"></i> ยืนยันอนุมัติโครงการ',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#059669',
      cancelButtonColor: '#64748b',
      focusConfirm: false,
      preConfirm: () => {
        const note = (document.getElementById('apprNote')?.value || '').trim();
        const budget = (document.getElementById('apprBudget')?.value || '').trim();
        if (!note) {
          Swal.showValidationMessage('กรุณากรอกบันทึกความเห็นการอนุมัติ');
          return false;
        }
        return { note, budget };
      }
    });

    if (!formValues) return;

    Swal.fire({ title: 'กำลังบันทึกการอนุมัติโครงการ...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

    try {
      const approverName = ((typeof currentTeacher === 'string' && currentTeacher) || (localStorage.getItem('logged_teacher') || 'ผู้บริหาร')).trim();
      const approverEmail = ((typeof currentEmail === 'string' && currentEmail) || (localStorage.getItem('logged_email') || '')).trim();

      const updatePayload = {
        status: 'อนุมัติแล้ว',
        approvedBy: approverName + (approverEmail ? ` (${approverEmail})` : ''),
        approvalNote: formValues.note,
        allocatedBudget: formValues.budget || '',
        approvedAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      // 1. อัปเดต Firestore Collection 'tickets' ทันที (Real-time sync ทั่วระบบ)
      if (window.firestoreDb) {
        await window.firestoreDb.collection('tickets').doc(jobId).set(updatePayload, { merge: true });
      }

      // 2. อัปเดต Google Sheet Backup (Facility_Projects)
      try {
        await ResourceHubCore.api.post({
          action: 'update_adv_task',
          tabType: 'project',
          rowIndex: job.originalIndex,
          status: 'อนุมัติแล้ว',
          technician: approverName,
          detail: `[อนุมัติแล้ว] ${formValues.note}${formValues.budget ? ` (งบประมาณ: ${formValues.budget} บาท)` : ''}`
        });
      } catch (sheetErr) {
        console.warn('Sync to Sheet backup warning:', sheetErr);
      }

      Swal.fire({
        icon: 'success',
        title: 'อนุมัติโครงการเรียบร้อยแล้ว',
        text: 'ระบบได้บันทึกการอนุมัติและอัปเดตสถานะโครงการเรียบร้อย',
        timer: 2000,
        showConfirmButton: false
      });

    } catch (e) {
      console.error('Approve project error:', e);
      Swal.fire('เกิดข้อผิดพลาด', e.message || 'ไม่สามารถบันทึกการอนุมัติได้', 'error');
    }
  }

  // ---------- ฟังก์ชันไม่อนุมัติ / ส่งกลับแก้ไขโครงการ (สำหรับผู้บริหาร) ----------
  async function rejectProject(jobId) {
    const role = getUserRole();
    if (role !== 'Executive' && role !== 'Admin') {
      Swal.fire('ไม่มีสิทธิ์', 'เฉพาะผู้บริหารหรือผู้ดูแลระบบเท่านั้น', 'warning');
      return;
    }
    const job = state.jobs.find(j => j.id === jobId);
    if (!job) return;

    const { value: formValues } = await Swal.fire({
      title: 'ไม่อนุมัติ / ส่งกลับแก้ไข',
      html: `
        <div class="text-left space-y-3 mt-3 text-slate-800 text-xs md:text-sm">
          <div class="p-3 bg-rose-50 rounded-xl border border-rose-100">
            <span class="text-xs text-rose-700 font-semibold block mb-0.5">โครงการ:</span>
            <span class="font-bold text-slate-800 text-sm md:text-base">${esc(job.subject)}</span>
          </div>
          <div>
            <label class="block font-semibold mb-1 text-rose-700">เหตุผลที่ไม่อนุมัติ หรือข้อเสนอแนะให้แก้ไข <span class="text-rose-500">*</span></label>
            <textarea id="rejNote" rows="3" class="w-full p-2.5 border border-rose-300 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none text-xs" placeholder="ระบุเหตุผล เช่น เกินงบประมาณที่กำหนด, ขอให้ปรับแก้ขอบเขตงานและเสนอใหม่..."></textarea>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: '<i class="fa-solid fa-ban mr-1"></i> ยืนยันไม่อนุมัติ',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#e11d48',
      cancelButtonColor: '#64748b',
      focusConfirm: false,
      preConfirm: () => {
        const note = (document.getElementById('rejNote')?.value || '').trim();
        if (!note) {
          Swal.showValidationMessage('กรุณาระบุเหตุผล');
          return false;
        }
        return { note };
      }
    });

    if (!formValues) return;

    Swal.fire({ title: 'กำลังบันทึกข้อมูล...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

    try {
      const rejectorName = ((typeof currentTeacher === 'string' && currentTeacher) || (localStorage.getItem('logged_teacher') || 'ผู้บริหาร')).trim();

      const updatePayload = {
        status: 'ไม่อนุมัติ',
        approvalNote: formValues.note,
        rejectedBy: rejectorName,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      if (window.firestoreDb) {
        await window.firestoreDb.collection('tickets').doc(jobId).set(updatePayload, { merge: true });
      }

      try {
        await ResourceHubCore.api.post({
          action: 'update_adv_task',
          tabType: 'project',
          rowIndex: job.originalIndex,
          status: 'ไม่อนุมัติ',
          technician: rejectorName,
          detail: `[ไม่อนุมัติ] ${formValues.note}`
        });
      } catch (sheetErr) {
        console.warn('Sync to Sheet backup warning:', sheetErr);
      }

      Swal.fire({
        icon: 'info',
        title: 'บันทึกสถานะเรียบร้อย',
        text: 'สถานะโครงการเปลี่ยนเป็น "ไม่อนุมัติ"',
        timer: 2000,
        showConfirmButton: false
      });

    } catch (e) {
      console.error('Reject project error:', e);
      Swal.fire('เกิดข้อผิดพลาด', e.message || 'ไม่สามารถบันทึกข้อมูลได้', 'error');
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
    
    const uRole = getUserRole();
    let myName = ((typeof currentTeacher === 'string' && currentTeacher) ? currentTeacher : (currentTeacher?.name || '')).trim();
    if (!myName) {
      if (uRole === 'Executive') myName = 'ผู้บริหาร';
      else if (uRole === 'Admin') myName = 'Admin';
      else myName = 'Unknown';
    }
    
    box.innerHTML = messages.map(msg => {
      const isMe = msg.senderName === myName;
      const time = msg.timestamp ? new Date(msg.timestamp.toDate()).toLocaleTimeString('th-TH', {hour: '2-digit', minute:'2-digit'}) : 'กำลังส่ง...';
      const roleColor = (msg.role === 'admin' || msg.role === 'tech') ? 'text-[#265D5A]' : (msg.role === 'executive' ? 'text-violet-700 font-bold' : 'text-slate-500');
      
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
      
      const uRole = getUserRole();
      let senderName = ((typeof currentTeacher === 'string' && currentTeacher) ? currentTeacher : (currentTeacher?.name || '')).trim();
      if (!senderName) {
        if (uRole === 'Executive') senderName = 'ผู้บริหาร';
        else if (uRole === 'Admin') senderName = 'Admin';
        else senderName = 'ผู้ใช้งาน';
      }
      const role = uRole === 'Admin' ? 'admin' : (uRole === 'Executive' ? 'executive' : (uRole === 'Tech' || uRole === 'AV' ? 'tech' : 'user'));
      
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

      const fmtSeq = (n) => (n < 100 ? String(n).padStart(2, '0') : String(n));

      // 1. อาคาร
      if (Array.isArray(buildingData)) {
        buildingData.forEach((row, idx) => {
          if (!row || !row[0]) return;
          items.push({
            ticketId: `BLD-${fmtSeq(idx + 1)}`,
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
            ticketId: `AV-${fmtSeq(idx + 1)}`,
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
            ticketId: `IT-${fmtSeq(idx + 1)}`,
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
            ticketId: `AV-${fmtSeq((Array.isArray(avData) ? avData.length : 0) + idx + 1)}`,
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
            ticketId: `PRJ-${fmtSeq(idx + 1)}`,
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

  // ---------- จัดลำดับเลขคิวใหม่ / รีเซ็ตตัวนับคิว (Re-index & Reset Queue) ----------
  async function reindexTickets(manual = false) {
    const role = getUserRole();
    if (manual) {
      if (role !== 'Admin' && role !== 'Supervisor') {
        Swal.fire({
          icon: 'warning',
          title: 'ไม่มีสิทธิ์จัดลำดับเลขคิว',
          text: 'เฉพาะระดับผู้ดูแลระบบ (Admin) หรือหัวหน้างาน (Supervisor) เท่านั้น'
        });
        return;
      }

      const actionChoice = await Swal.fire({
        title: 'จัดการคิวงานและตัวนับระบบ',
        html: `
          <div class="text-left text-xs md:text-sm text-slate-600 space-y-3">
            <p>เลือกคำสั่งจัดการลำดับเลขคิวที่ต้องการ:</p>
            <div class="space-y-2">
              <label class="flex items-start gap-2.5 p-3 rounded-xl border border-emerald-200 bg-emerald-50/50 cursor-pointer hover:bg-emerald-50">
                <input type="radio" name="reindex_action" value="reindex" checked class="mt-1 text-emerald-600">
                <div>
                  <div class="font-bold text-slate-800">1. จัดลำดับเลขคิวใหม่ตามงานจริง (01 - 300)</div>
                  <div class="text-xs text-slate-500 mt-0.5">เรียงลำดับงานตามวันที่สร้างจริง (งานเก่าสุด = 01) และตั้งตัวนับระบบให้รันต่อจากงานล่าสุด</div>
                </div>
              </label>
              <label class="flex items-start gap-2.5 p-3 rounded-xl border border-amber-200 bg-amber-50/50 cursor-pointer hover:bg-amber-50">
                <input type="radio" name="reindex_action" value="reset_counter" class="mt-1 text-amber-600">
                <div>
                  <div class="font-bold text-slate-800">2. รีเซ็ตตัวนับคิวระบบเป็น 01 (ล้างรอบคิว)</div>
                  <div class="text-xs text-slate-500 mt-0.5">คงงานเดิมไว้ แต่รีเซ็ตตัวนับเพื่อให้งานที่ส่งเข้ามาใหม่เริ่มนับจาก 01 อีกครั้ง</div>
                </div>
              </label>
            </div>
            <p class="text-slate-400 text-xs mt-2">* หมายเหตุ: ระบบปกติเมื่อส่งงานเข้ามาและมีการลบงาน เลขคิวจะไม่ดันหรือเลื่อน จะรันต่อเนื่องอัตโนมัติ</p>
          </div>
        `,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#265D5A',
        cancelButtonColor: '#64748b',
        confirmButtonText: 'ดำเนินการ',
        cancelButtonText: 'ยกเลิก',
        preConfirm: () => {
          const selected = document.querySelector('input[name="reindex_action"]:checked');
          return selected ? selected.value : 'reindex';
        }
      });

      if (!actionChoice.isConfirmed) return;

      // กรณีเลือกรีเซ็ตเฉพาะตัวนับคิว
      if (actionChoice.value === 'reset_counter') {
        try {
          if (window.firestoreDb) {
            await window.firestoreDb.collection('system_counters').doc('tickets').set({
              building: 0,
              it: 0,
              av: 0,
              project: 0
            });
          }
          Swal.fire({
            icon: 'success',
            title: 'รีเซ็ตตัวนับคิวเรียบร้อย',
            text: 'ตัวนับคิวทุกประเภทถูกรีเซ็ตเป็น 01 แล้ว งานใหม่ที่ส่งเข้ามาถัดไปจะเริ่มนับที่ 01',
            confirmButtonColor: '#265D5A'
          });
          return;
        } catch (err) {
          Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถรีเซ็ตตัวนับได้: ' + err.message, 'error');
          return;
        }
      }
    }

    if (!window.firestoreDb) {
      if (manual) Swal.fire('เกิดข้อผิดพลาด', 'ยังไม่ได้เชื่อมต่อฐานข้อมูล Firebase', 'error');
      return;
    }

    state.reindexing = true;
    if (manual) {
      Swal.fire({
        title: 'กำลังจัดลำดับเลขคิวใหม่...',
        html: 'กำลังตรวจสอบและจัดเรียงข้อมูลตามวันที่สร้าง...',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      });
    }

    try {
      const snap = await window.firestoreDb.collection('tickets').get();
      if (snap.empty) {
        state.reindexing = false;
        if (manual) Swal.fire('สำเร็จ', 'ไม่พบรายการงานในระบบ', 'info');
        return;
      }

      // Helper แปลง Timestamp/Date เป็น ms
      const getTsMs = (val) => {
        if (!val) return 0;
        if (typeof val.toMillis === 'function') return val.toMillis();
        if (val.seconds) return val.seconds * 1000 + (val.nanoseconds || 0) / 1e6;
        if (val instanceof Date) return val.getTime();
        const d = new Date(val);
        return isNaN(d) ? 0 : d.getTime();
      };

      const fmtSeq = (n) => (n < 100 ? String(n).padStart(2, '0') : String(n));

      // แยกตามประเภทงาน
      const groups = {
        building: [],
        it: [],
        av: [],
        project: []
      };

      snap.forEach(doc => {
        const d = doc.data() || {};
        let cat = (d.type || '').toLowerCase();
        const tid = d.ticketId || doc.id || '';
        if (cat === 'it' || tid.startsWith('IT-')) cat = 'it';
        else if (cat === 'av' || tid.startsWith('AV-')) cat = 'av';
        else if (cat === 'project' || tid.startsWith('PRJ-')) cat = 'project';
        else cat = 'building';

        groups[cat].push({
          oldId: doc.id,
          data: d,
          ts: getTsMs(d.createdAt)
        });
      });

      const prefixes = { building: 'BLD', it: 'IT', av: 'AV', project: 'PRJ' };
      const tasks = [];
      const finalCounters = {};

      Object.keys(groups).forEach(cat => {
        const list = groups[cat];
        // เรียงจากงานที่สร้างเก่าที่สุด -> ใหม่ที่สุด
        list.sort((a, b) => a.ts - b.ts);

        list.forEach((item, idx) => {
          const seq = (idx % 300) + 1;
          const targetId = `${prefixes[cat]}-${fmtSeq(seq)}`;
          tasks.push({
            oldId: item.oldId,
            targetId: targetId,
            cat: cat,
            data: {
              ...item.data,
              ticketId: targetId,
              type: cat,
              updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }
          });
        });

        // กำหนดค่า counter ล่าสุดของหมวดนี้ ให้เท่ากับจำนวนงานที่รันล่าสุด
        finalCounters[cat] = list.length > 0 ? ((list.length - 1) % 300) + 1 : 0;
      });

      // กรองเฉพาะรายการที่ต้องเปลี่ยน ID
      const changes = tasks.filter(t => t.oldId !== t.targetId);

      if (changes.length > 0) {
        if (manual) {
          Swal.update({
            html: `พบรายการที่ต้องเปลี่ยนรหัส ${changes.length} รายการ<br>กำลังโอนย้ายข้อมูลและประวัติแชท...`
          });
        }

        for (const ch of changes) {
          // 1. คัดลอกข้อความแชท (chats/{oldId}/messages -> chats/{targetId}/messages)
          try {
            const oldChatRef = window.firestoreDb.collection('chats').doc(ch.oldId).collection('messages');
            const chatSnap = await oldChatRef.get();
            if (!chatSnap.empty) {
              const chatBatch = window.firestoreDb.batch();
              const newChatRef = window.firestoreDb.collection('chats').doc(ch.targetId).collection('messages');
              chatSnap.forEach(msgDoc => {
                chatBatch.set(newChatRef.doc(msgDoc.id), msgDoc.data());
                chatBatch.delete(msgDoc.ref);
              });
              await chatBatch.commit();
            }
          } catch (chatErr) {
            console.warn(`Chat migration warn (${ch.oldId} -> ${ch.targetId}):`, chatErr);
          }

          // 2. บันทึก Ticket ด้วย ID ใหม่
          await window.firestoreDb.collection('tickets').doc(ch.targetId).set(ch.data);

          // 3. ลบ ID เก่า ถ้าไม่ได้เป็น targetId ของงานอื่น
          const willBeTarget = tasks.some(other => other.targetId === ch.oldId);
          if (!willBeTarget) {
            await window.firestoreDb.collection('tickets').doc(ch.oldId).delete();
          }
        }

        // ลบ ID เก่าที่เหลือ
        for (const ch of changes) {
          const isTarget = tasks.some(t => t.targetId === ch.oldId);
          if (!isTarget) {
            try {
              await window.firestoreDb.collection('tickets').doc(ch.oldId).delete();
            } catch (_) {}
          }
        }
      }

      // บันทึกตัวนับล่าสุดลง system_counters/tickets
      await window.firestoreDb.collection('system_counters').doc('tickets').set(finalCounters, { merge: true });

      state.reindexing = false;
      state.loaded = false;
      await load(true);

      if (manual) {
        Swal.fire({
          icon: 'success',
          title: 'จัดลำดับเลขคิวสำเร็จ!',
          html: `
            <div class="text-left text-sm text-slate-700 space-y-1">
              <div>จัดระเบียบคิวงานเรียบร้อยแล้วทั้งหมด <b>${tasks.length}</b> รายการ</div>
              <div class="text-xs text-slate-500 mt-2">ตัวนับคิวงานปัจจุบัน (รันต่อเนื่อง):</div>
              <div class="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-xl border mt-1">
                <div>🏢 ซ่อมอาคาร: <b>BLD-${fmtSeq(finalCounters.building || 0)}</b></div>
                <div>💻 ซ่อมไอที: <b>IT-${fmtSeq(finalCounters.it || 0)}</b></div>
                <div>📷 โสตทัศนูปกรณ์: <b>AV-${fmtSeq(finalCounters.av || 0)}</b></div>
                <div>📋 โครงการ: <b>PRJ-${fmtSeq(finalCounters.project || 0)}</b></div>
              </div>
            </div>
          `,
          confirmButtonColor: '#265D5A'
        });
      } else {
        console.log(`[AutoReindex] Successfully re-indexed ${changes.length} tickets to short IDs.`);
      }

    } catch (err) {
      console.error('Reindex error:', err);
      state.reindexing = false;
      if (manual) {
        Swal.fire({ icon: 'error', title: 'จัดลำดับไม่สำเร็จ', text: err.message, confirmButtonColor: '#e11d48' });
      }
    }
  }

  // ตัวกระตุ้น Silent Auto-Sync เบื้องหลัง (ไม่รบกวนหน้าจอ ไม่เด้ง Modal)
  let lastAutoSyncTime = 0;
  function triggerSilentAutoSync() {
    const role = getUserRole();
    const isManager = (role === 'Executive' || role === 'Supervisor' || role === 'Admin');
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
    deleteJob,
    toggleArchive,
    toggleRead,
    openSnooze,
    toggleArchived,
    assignTech,
    closeJob,
    approveProject,
    rejectProject,
    submitChat,
    previewChatImage,
    clearChatImage,
    migrateFromSheets,
    reindexTickets,
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
      const role = getUserRole();
      if (role === 'Teacher') {
        state.mineOnly = true;
        render();
        return;
      }
      const myName = (typeof currentTeacher === 'string' && currentTeacher) || localStorage.getItem('logged_teacher');
      if (!myName) {
        return alertBox('info', 'ต้องเข้าสู่ระบบ', 'กรุณาเข้าสู่ระบบเพื่อดูงานของคุณ');
      }
      state.mineOnly = !state.mineOnly;
      render();
    },
    // เปิดหน้ารายการพร้อมตั้งค่าเริ่มต้น (เช่น หลังแจ้งซ่อมเสร็จ หรือกดจัดการงานจากการ์ด)
    show(opts = {}) {
      state.currentJobId = null;
      const role = getUserRole();

      if (role === 'Teacher') {
        state.mineOnly = true;
      } else if (opts.mineOnly !== undefined) {
        state.mineOnly = !!opts.mineOnly;
      } else if (!state.loaded) {
        state.mineOnly = false;
      }

      if (opts.type !== undefined) {
        state.type = opts.type;
      } else {
        state.type = sanitizeTypeForRole(role, state.type);
      }

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
