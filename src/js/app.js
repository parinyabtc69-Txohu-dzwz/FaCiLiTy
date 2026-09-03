console.log("%cFaCiLiTy System", "color: #4f46e5; font-size: 20px; font-weight: bold;");
console.log("%cDeveloped by Taohx_dz_parinya", "color: #10b981; font-size: 14px; font-weight: bold;");

// 🔴 เปลี่ยน URL ตรงนี้เป็น URL ของการ Deploy ล่าสุดจาก Google Apps Script
const scriptURL = 'https://script.google.com/macros/s/AKfycbyMZhZ6AftlGNqrcu15xKGXjIxq9zPCaJZbJooi9qBykjT4pjA71mQpn1kfz8-qyaiaLg/exec';


// 🔴 โฟลเดอร์ที่เก็บรูป (เปลี่ยนเป็นอันใหม่เรียบร้อย)
const REPAIR_DRIVE_FOLDER_ID = '1tkOHFwH4MC-eA_eNLThTcLVF3CRHQUXT';

// 🔒 SESSION CONFIG
const SESSION_EXPIRY_MS = 8 * 60 * 60 * 1000; // 8 ชั่วโมง
const MAX_LOGIN_ATTEMPTS = 5;                  // ล็อกหลังผิด 5 ครั้ง
const LOCKOUT_MS = 15 * 60 * 1000;             // ล็อก 15 นาที

// 🔒 ตรวจสอบ Session Expiry — ถ้าหมดอายุให้ Logout อัตโนมัติ
(function checkSessionExpiry() {
  const loginTime = sessionStorage.getItem('session_login_time');
  if (loginTime && (Date.now() - parseInt(loginTime)) > SESSION_EXPIRY_MS) {
    sessionStorage.clear();
    console.warn('🔒 Session หมดอายุ — ล้างข้อมูลเรียบร้อย');
  }
})();

// 🔒 XSS Sanitizer — กรองโค้ดอันตรายออกจากข้อมูลก่อนแสดงผล
function sanitizeHtml(str) {
  if (typeof str !== 'string') return str;
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
}

// 🔒 Login Attempt Tracker
const loginAttempts = {
  get(key) {
    try { return JSON.parse(sessionStorage.getItem('login_attempts_' + key) || '{"count":0,"lockUntil":0}'); }
    catch { return { count: 0, lockUntil: 0 }; }
  },
  set(key, data) { sessionStorage.setItem('login_attempts_' + key, JSON.stringify(data)); },
  isLocked(key) {
    const d = this.get(key);
    if (d.lockUntil && Date.now() < d.lockUntil) return d.lockUntil;
    return false;
  },
  fail(key) {
    const d = this.get(key);
    d.count = (d.count || 0) + 1;
    if (d.count >= MAX_LOGIN_ATTEMPTS) d.lockUntil = Date.now() + LOCKOUT_MS;
    this.set(key, d);
    return d;
  },
  reset(key) { sessionStorage.removeItem('login_attempts_' + key); }
};

// 🔒 แสดง Countdown ตอนถูกล็อก
function showLockoutAlert(lockUntil) {
  const remaining = () => Math.max(0, Math.ceil((lockUntil - Date.now()) / 1000));
  let seconds = remaining();
  Swal.fire({
    icon: 'error',
    title: '🔒 บัญชีถูกล็อกชั่วคราว',
    html: `<p class="text-slate-600 mb-2">กรอกรหัสผ่านผิดเกิน ${MAX_LOGIN_ATTEMPTS} ครั้ง<br>กรุณารอ <b id="lockout-timer">${seconds}</b> วินาที</p>`,
    showConfirmButton: false,
    allowOutsideClick: false,
    didOpen: () => {
      const interval = setInterval(() => {
        seconds = remaining();
        const el = document.getElementById('lockout-timer');
        if (el) el.textContent = seconds;
        if (seconds <= 0) { clearInterval(interval); Swal.close(); }
      }, 1000);
    }
  });
}


let currentTeacher = sessionStorage.getItem('logged_teacher') || null;
let currentRole = sessionStorage.getItem('logged_role') || null;
let isAdminLoggedIn = sessionStorage.getItem('logged_admin') === 'true' || false;
let isRegisterMode = false;

const $ = id => document.getElementById(id);
const $$ = s => document.querySelectorAll(s);

const alertBox = (icon, title, text = '', opts = {}) => Swal.fire({ icon, title, text, ...opts });
const setBusy = (btn, busy, label) => {
  btn.disabled = busy;
  btn.innerHTML = busy ? '<i class="fa-solid fa-spinner fa-spin"></i> กำลังดำเนินการ...' : label;
};

// ฟังก์ชันช่วยจัดรูปแบบสถานะ พร้อมแท็กสี (Gmail Style)
const statusTagClass = s => {
  const status = (s || '').trim();
  if (status === 'เสร็จสิ้น' || status === 'เสร็จสิ้น/คืนเรียบร้อย' || status === 'เรียบร้อยแล้ว') {
    return '<span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-sky-100 text-sky-700 border border-sky-200"><span class="w-1.5 h-1.5 rounded-full bg-sky-500 mr-1.5"></span>' + status + '</span>';
  } else if (status === 'กำลังดำเนินการ' || status === 'กำลังใช้งาน' || status === 'จัดเตรียมแล้ว' || status === 'กำลังดำเนินงาน') {
    return '<span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200"><span class="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5"></span>' + status + '</span>';
  } else {
    return '<span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-700 border border-rose-200"><span class="w-1.5 h-1.5 rounded-full bg-rose-500 mr-1.5 animate-pulse"></span>' + (status || 'รอดำเนินการ') + '</span>';
  }
};

async function renderTableData(fetchPromiseOrData, tbodyId, rowRendererFn, colSpan, emptyMsg) {
  const tbody = $(tbodyId);
  if (!tbody) return;
  try {
    const data = fetchPromiseOrData instanceof Promise ? await fetchPromiseOrData : fetchPromiseOrData;
    if (!data || !data.length) {
      tbody.innerHTML = `<tr><td colspan="${colSpan}" class="p-8 text-center text-slate-500">${emptyMsg}</td></tr>`;
      return;
    }
    tbody.innerHTML = data.map(rowRendererFn).join('');
  } catch (e) {
    console.error(e);
    tbody.innerHTML = `<tr><td colspan="${colSpan}" class="p-8 text-center text-rose-500">ไม่สามารถโหลดข้อมูลได้ในขณะนี้</td></tr>`;
  }
}

// 🟢 แก้ไขตรงนี้: เพื่อให้แจ้งเตือน Error จากหลังบ้าน (e.message) ขึ้นหน้าจอตรงๆ
async function submitAction(fetchPromiseFn, successMsg, onSuccessCallback) {
  Swal.fire({ title: 'กำลังดำเนินการ...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
  try {
    const res = await fetchPromiseFn();
    await alertBox('success', 'สำเร็จ', successMsg, { timer: 1500, showConfirmButton: false });
    if (onSuccessCallback) onSuccessCallback(res);
  } catch (e) {
    console.error(e);
    alertBox('error', 'เกิดข้อผิดพลาด', e.message || 'ไม่สามารถเชื่อมต่อหรือดำเนินการได้');
  }
}

const readFile = file => new Promise((resolve, reject) => {
  if (!file) return resolve(null);
  const r = new FileReader();
  r.onload = e => resolve({ name: file.name, type: file.type, data: e.target.result.split(',')[1] });
  r.onerror = reject;
  r.readAsDataURL(file);
});

const ResourceHubCore = {
  api: {
    async get(action, params = {}) {
      // เพิ่ม t: Date.now() เพื่อแก้ปัญหา Cache ของเบราว์เซอร์
      const q = new URLSearchParams({ action, t: Date.now(), ...params });
      const r = await fetch(`${scriptURL}?${q}`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return await r.json();
    },
    // 🟢 แก้ไขตรงนี้: เพื่อโยน Error กรณีที่มี Message แนบมาจาก Google Sheet
    async post(payload) {
      const r = await fetch(scriptURL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const text = await r.text();
      try {
        const json = text ? JSON.parse(text) : { status: 'success' };
        if (json.status === 'error') throw new Error(json.message);
        return json;
      } catch (e) {
        throw e;
      }
    }
  },
  work: {
    repairs: () => ResourceHubCore.api.get('get_tasks'),
  },
  av: {
    list: () => ResourceHubCore.api.get('get_av_requests'),
    submit: payload => ResourceHubCore.api.post({ action: 'submit_av', ...payload }),
    updateStatus: payload => ResourceHubCore.api.post({ action: 'update_av_status', ...payload })
  },
  dashboard: {
    legacy: () => ResourceHubCore.api.get('get_dashboard'),
    pro: () => ResourceHubCore.api.get('get_unified_dashboard'),
  },
  master: {
    list: () => ResourceHubCore.api.get('get_master_data'),
    add: payload => ResourceHubCore.api.post({ action: 'master_add', ...payload }),
    remove: payload => ResourceHubCore.api.post({ action: 'master_delete', ...payload })
  },
  docs: {
    list: () => ResourceHubCore.api.get('get_documents'),
    add: payload => ResourceHubCore.api.post({ action: 'add_document', ...payload }),
    remove: payload => ResourceHubCore.api.post({ action: 'delete_document', ...payload })
  },
  ui: {
    async loadTeacherHistory(type) {
      if (!currentTeacher) return;
      const isRepair = type === 'repair';
      const nameEl = $(isRepair ? 'profile-teacher-name' : 'profile-teacher-av-name');
      if (nameEl) nameEl.textContent = isRepair ? `ยินดีต้อนรับ, ${sanitizeHtml(currentTeacher)}` : `ประวัติการขอยืมอุปกรณ์โสตฯ ของคุณ ${sanitizeHtml(currentTeacher)};`

      const promise = isRepair
        ? ResourceHubCore.work.repairs().then(d => (d || []).filter(r => r[3]?.toString().trim() === currentTeacher.trim()))
        : ResourceHubCore.av.list().then(d => (d || []).filter(r => r[1]?.toString().trim() === currentTeacher.trim() || r[7]?.toString().trim() === currentTeacher.trim()));

      const tbodyId = isRepair ? 'teacherTaskBody' : 'teacherAVTaskBody';
      const emptyMsg = isRepair ? 'คุณยังไม่มีประวัติการแจ้งซ่อมอาคารในระบบครับ' : 'คุณยังไม่มีประวัติการขอยืมอุปกรณ์โสตฯ ในระบบครับ';

      await renderTableData(promise, tbodyId, r => {
        if (isRepair) {
          const img = r[5] && r[5] !== '-' ? `<a href="${r[5]}" target="_blank" class="text-blue-600 underline font-semibold"><i class="fa-solid fa-image"></i> ดูรูป</a>` : '-';
          const tech = r[6] ? `<span class="font-bold text-slate-700">ช่าง: ${sanitizeHtml(r[6])}</span><br><span class="text-xs text-slate-500">${sanitizeHtml(r[7] || '')}</span>` : '<span class="text-slate-400">รอเจ้าหน้าที่รับเรื่อง</span>';
          return `<tr class="border-b hover:bg-slate-50 transition-colors"><td class="p-4 text-slate-500">${sanitizeHtml(r[0])}</td><td class="p-4 font-bold text-slate-800">${sanitizeHtml(r[1])}</td><td class="p-4"><div class="bg-slate-50 border border-slate-200 rounded-lg p-2.5 whitespace-pre-wrap text-sm text-slate-700 min-w-[200px]">${sanitizeHtml(r[2])}</div></td><td class="p-4">${img}</td><td class="p-4">${statusTagClass(r[4])}</td><td class="p-4">${tech}</td></tr>`;
        } else {
          const st = r[5] || 'รอยืนยันการยืม';
          const tech = r[6] || '<span class="text-slate-400">รอเจ้าหน้าที่รับเรื่อง</span>';
          return `<tr class="border-b hover:bg-slate-50 transition-colors"><td class="p-4 text-slate-500">${sanitizeHtml(r[0])}</td><td class="p-4 font-bold text-slate-800">${sanitizeHtml(r[2])}</td><td class="p-4 text-slate-600">${sanitizeHtml(r[3])}</td><td class="p-4 text-slate-700 font-semibold">${sanitizeHtml(r[4])}</td><td class="p-4">${statusTagClass(st)}</td><td class="p-4">${tech}</td></tr>`;
        }
      }, 6, emptyMsg);
    },
    async submitRepair() {
      const subject = $('subject').value.trim();
      let detail = $('detail').value.trim();
      const reporter = $('reporter').value.trim();
      const dept = $('department') ? $('department').value.trim() : '';
      const loc = $('repair_location') ? $('repair_location').value.trim() : '';
      const urgency = document.querySelector('input[name="urgency"]:checked') ? document.querySelector('input[name="urgency"]:checked').value : '';
      const contact = $('contact') ? $('contact').value.trim() : '';
      const incidentDate = $('incident_date') ? $('incident_date').value : '';

      let formattedIncidentDate = incidentDate;
      if (incidentDate) {
        const d = new Date(incidentDate);
        formattedIncidentDate = d.toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' });
      }

      const btn = $('btnSubmitRepair');
      if (!subject || !reporter) return alertBox('warning', 'กรอกข้อมูลไม่ครบ', 'กรุณากรอกหัวข้อปัญหา');
      setBusy(btn, true);
      try {
        const file = await readFile($('file').files[0]);
        if (file) file.folderId = REPAIR_DRIVE_FOLDER_ID;
        await ResourceHubCore.api.post({ action: 'submit_repair', subject, detail, reporter, file, folderId: REPAIR_DRIVE_FOLDER_ID, urgency, dept, loc, incidentDate: formattedIncidentDate, contact });
        setBusy(btn, false, '<i class="fa-solid fa-paper-plane"></i> <span>ส่งเรื่องแจ้งซ่อม</span>');
        await alertBox('success', 'สำเร็จ', 'ส่งเรื่องแจ้งซ่อมเรียบร้อยแล้ว', { timer: 2000, showConfirmButton: false });
        $('repairForm').reset();
        nav('page-teacher-profile');
      } catch (e) {
        setBusy(btn, false, '<i class="fa-solid fa-paper-plane"></i> <span>ส่งเรื่องแจ้งซ่อม</span>');
        alertBox('error', 'ข้อผิดพลาด', e.message || 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
      }
    },
    async loadAdminTable(type) {
      const isRepair = type === 'repair';
      const tbodyId = isRepair ? 'taskBody' : 'avDataView';
      const colSpan = isRepair ? 8 : 9;
      try {
        const rawData = isRepair ? await ResourceHubCore.work.repairs() : await ResourceHubCore.av.list();
        if (!rawData || !rawData.length) {
          $(tbodyId).innerHTML = `<tr><td colspan="${colSpan}" class="p-8 text-center text-slate-500">${isRepair ? 'ไม่มีรายการแจ้งซ่อม' : 'ยังไม่มีรายการแจ้งยืมครับ'}</td></tr>`;
          return;
        }

        if (isRepair) {
          window.allRepairTasks = rawData;
          if (!window.currentRepairTab) window.currentRepairTab = 'all';
          if (typeof window.renderRepairTable === 'function') window.renderRepairTable();
        } else {
          window.allAVTasks = rawData;
          if (!window.currentAVTab) window.currentAVTab = 'all';
          if (typeof window.renderAVTable === 'function') window.renderAVTable();
        }
      } catch (e) {
        console.error(e);
        $(tbodyId).innerHTML = `<tr><td colspan="${colSpan}" class="p-8 text-center text-rose-500">ไม่สามารถโหลดข้อมูลได้ในขณะนี้</td></tr>`;
      }
    },
    async updateRepair(index) {
      const r = await Swal.fire({ title: 'อัปเดตสถานะงาน', showDenyButton: true, showCancelButton: true, confirmButtonText: 'กำลังดำเนินการ', denyButtonText: 'เสร็จสิ้น (แนบรูป)', confirmButtonColor: '#3b82f6', denyButtonColor: '#10b981' });
      if (r.isConfirmed) {
        return submitAction(
          () => ResourceHubCore.api.post({ action: 'update_task_status', rowIndex: index, status: 'กำลังดำเนินการ' }),
          'อัปเดตสถานะเรียบร้อย',
          () => ResourceHubCore.ui.loadAdminTable('repair')
        );
      }
      if (!r.isDenied) return;
      const x = await Swal.fire({
        title: 'ปิดงานซ่อม',
        html: `<div class="text-left space-y-3 mt-4 text-slate-900">
                         <input id="techName" class="w-full p-2.5 border rounded-lg" placeholder="ชื่อช่างผู้ซ่อม">
                         <textarea id="fixDetail" rows="2" class="w-full p-2.5 border rounded-lg" placeholder="ซ่อมหรือแก้ไขอะไรไปบ้าง?"></textarea>
                         <label class="block text-xs font-semibold text-slate-600 mt-2">รูปภาพผลการซ่อม (บังคับ)</label>
                         <input type="file" id="proofFile" accept="image/*" class="w-full p-2 border rounded-lg text-sm bg-slate-50">
                         <hr class="my-2 border-slate-200">
                         <label class="block text-xs font-semibold text-slate-600">ค่าใช้จ่ายในการซ่อม (บาท) [ไม่บังคับ]</label>
                         <input type="number" id="repairCost" min="0" class="w-full p-2.5 border rounded-lg bg-slate-50" placeholder="0">
                         <label class="block text-xs font-semibold text-slate-600 mt-2">เอกสารใบเสร็จ / เบิกจ่าย [ไม่บังคับ]</label>
                         <input type="file" id="receiptFile" accept="image/*,application/pdf" class="w-full p-2 border rounded-lg text-sm bg-slate-50">
                       </div>`,
        focusConfirm: false, showCancelButton: true, confirmButtonText: 'บันทึกปิดงาน', cancelButtonText: 'ยกเลิก',
        preConfirm: () => {
          const techName = $('techName').value.trim();
          const fixDetail = $('fixDetail').value.trim();
          const file = $('proofFile').files[0];
          const cost = $('repairCost').value.trim();
          const receipt = $('receiptFile').files[0];
          if (!techName || !fixDetail || !file) return Swal.showValidationMessage('กรุณากรอกข้อมูลและแนบรูปภาพให้ครบถ้วนครับ');
          return { techName, fixDetail, file, cost, receipt };
        }
      });
      if (!x.isConfirmed) return;
      submitAction(
        async () => {
          const file = await readFile(x.value.file);
          if (file) file.folderId = REPAIR_DRIVE_FOLDER_ID;
          let receiptFile = null;
          if (x.value.receipt) {
            receiptFile = await readFile(x.value.receipt);
          }
          return ResourceHubCore.api.post({
            action: 'update_task_proof',
            rowIndex: index,
            technician: x.value.techName,
            fixDetail: x.value.fixDetail,
            file,
            folderId: REPAIR_DRIVE_FOLDER_ID,
            cost: x.value.cost,
            receiptFile
          });
        },
        'ปิดงานสำเร็จ',
        () => ResourceHubCore.ui.loadAdminTable('repair')
      );
    },
    async updateAV(index, oldStatus, oldTech) {
      const { value: v } = await Swal.fire({
        title: '🎛️ อัปเดตสถานะงานโสตฯ',
        html: `<div class="text-left space-y-4 mt-2 text-slate-900"><select id="swal-av-status" class="w-full p-2.5 border rounded-xl bg-slate-50 font-semibold"><option value="รอยืนยันการยืม">⏳ รอยืนยันการยืม / รอตรวจสอบ</option><option value="จัดเตรียมแล้ว">🛠️ จัดเตรียมอุปกรณ์ให้แล้ว</option><option value="กำลังใช้งาน">🔊 กำลังใช้งาน / อยู่ระหว่างกิจกรรม</option><option value="เสร็จสิ้น/คืนเรียบร้อย">✅ เสร็จสิ้น / ตรวจรับของคืนเรียบร้อย</option></select><input id="swal-av-tech" class="w-full p-2.5 border rounded-xl bg-slate-50" placeholder="ระบุชื่อเจ้าหน้าที่โสตฯ" value="${oldTech !== '-' ? oldTech : ''}"></div>`,
        focusConfirm: false, showCancelButton: true, confirmButtonText: 'บันทึกสถานะ', cancelButtonText: 'ยกเลิก', confirmButtonColor: '#f59e0b',
        didOpen: () => { $('swal-av-status').value = oldStatus; },
        preConfirm: () => {
          const status = $('swal-av-status').value, tech = $('swal-av-tech').value.trim();
          if (!tech) return Swal.showValidationMessage('กรุณาระบุชื่อเจ้าหน้าที่ผู้ดูแลด้วยครับ');
          return { status, tech };
        }
      });
      if (!v) return;
      Swal.fire({ title: 'กำลังบันทึก...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
      try {
        await ResourceHubCore.av.updateStatus({ rowIndex: index, status: v.status, technician: v.tech });
        await alertBox('success', 'อัปเดตเรียบร้อย', '', { timer: 1500, showConfirmButton: false });
        ResourceHubCore.ui.loadAdminTable('av');
      } catch (e) { alertBox('error', 'เกิดข้อผิดพลาด', 'ไม่สามารถอัปเดตข้อมูลได้'); }
    },
    async loadDashboard() {
      try {
        const d = await ResourceHubCore.dashboard.legacy();
        const bTotal = Number(d?.building?.total) || 0;
        const bPending = Number(d?.building?.pending) || 0;
        const bProgress = Number(d?.building?.inProgress) || 0;
        const bCompleted = Number(d?.building?.completed) || 0;

        const avTotal = Number(d?.av?.total) || 0;
        const avPending = Number(d?.av?.pending) || 0;
        const avActive = Number(d?.av?.active) || 0;
        const avCompleted = Number(d?.av?.completed) || 0;

        const totalAll = bTotal + avTotal;
        const pendingAll = bPending + avPending;
        const progressAll = bProgress + avActive;
        const completedAll = bCompleted + avCompleted;

        // ยอดรวมระบบทั้งหมด
        if ($('dash-total-all')) $('dash-total-all').textContent = totalAll;
        if ($('dash-pending-all')) $('dash-pending-all').textContent = pendingAll;
        if ($('dash-progress-all')) $('dash-progress-all').textContent = progressAll;
        if ($('dash-completed-all')) $('dash-completed-all').textContent = completedAll;

        // งานซ่อมบำรุงอาคาร
        if ($('b-total')) $('b-total').textContent = bTotal;
        if ($('b-pending')) $('b-pending').textContent = bPending;
        if ($('b-progress')) $('b-progress').textContent = bProgress;
        if ($('b-completed')) $('b-completed').textContent = bCompleted;

        // งานยืม-คืนโสตฯ
        if ($('av-total')) $('av-total').textContent = avTotal;
        if ($('av-pending')) $('av-pending').textContent = avPending;
        if ($('av-active')) $('av-active').textContent = avActive;
        if ($('av-completed')) $('av-completed').textContent = avCompleted;

        // สถิติรายงานบั๊ก
        if ($('bug-count')) $('bug-count').textContent = d?.bugs || 0;

        // สัดส่วนกราฟและอัตราความสำเร็จ
        if ($('ratio-building-count')) $('ratio-building-count').textContent = `${bTotal} รายการ`;
        if ($('ratio-av-count')) $('ratio-av-count').textContent = `${avTotal} รายการ`;
        const bPct = totalAll > 0 ? Math.round((bTotal / totalAll) * 100) : 50;
        const avPct = totalAll > 0 ? (100 - bPct) : 50;
        if ($('ratio-building-bar')) $('ratio-building-bar').style.width = `${bPct}%`;
        if ($('ratio-av-bar')) $('ratio-av-bar').style.width = `${avPct}%`;
        if ($('ratio-building-pct')) $('ratio-building-pct').textContent = `${bPct}%`;
        if ($('ratio-av-pct')) $('ratio-av-pct').textContent = `${avPct}%`;

        const completedPct = totalAll > 0 ? Math.round((completedAll / totalAll) * 100) : 0;
        if ($('overall-progress-bar')) $('overall-progress-bar').style.width = `${completedPct}%`;
        if ($('overall-progress-text')) $('overall-progress-text').textContent = `${completedPct}%`;

        // กราฟวงกลม (Doughnut Chart)
        const ctx = document.getElementById('dashboardChart');
        if (ctx) {
          if (window.dashboardChartInstance) {
            window.dashboardChartInstance.destroy();
          }
          window.dashboardChartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
              labels: ['รอดำเนินการ', 'กำลังดำเนินการ', 'เสร็จสิ้น'],
              datasets: [{
                data: [pendingAll, progressAll, completedAll],
                backgroundColor: ['#f59e0b', '#265D5A', '#10b981'],
                borderWidth: 0,
                hoverOffset: 4
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              cutout: '70%',
              plugins: {
                legend: { position: 'bottom', labels: { font: { family: 'Prompt' }, usePointStyle: true, padding: 20 } }
              }
            }
          });
        }

      } catch (e) { console.error('Error loading dashboard stats:', e); }
    }
  }
};

const post = data => ResourceHubCore.api.post(data);
const get = (action, params = {}) => ResourceHubCore.api.get(action, params);

document.addEventListener('DOMContentLoaded', () => {
  updateSessionUI();
  window.addEventListener('click', (e) => {
    const dropdown = $('profile-dropdown');
    if (dropdown && !e.target.closest('#profile-dropdown') && !e.target.closest('button[onclick="toggleProfileDropdown()"]')) {
      dropdown.classList.add('hidden');
    }
  });
});

// === auth.js ===
const LIFF_ID = "2011401549-8xNgb1CC"; // <-- เปลี่ยนเป็น LIFF ID ของคุณ

document.addEventListener('DOMContentLoaded', () => {
  if (LIFF_ID && LIFF_ID !== "ใส่_LIFF_ID_ที่นี่") {
    liff.init({ liffId: LIFF_ID }).then(() => {
      if (liff.isLoggedIn()) {
        handleLiffLogin();
      }
    }).catch(err => {
      console.error('LIFF Initialization failed', err);
    });
  }
});

function loginWithLine() {
  if (!LIFF_ID || LIFF_ID === "ใส่_LIFF_ID_ที่นี่") {
    alertBox('error', 'ระบบยังไม่พร้อม', 'ผู้ดูแลระบบยังไม่ได้ตั้งค่า LIFF ID');
    return;
  }
  if (!liff.isLoggedIn()) {
    liff.login();
  } else {
    handleLiffLogin();
  }
}

function handleLiffLogin() {
  Swal.fire({ title: 'กำลังตรวจสอบบัญชี LINE...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
  liff.getProfile().then(profile => {
    const idToken = liff.getDecodedIDToken();
    const email = idToken ? idToken.email : null;
    const lineId = profile.userId;
    const name = profile.displayName;
    const picture = profile.pictureUrl;
    
    if (!email) {
      alertBox('error', 'ข้อผิดพลาด', 'ไม่สามารถดึงอีเมลจากบัญชี LINE ได้ กรุณาอนุญาตให้ระบบเข้าถึงอีเมลของคุณ');
      liff.logout();
      return;
    }
    
    post({ action: 'link_line_account', email: email, lineId: lineId, name: name, picture: picture })
      .then((res) => {
        currentTeacher = res.name;
        currentRole = res.role;
        isAdminLoggedIn = (res.role === 'Admin' || res.role === 'Executive');

        sessionStorage.setItem('logged_teacher', currentTeacher);
        sessionStorage.setItem('logged_role', currentRole);
        if (isAdminLoggedIn) sessionStorage.setItem('logged_admin', 'true');
        sessionStorage.setItem('session_login_time', Date.now().toString());

        updateSessionUI();
        alertBox('success', 'เข้าสู่ระบบสำเร็จ', `เชื่อมโยง LINE ID เรียบร้อย ยินดีต้อนรับ คุณ ${currentTeacher}`, { timer: 1500, showConfirmButton: false })
          .then(() => {
            if (isAdminLoggedIn) nav('page-dashboard');
            else nav('page-teacher-profile');
          });
      })
      .catch((e) => {
        alertBox('error', 'เข้าสู่ระบบไม่สำเร็จ', e.message || 'ไม่พบอีเมลในระบบ');
        liff.logout();
      });
  }).catch(err => {
    alertBox('error', 'ข้อผิดพลาด', err.message);
  });
}

function toggleAuthMode() {
  isRegisterMode = !isRegisterMode;
  const reg = isRegisterMode;
  $('auth-title').textContent = reg ? 'สมัครสมาชิกผู้ใช้งานใหม่' : 'เข้าสู่ระบบผู้ใช้งาน';
  $('auth-subtitle').textContent = reg ? 'กรอกข้อมูลและเลือก Role เพื่อสร้างบัญชี' : 'กรอกอีเมล/เบอร์โทรและรหัสผ่านเพื่อเข้าใช้งาน';
  $('auth-btn-text').textContent = reg ? 'สมัครสมาชิก' : 'เข้าสู่ระบบ';
  if ($('name-field-box')) $('name-field-box').classList.toggle('hidden', !reg);
  if ($('phone-field-box')) $('phone-field-box').classList.toggle('hidden', !reg);
  if ($('role-field-box')) $('role-field-box').classList.toggle('hidden', !reg);
  $('toggle-auth-btn').textContent = reg ? 'มีบัญชีอยู่แล้ว? เข้าสู่ระบบ' : 'ยังไม่มีบัญชี? สมัครสมาชิกใหม่';
}

function handleCredentialResponse(response) {
  Swal.fire({ title: 'กำลังตรวจสอบ...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

  post({ action: 'google_login', credential: response.credential })
    .then((res) => {
      // res.role = 'Teacher' | 'Admin' | 'Staff'
      currentTeacher = res.name;
      currentRole = res.role;
      isAdminLoggedIn = (res.role === 'Admin' || res.role === 'Executive');

      sessionStorage.setItem('logged_teacher', currentTeacher);
      sessionStorage.setItem('logged_role', currentRole);
      if (isAdminLoggedIn) sessionStorage.setItem('logged_admin', 'true');
      sessionStorage.setItem('session_login_time', Date.now().toString());

      updateSessionUI();
      alertBox('success', 'เข้าสู่ระบบสำเร็จ', `ยินดีต้อนรับ คุณ ${currentTeacher}`, { timer: 1500, showConfirmButton: false })
        .then(() => {
          if (isAdminLoggedIn) nav('page-dashboard');
          else nav('page-teacher-profile');
        });
    })
    .catch((e) => {
      alertBox('error', 'เข้าสู่ระบบไม่สำเร็จ', e.message || 'เกิดข้อผิดพลาดในการตรวจสอบสิทธิ์');
    });
}

function handleGlobalLogout() {
  sessionStorage.removeItem('logged_teacher');
  sessionStorage.removeItem('logged_admin');
  currentTeacher = null;
  isAdminLoggedIn = false;
  updateSessionUI();
  alertBox('info', 'ออกจากระบบเรียบร้อย', '', { timer: 1000, showConfirmButton: false });
  nav('page-auth');
}

// === nav.js ===
function nav(pageId) {
  if (!currentTeacher && !isAdminLoggedIn && pageId !== 'page-auth') {
    alertBox('warning', 'ต้องเข้าสู่ระบบก่อน', 'กรุณาเข้าสู่ระบบก่อนใช้งานเมนูนี้ครับ');
    return nav('page-auth');
  }

  $$('.page-section').forEach(e => e.classList.remove('active'));
  if ($(pageId)) $(pageId).classList.add('active');
  window.scrollTo(0, 0);

  $$('.gmail-nav-item').forEach(el => el.classList.remove('active'));
  const activeMap = {
    'page-home': 'gnav-home',
    'page-repair-form': 'gnav-repair',
    'page-av-form': 'gnav-av',
    'page-teacher-profile': 'gnav-teacher-profile',
    'page-teacher-av-profile': 'gnav-teacher-av-profile',
    'page-dashboard': 'gnav-dash',
    'page-technician': 'gnav-tech-menu',
    'page-av-manage': 'gnav-av-manage-menu',
    'page-master-data': 'gnav-master-data',
    'page-document': 'gnav-document',
    'page-user-manage': 'gnav-user-manage'
  };
  if (activeMap[pageId] && $(activeMap[pageId])) {
    $(activeMap[pageId]).classList.add('active');
  }
  if (activeMap[pageId] && $(activeMap[pageId])) {
    $(activeMap[pageId]).classList.add('active');
  }
  if (pageId === 'page-user-manage') {
    if (typeof fetchUsers === 'function') fetchUsers();
  }

  if (pageId === 'page-dashboard') {
    ResourceHubCore.ui.loadDashboard();
    loadDashboardPro();
  } else if (pageId === 'page-teacher-profile') {
    ResourceHubCore.ui.loadTeacherHistory('repair');
  } else if (pageId === 'page-teacher-av-profile') {
    ResourceHubCore.ui.loadTeacherHistory('av');
  } else if (pageId === 'page-technician') {
    ResourceHubCore.ui.loadAdminTable('repair');
  } else if (pageId === 'page-av-manage') {
    ResourceHubCore.ui.loadAdminTable('av');
  } else if (pageId === 'page-master-data') {
    loadMasterData();
  } else if (pageId === 'page-bug-manage') {
    loadBugAdmin();
  }

  if (currentTeacher) {
    if ($('reporter')) $('reporter').value = currentTeacher;
    if ($('borrower')) $('borrower').value = currentTeacher;
    if ($('signerName')) $('signerName').value = currentTeacher;
  }
}

function updateSessionUI() {
  const dashNav = $('gnav-dash');
  const techNav = $('gnav-tech-menu');
  const avManageNav = $('gnav-av-manage-menu');
  const teacherProfileNav = $('gnav-teacher-profile');
  const teacherAVProfileNav = $('gnav-teacher-av-profile');
  const masterDataNav = $('gnav-master-data');

  const basicNavHome = $('gnav-home');
  const basicNavRepair = $('gnav-repair');
  const basicNavAV = $('gnav-av');
  const basicNavCreateBtn = $('gnav-create-btn');

  const homeCardDash = $('home-card-dash');
  const homeCardTeacherProfile = $('home-card-teacher-profile');
  const homeCardTeacherAVProfile = $('home-card-teacher-av-profile');

  const docNav = $('gnav-document');
  const homeCardDocument = $('home-card-document');

  if (isAdminLoggedIn) {
    if (dashNav) { dashNav.classList.remove('hidden'); dashNav.classList.add('flex'); }
    if (techNav) { techNav.classList.remove('hidden'); techNav.classList.add('flex'); }
    if (avManageNav) { avManageNav.classList.remove('hidden'); avManageNav.classList.add('flex'); }
    if (masterDataNav) { masterDataNav.classList.remove('hidden'); masterDataNav.classList.add('flex'); }
    if ($('gnav-bug-manage')) { $('gnav-bug-manage').classList.remove('hidden'); $('gnav-bug-manage').classList.add('flex'); }
    if ($('gnav-user-manage')) { $('gnav-user-manage').classList.remove('hidden'); $('gnav-user-manage').classList.add('flex'); }
    if (docNav) { docNav.classList.remove('hidden'); docNav.classList.add('flex'); }
    if (homeCardDocument) { homeCardDocument.classList.remove('hidden'); homeCardDocument.classList.add('flex'); }
    if (teacherProfileNav) teacherProfileNav.classList.add('hidden');
    if (teacherAVProfileNav) teacherAVProfileNav.classList.add('hidden');
    if (homeCardDash) { homeCardDash.classList.remove('hidden'); homeCardDash.classList.add('flex'); }
    if (homeCardTeacherProfile) homeCardTeacherProfile.classList.add('hidden');
    if (homeCardTeacherAVProfile) homeCardTeacherAVProfile.classList.add('hidden');

    // Admin sees the basic menus too!
    if (basicNavHome) { basicNavHome.classList.remove('hidden'); basicNavHome.classList.add('flex'); }
    if (basicNavRepair) { basicNavRepair.classList.remove('hidden'); basicNavRepair.classList.add('flex'); }
    if (basicNavAV) { basicNavAV.classList.remove('hidden'); basicNavAV.classList.add('flex'); }
    if (basicNavCreateBtn) { basicNavCreateBtn.classList.remove('hidden'); }

    if ($('dropdown-user-name')) $('dropdown-user-name').textContent = currentRole === 'Executive' ? 'ผู้บริหาร (Executive)' : 'ผู้ดูแลระบบ (Admin)';
    if ($('dropdown-user-role')) $('dropdown-user-role').textContent = currentRole === 'Executive' ? 'สถานะ: ผู้บริหาร' : 'สถานะ: เจ้าหน้าที่ / Admin';

    if ($('page-auth').classList.contains('active')) nav('page-dashboard');

  } else if (currentTeacher) {
    if (dashNav) dashNav.classList.add('hidden');
    if (techNav) techNav.classList.add('hidden');
    if (avManageNav) avManageNav.classList.add('hidden');
    if (masterDataNav) masterDataNav.classList.add('hidden');
    if ($('gnav-bug-manage')) $('gnav-bug-manage').classList.add('hidden');
    if ($('gnav-user-manage')) $('gnav-user-manage').classList.add('hidden');
    if (docNav) docNav.classList.add('hidden');
    if (homeCardDocument) homeCardDocument.classList.add('hidden');
    if (teacherProfileNav) teacherProfileNav.classList.add('hidden');
    if (teacherAVProfileNav) teacherAVProfileNav.classList.add('hidden');
    if (homeCardDash) homeCardDash.classList.add('hidden');
    if (homeCardTeacherProfile) homeCardTeacherProfile.classList.add('hidden');
    if (homeCardTeacherAVProfile) homeCardTeacherAVProfile.classList.add('hidden');

    let roleDisplay = 'ผู้ใช้งานระบบ';

    if (currentRole === 'Tech') {
      roleDisplay = 'ช่างซ่อมบำรุง (Tech)';
      if (dashNav) { dashNav.classList.remove('hidden'); dashNav.classList.add('flex'); }
      if (techNav) { techNav.classList.remove('hidden'); techNav.classList.add('flex'); }
      if (homeCardDash) { homeCardDash.classList.remove('hidden'); homeCardDash.classList.add('flex'); }

      if (basicNavHome) basicNavHome.classList.add('hidden');
      if (basicNavRepair) basicNavRepair.classList.add('hidden');
      if (basicNavAV) basicNavAV.classList.add('hidden');
      if (basicNavCreateBtn) basicNavCreateBtn.classList.add('hidden');

    } else if (currentRole === 'AV') {
      roleDisplay = 'เจ้าหน้าที่โสตฯ (AV)';
      if (dashNav) { dashNav.classList.remove('hidden'); dashNav.classList.add('flex'); }
      if (avManageNav) { avManageNav.classList.remove('hidden'); avManageNav.classList.add('flex'); }
      if (homeCardDash) { homeCardDash.classList.remove('hidden'); homeCardDash.classList.add('flex'); }

      if (basicNavHome) basicNavHome.classList.add('hidden');
      if (basicNavRepair) basicNavRepair.classList.add('hidden');
      if (basicNavAV) basicNavAV.classList.add('hidden');
      if (basicNavCreateBtn) basicNavCreateBtn.classList.add('hidden');

    } else if (currentRole === 'Staff') {
      roleDisplay = 'เจ้าหน้าที่ / แอดมิน (Staff)';
      if (dashNav) { dashNav.classList.remove('hidden'); dashNav.classList.add('flex'); }
      if (techNav) { techNav.classList.remove('hidden'); techNav.classList.add('flex'); }
      if (avManageNav) { avManageNav.classList.remove('hidden'); avManageNav.classList.add('flex'); }
      if (masterDataNav) { masterDataNav.classList.remove('hidden'); masterDataNav.classList.add('flex'); }
      if ($('gnav-bug-manage')) { $('gnav-bug-manage').classList.remove('hidden'); $('gnav-bug-manage').classList.add('flex'); }
      if ($('gnav-user-manage')) { $('gnav-user-manage').classList.remove('hidden'); $('gnav-user-manage').classList.add('flex'); }
      if (docNav) { docNav.classList.remove('hidden'); docNav.classList.add('flex'); }
      if (homeCardDocument) { homeCardDocument.classList.remove('hidden'); homeCardDocument.classList.add('flex'); }
      if (homeCardDash) { homeCardDash.classList.remove('hidden'); homeCardDash.classList.add('flex'); }

      if (basicNavHome) basicNavHome.classList.add('hidden');
      if (basicNavRepair) basicNavRepair.classList.add('hidden');
      if (basicNavAV) basicNavAV.classList.add('hidden');
      if (basicNavCreateBtn) basicNavCreateBtn.classList.add('hidden');

    } else {
      // Teacher

      roleDisplay = 'คุณครู / บุคลากร';
      if (teacherProfileNav) { teacherProfileNav.classList.remove('hidden'); teacherProfileNav.classList.add('flex'); }
      if (teacherAVProfileNav) { teacherAVProfileNav.classList.remove('hidden'); teacherAVProfileNav.classList.add('flex'); }
      if (homeCardTeacherProfile) { homeCardTeacherProfile.classList.remove('hidden'); homeCardTeacherProfile.classList.add('flex'); }
      if (homeCardTeacherAVProfile) { homeCardTeacherAVProfile.classList.remove('hidden'); homeCardTeacherAVProfile.classList.add('flex'); }

      if (basicNavHome) { basicNavHome.classList.remove('hidden'); basicNavHome.classList.add('flex'); }
      if (basicNavRepair) { basicNavRepair.classList.remove('hidden'); basicNavRepair.classList.add('flex'); }
      if (basicNavAV) { basicNavAV.classList.remove('hidden'); basicNavAV.classList.add('flex'); }
      if (basicNavCreateBtn) { basicNavCreateBtn.classList.remove('hidden'); }
    }

    if ($('dropdown-user-name')) $('dropdown-user-name').textContent = `คุณครู ${currentTeacher}`;
    if ($('dropdown-user-role')) $('dropdown-user-role').textContent = `สถานะ: ${roleDisplay}`;

    if ($('page-auth').classList.contains('active')) nav('page-teacher-profile');

  } else {
    if (dashNav) dashNav.classList.add('hidden');
    if (techNav) techNav.classList.add('hidden');
    if (avManageNav) avManageNav.classList.add('hidden');
    if (masterDataNav) masterDataNav.classList.add('hidden');
    if ($('gnav-bug-manage')) $('gnav-bug-manage').classList.add('hidden');
    if ($('gnav-user-manage')) $('gnav-user-manage').classList.add('hidden');
    if (teacherProfileNav) teacherProfileNav.classList.add('hidden');
    if (teacherAVProfileNav) teacherAVProfileNav.classList.add('hidden');
    if (homeCardDash) homeCardDash.classList.add('hidden');
    if (homeCardTeacherProfile) homeCardTeacherProfile.classList.add('hidden');
    if (homeCardTeacherAVProfile) homeCardTeacherAVProfile.classList.add('hidden');

    if (basicNavHome) { basicNavHome.classList.remove('hidden'); basicNavHome.classList.add('flex'); }
    if (basicNavRepair) { basicNavRepair.classList.remove('hidden'); basicNavRepair.classList.add('flex'); }
    if (basicNavAV) { basicNavAV.classList.remove('hidden'); basicNavAV.classList.add('flex'); }
    if (basicNavCreateBtn) { basicNavCreateBtn.classList.remove('hidden'); }

    if ($('dropdown-user-name')) $('dropdown-user-name').textContent = 'ยังไม่ได้เข้าสู่ระบบ';
    if ($('dropdown-user-role')) $('dropdown-user-role').textContent = 'สถานะ: ทั่วไป';

    nav('page-auth');
  }

  updateNotificationBadges();
}

function handleGlobalSearch(keyword) {
  const term = keyword.toLowerCase().trim();
  if (!term) return;

  if (term.includes('ซ่อม')) {
    nav('page-repair-form');
  } else if (term.includes('โสต') || term.includes('ยืม')) {
    nav('page-av-form');
  } else if (term.includes('มอนิเตอร์') || term.includes('กราฟ') || term.includes('dashboard')) {
    if (isAdminLoggedIn) nav('page-dashboard');
  } else if (term.includes('ประวัติ')) {
    if (currentTeacher) nav('page-teacher-profile');
  }
}

function toggleProfileDropdown() {
  const dropdown = $('profile-dropdown');
  if (dropdown) dropdown.classList.toggle('hidden');
}

function openProfileModal() {
  const name = isAdminLoggedIn ? 'ผู้ดูแลระบบ (Admin)' : (currentTeacher ? `คุณครู ${currentTeacher}` : 'บุคคลทั่วไป');
  const role = isAdminLoggedIn ? 'เจ้าหน้าที่ / Admin' : (currentTeacher ? 'ผู้ใช้งาน' : 'ยังไม่ได้เข้าสู่ระบบ');

  Swal.fire({
    title: '👤 ข้อมูลบัญชีผู้ใช้งาน',
    html: `
          <div class="text-left space-y-3 mt-4 bg-slate-50 p-4 rounded-2xl border text-slate-900">
            <div><span class="text-xs text-slate-400 font-semibold uppercase">ชื่อบัญชี</span><p class="font-bold text-slate-800 text-lg">${name}</p></div>
            <div><span class="text-xs text-slate-400 font-semibold uppercase">ประเภทผู้ใช้งาน</span><p class="font-semibold text-blue-600">${role}</p></div>
          </div>
        `,
    confirmButtonText: 'ปิดหน้าต่าง',
    confirmButtonColor: '#0b57d0'
  });
}

async function openBugReportModal(page) {
  const { value: v } = await Swal.fire({
    title: '⚠️ แจ้งปัญหาโปรแกรม',
    html: `<div style="text-align:left;gap:12px;display:flex;flex-direction:column;margin-top:10px">
          <input id="bug-reporter" class="w-full p-3 border rounded-xl text-slate-900" placeholder="ชื่อผู้แจ้ง" value="${currentTeacher || (isAdminLoggedIn ? 'Admin' : '')}">
          <input id="bug-page" class="w-full p-3 border rounded-xl text-slate-900" placeholder="หน้าที่มีปัญหา เช่น หน้าแรก, ยืมของ" value="${page || ''}">
          <textarea id="bug-issue" class="w-full p-3 border rounded-xl text-slate-900" rows="3" placeholder="อาการที่พบ เช่น หน้าจอค้าง บันทึกช้า"></textarea>
        </div>`,
    focusConfirm: false, showCancelButton: true,
    confirmButtonText: 'ส่งรายงาน', confirmButtonColor: '#e11d48',
    preConfirm: () => {
      const reporter = $('bug-reporter').value.trim();
      const issue = $('bug-issue').value.trim();
      const finalPage = $('bug-page').value.trim();
      if (!reporter || !issue || !finalPage) return Swal.showValidationMessage('กรุณากรอกข้อมูลให้ครบถ้วน');
      return { reporter, issue, page: finalPage };
    }
  });
  if (!v) return;
  Swal.fire({ title: 'กำลังส่งข้อมูล...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
  post({ action: 'report_bug', ...v })
    .then(() => alertBox('success', 'ขอบคุณครับ', 'ระบบได้รับแจ้งปัญหาของท่านแล้ว', { timer: 1500, showConfirmButton: false }))
    .catch(() => alertBox('error', 'เกิดข้อผิดพลาด', 'ไม่สามารถส่งรายงานได้'));
}

// === master.js ===
const MERGED_CACHE_KEY = 'resource_hub_merged_cache_v1';
let mergedCache = { locations: [], projects: [], mechanics: [], jobs: [] };

function mergedEsc(v) {
  return String(v ?? '').replace(/[&<>'"]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[m]));
}

function mergedCacheSave() {
  try { localStorage.setItem(MERGED_CACHE_KEY, JSON.stringify(mergedCache)); } catch (e) { }
}

function mergedCacheLoad() {
  try {
    const x = JSON.parse(localStorage.getItem(MERGED_CACHE_KEY) || 'null');
    if (x) mergedCache = x;
  } catch (e) { }
}

async function loadBugAdmin() {
  try {
    const data = await get('get_bug_reports');
    renderTableData(data, 'bug-tbody', (row, index) => {
      const [time, rep, issue, page, status] = row;
      let badge = '<span class="inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold bg-rose-100 text-rose-700">รอดำเนินการ</span>';
      if (status === 'กำลังแก้ไข') badge = '<span class="inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold bg-amber-100 text-amber-700">กำลังแก้ไข</span>';
      if (status === 'แก้ไขเรียบร้อย') badge = '<span class="inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold bg-emerald-100 text-emerald-700">แก้ไขเรียบร้อย</span>';

      return `
          <td class="p-4 whitespace-nowrap">${time || '-'}</td>
          <td class="p-4 whitespace-nowrap font-medium text-slate-800">${rep || '-'}</td>
          <td class="p-4 whitespace-nowrap text-sky-600 font-semibold">${page || '-'}</td>
          <td class="p-4 min-w-[200px] whitespace-normal text-slate-600">${issue || '-'}</td>
          <td class="p-4 text-center">${badge}</td>
          <td class="p-4 text-center">
            <button onclick="updateBugStatus(${index}, '${status}')" class="text-sky-600 hover:text-sky-800 hover:bg-sky-50 p-2 rounded-lg transition-colors" title="อัปเดตสถานะ">
              <i class="fa-solid fa-pen-to-square"></i>
            </button>
          </td>
        `;
    }, 6, 'ไม่มีรายการแจ้งปัญหา');
  } catch (e) {
    $('bug-tbody').innerHTML = `<tr><td colspan="6" class="text-center py-10 text-rose-500">❌ โหลดข้อมูลล้มเหลว</td></tr>`;
  }
}

async function updateBugStatus(index, oldStatus) {
  const { value: status } = await Swal.fire({
    title: 'อัปเดตสถานะปัญหา',
    input: 'select',
    inputOptions: {
      'รอดำเนินการ': 'รอดำเนินการ',
      'กำลังแก้ไข': 'กำลังแก้ไข',
      'แก้ไขเรียบร้อย': 'แก้ไขเรียบร้อย'
    },
    inputValue: oldStatus,
    showCancelButton: true,
    confirmButtonText: 'บันทึก',
    cancelButtonText: 'ยกเลิก'
  });
  if (!status) return;

  Swal.fire({ title: 'กำลังอัปเดต...', didOpen: () => Swal.showLoading() });
  post({ action: 'update_bug_status', rowIndex: index, status })
    .then(() => {
      alertBox('success', 'บันทึกสำเร็จ', '', { timer: 1000, showConfirmButton: false });
      loadBugAdmin();
    })
    .catch(() => alertBox('error', 'เกิดข้อผิดพลาด', 'ไม่สามารถอัปเดตข้อมูลได้'));
}

async function loadMasterData() {
  try {
    const d = await ResourceHubCore.master.list();
    mergedCache = { ...mergedCache, ...d };
    mergedCacheSave();
  } catch (e) {
    mergedCacheLoad();
  }
  renderMasterData();
}

function renderMasterData() {
  const loc = $('md-locations');
  const pro = $('md-projects');
  const mec = $('md-mechanics');
  if (!loc) return;

  loc.innerHTML = (mergedCache.locations || []).map(x =>
    `<div class="flex justify-between items-center p-2 rounded-lg bg-slate-50 text-slate-800">
          <span>${mergedEsc(x.name)} <small class="text-slate-400">${mergedEsc(x.department || '')}</small></span>
          <button onclick="deleteMaster('location','${mergedEsc(x.id)}')" class="text-rose-500">ลบ</button>
        </div>`
  ).join('') || '<p class="text-slate-400 text-sm">ยังไม่มีข้อมูล</p>';

  pro.innerHTML = (mergedCache.projects || []).map(x =>
    `<div class="flex justify-between items-center p-2 rounded-lg bg-slate-50 text-slate-800">
          <span>${mergedEsc(x.name)} <small class="text-slate-400">${mergedEsc(x.department || '')}</small></span>
          <button onclick="deleteMaster('project','${mergedEsc(x.id)}')" class="text-rose-500">ลบ</button>
        </div>`
  ).join('') || '<p class="text-slate-400 text-sm">ยังไม่มีข้อมูล</p>';

  mec.innerHTML = (mergedCache.mechanics || []).map(x =>
    `<div class="p-2 rounded-lg bg-slate-50 text-slate-800">
          <div class="flex justify-between">
            <b>${mergedEsc(x.name)}</b>
            <button onclick="deleteMaster('mechanic','${mergedEsc(x.id)}')" class="text-rose-500">ลบ</button>
          </div>
          <div class="text-xs text-slate-500">${mergedEsc(x.phone || '')} · ${mergedEsc(x.skills || '')}</div>
        </div>`
  ).join('') || '<p class="text-slate-400 text-sm">ยังไม่มีข้อมูล</p>';
}

async function addMaster(type) {
  const p = { action: 'master_add', type, id: `${type}_${Date.now()}` };
  if (type === 'location') {
    p.name = $('md-location-name').value.trim();
    p.department = $('md-location-dept').value;
  }
  if (type === 'project') {
    p.name = $('md-project-name').value.trim();
    p.department = $('md-project-dept').value;
  }
  if (type === 'mechanic') {
    p.name = $('md-mechanic-name').value.trim();
    p.phone = $('md-mechanic-phone').value.trim();
    p.skills = $('md-mechanic-skills').value.trim();
    p.notes = '';
  }
  if (!p.name) return alertBox('warning', 'ข้อมูลไม่ครบ', 'กรุณากรอกชื่อข้อมูลก่อน');

  submitAction(
    () => ResourceHubCore.master.add(p),
    'เพิ่มข้อมูลสำเร็จ',
    () => {
      if ($('md-location-name')) $('md-location-name').value = '';
      if ($('md-project-name')) $('md-project-name').value = '';
      if ($('md-mechanic-name')) $('md-mechanic-name').value = '';
      if ($('md-mechanic-phone')) $('md-mechanic-phone').value = '';
      if ($('md-mechanic-skills')) $('md-mechanic-skills').value = '';
      loadMasterData();
    }
  );
}

async function deleteMaster(type, id) {
  if (!confirm('ยืนยันการลบข้อมูลนี้?')) return;
  submitAction(
    () => ResourceHubCore.master.remove({ type, id }),
    'ลบข้อมูลสำเร็จ',
    () => loadMasterData()
  );
}

function filterTable(tbodyId, searchText) {
  const tbody = document.getElementById(tbodyId);
  if (!tbody) return;
  const rows = tbody.querySelectorAll('tr');
  const query = searchText.toLowerCase().trim();

  rows.forEach(row => {
    // Skip the "loading" or "no data" placeholder row if it's there
    if (row.cells.length === 1 && row.cells[0].colSpan > 1) return;

    const rowText = row.textContent.toLowerCase();
    if (rowText.includes(query)) {
      row.style.display = '';
    } else {
      row.style.display = 'none';
    }
  });
}

function exportTableToCSV(tbodyId, filename) {
  const tbody = document.getElementById(tbodyId);
  if (!tbody) return;
  const table = tbody.closest('table');
  if (!table) return;

  let csv = [];
  const rows = table.querySelectorAll('tr');

  for (let i = 0; i < rows.length; i++) {
    // Skip hidden rows (filtered out) or placeholder rows
    if (rows[i].style.display === 'none') continue;
    if (rows[i].cells.length === 1 && rows[i].cells[0].colSpan > 1) continue;

    let row = [], cols = rows[i].querySelectorAll('td, th');

    for (let j = 0; j < cols.length; j++) {
      // Skip the first "⭐" column and the last "จัดการ" column for cleaner export
      const headerText = table.querySelector('thead tr').cells[j].innerText.trim();
      if (headerText === '⭐' || headerText === 'จัดการ') continue;

      // Get inner text, remove multiple spaces and newlines
      let data = cols[j].innerText.replace(/(\r\n|\n|\r)/gm, ' ').replace(/ +/g, ' ').trim();
      // Escape double quotes
      data = data.replace(/"/g, '""');
      // Enclose in double quotes
      row.push('"' + data + '"');
    }
    csv.push(row.join(','));
  }

  const csvString = '\\uFEFF' + csv.join('\\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

async function updateNotificationBadges() {
  if (!isAdminLoggedIn && (!currentRole || currentRole === 'Teacher')) return;
  try {
    const d = await ResourceHubCore.dashboard.legacy();

    const bPending = (Number(d?.building?.pending) || 0) + (Number(d?.building?.inProgress) || 0);
    const badgeRepair = document.getElementById('badge-repair');
    if (badgeRepair) {
      badgeRepair.textContent = bPending;
      badgeRepair.classList.remove('hidden');
    }

    const mbBadgeRepair = document.getElementById('mb-badge-repair');
    if (mbBadgeRepair) {
      mbBadgeRepair.textContent = bPending;
      mbBadgeRepair.classList.remove('hidden');
    }

    const avPending = Number(d?.av?.pending) || 0;
    const badgeAV = document.getElementById('badge-av');
    if (badgeAV) {
      badgeAV.textContent = avPending;
      badgeAV.classList.remove('hidden');
    }
  } catch (e) {
    console.error('Error loading badges:', e);
  }
}

mergedCacheLoad();

// === repair.js & av.js wrappers ===
async function submitRepair() { return ResourceHubCore.ui.submitRepair(); }
async function submitAVForm() { return ResourceHubCore.ui.submitAV(); }
async function openAVModal(idx, oldStatus, oldTech) { return ResourceHubCore.ui.updateAV(idx, oldStatus, oldTech); }
async function updateTask(idx) { return ResourceHubCore.ui.updateRepair(idx); }
function loadBuildingTasks() { return ResourceHubCore.ui.loadAdminTable('repair'); }

// === dashboard.js ===
async function loadDashboard() { return ResourceHubCore.ui.loadDashboard(); }
async function loadDashboardPro() { return ResourceHubCore.ui.loadDashboard(); }

// ========================
// ===  DOCUMENT MODULE  ===
// ========================

const DOC_DRIVE_FOLDER_ID = REPAIR_DRIVE_FOLDER_ID; // reuse same folder or set a new one
let _docAllRows = []; // cache for client-side filtering

const DOC_CATEGORY_COLORS = {
  'ราชการ': 'bg-blue-100 text-blue-700 border-blue-200',
  'วิชาการ': 'bg-violet-100 text-violet-700 border-violet-200',
  'การเงิน': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  'บุคลากร': 'bg-orange-100 text-orange-700 border-orange-200',
  'ทั่วไป': 'bg-slate-100 text-slate-600 border-slate-200',
  'อื่นๆ': 'bg-rose-100 text-rose-700 border-rose-200',
};

const FILE_ICON = ext => {
  const e = (ext || '').toLowerCase();
  if (['pdf'].includes(e)) return '<i class="fa-solid fa-file-pdf text-rose-500"></i>';
  if (['doc', 'docx'].includes(e)) return '<i class="fa-solid fa-file-word text-blue-600"></i>';
  if (['xls', 'xlsx'].includes(e)) return '<i class="fa-solid fa-file-excel text-emerald-600"></i>';
  if (['ppt', 'pptx'].includes(e)) return '<i class="fa-solid fa-file-powerpoint text-orange-500"></i>';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(e)) return '<i class="fa-solid fa-file-image text-pink-500"></i>';
  if (['zip', 'rar', '7z'].includes(e)) return '<i class="fa-solid fa-file-zipper text-amber-600"></i>';
  return '<i class="fa-solid fa-file text-slate-400"></i>';
};

async function loadDocuments() {
  const tbody = $('doc-tbody');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="7" class="p-10 text-center text-slate-400"><i class="fa-solid fa-spinner fa-spin mr-2"></i>กำลังโหลดข้อมูลเอกสาร...</td></tr>';
  try {
    const data = await ResourceHubCore.docs.list();
    _docAllRows = Array.isArray(data) ? data : [];
    renderDocTable(_docAllRows);
    updateDocStats(_docAllRows);
  } catch (e) {
    console.error(e);
    tbody.innerHTML = '<tr><td colspan="7" class="p-10 text-center text-rose-500"><i class="fa-solid fa-triangle-exclamation mr-2"></i>ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง</td></tr>';
  }
}

function updateDocStats(rows) {
  const total = rows.length;
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const recent = rows.filter(r => new Date(r[2] || r[0]) >= sevenDaysAgo).length;
  const cats = new Set(rows.map(r => (r[1] || '').trim()).filter(Boolean)).size;
  const uploaders = new Set(rows.map(r => (r[4] || '').trim()).filter(Boolean)).size;
  if ($('doc-stat-total')) $('doc-stat-total').textContent = total;
  if ($('doc-stat-recent')) $('doc-stat-recent').textContent = recent;
  if ($('doc-stat-cats')) $('doc-stat-cats').textContent = cats;
  if ($('doc-stat-uploader')) $('doc-stat-uploader').textContent = uploaders;
}

function renderDocTable(rows) {
  const tbody = $('doc-tbody');
  if (!tbody) return;
  if (!rows || !rows.length) {
    tbody.innerHTML = `<tr><td colspan="7" class="p-10 text-center">
          <div class="flex flex-col items-center gap-3 text-slate-400">
            <i class="fa-solid fa-folder-open text-5xl text-indigo-200"></i>
            <p class="font-semibold text-slate-500">ยังไม่มีเอกสารในระบบ</p>
            <button onclick="openDocUploadModal()" class="mt-1 bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-5 py-2 rounded-xl font-semibold flex items-center gap-2 transition-colors">
              <i class="fa-solid fa-cloud-arrow-up"></i> อัปโหลดเอกสาร
            </button>
          </div>
        </td></tr>`;
    return;
  }
  tbody.innerHTML = rows.map((r, i) => {
    // r = [docId, category, uploadDate, docName, uploader, fileUrl, fileExt, description]
    const docId = r[0] || '';
    const cat = r[1] || 'ทั่วไป';
    const date = r[2] || '-';
    const name = r[3] || 'ไม่มีชื่อ';
    const uploader = r[4] || '-';
    const fileUrl = r[5] || '';
    const ext = r[6] || '';
    const catClass = DOC_CATEGORY_COLORS[cat] || DOC_CATEGORY_COLORS['ทั่วไป'];
    const fileLink = fileUrl
      ? `<a href="${fileUrl}" target="_blank" class="inline-flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"><i class="fa-solid fa-cloud-arrow-down"></i> ดาวน์โหลด</a>`
      : '<span class="text-slate-300 text-xs">ไม่มีไฟล์</span>';
    return `<tr class="hover:bg-indigo-50/30 transition-colors group">
          <td class="p-4 text-slate-400 text-xs">${i + 1}</td>
          <td class="p-4">
            <div class="flex items-center gap-2">
              <span class="text-lg">${FILE_ICON(ext)}</span>
              <span class="font-semibold text-slate-800">${name}</span>
            </div>
          </td>
          <td class="p-4">
            <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${catClass}">${cat}</span>
          </td>
          <td class="p-4 text-slate-500 text-xs">${date}</td>
          <td class="p-4">
            <div class="flex items-center gap-1.5 text-xs">
              <span class="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-[10px]">${(uploader || '?')[0].toUpperCase()}</span>
              <span class="text-slate-600 font-medium">${uploader}</span>
            </div>
          </td>
          <td class="p-4">
            <span class="text-xs text-slate-500 uppercase font-mono bg-slate-100 px-2 py-0.5 rounded">${ext || '-'}</span>
          </td>
          <td class="p-4 text-center">
            <div class="flex items-center justify-center gap-2">
              ${fileLink}
              <button onclick="deleteDocument('${docId.replace(/'/g, "&#39;")}','${name.replace(/'/g, "&#39;")}')" class="text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100" title="ลบเอกสาร">
                <i class="fa-solid fa-trash text-sm"></i>
              </button>
            </div>
          </td>
        </tr>`;
  }).join('');
}

function filterDocTable(searchText) {
  const cat = $('doc-cat-filter')?.value || '';
  const query = (searchText || '').toLowerCase().trim();
  const filtered = _docAllRows.filter(r => {
    const name = (r[3] || '').toLowerCase();
    const rowCat = (r[1] || '').trim();
    const matchQuery = !query || name.includes(query) || rowCat.toLowerCase().includes(query);
    const matchCat = !cat || rowCat === cat;
    return matchQuery && matchCat;
  });
  renderDocTable(filtered);
}

async function openDocUploadModal() {
  const { value: v } = await Swal.fire({
    title: '<span style="font-size:1.1rem;font-weight:700"><i class="fa-solid fa-cloud-arrow-up" style="color:#4f46e5;margin-right:8px"></i>อัปโหลดเอกสารใหม่</span>',
    html: `
          <div class="text-left space-y-3 mt-2" style="font-family:'Prompt',sans-serif">
            <div>
              <label class="block text-xs font-semibold text-slate-600 mb-1">ชื่อเอกสาร <span class="text-red-500">*</span></label>
              <input id="swl-doc-name" class="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-900 text-sm" placeholder="เช่น แบบฟอร์มขออนุมัติลา">
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-600 mb-1">หมวดหมู่ <span class="text-red-500">*</span></label>
              <select id="swl-doc-cat" class="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-900 text-sm">
                <option value="ราชการ">ราชการ</option>
                <option value="วิชาการ">วิชาการ</option>
                <option value="การเงิน">การเงิน</option>
                <option value="บุคลากร">บุคลากร</option>
                <option value="ทั่วไป" selected>ทั่วไป</option>
                <option value="อื่นๆ">อื่นๆ</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-600 mb-1">หมายเหตุ / คำอธิบาย</label>
              <input id="swl-doc-desc" class="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-900 text-sm" placeholder="(ไม่บังคับ) คำอธิบายเพิ่มเติม">
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-600 mb-1">ไฟล์เอกสาร <span class="text-red-500">*</span></label>
              <input type="file" id="swl-doc-file" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.zip,.rar"
                class="w-full p-2 border border-slate-200 rounded-xl bg-slate-50 text-sm">
              <p class="text-[10px] text-slate-400 mt-1">รองรับ: PDF, Word, Excel, PowerPoint, รูปภาพ, ZIP (สูงสุด 20MB)</p>
            </div>
          </div>`,
    focusConfirm: false,
    showCancelButton: true,
    confirmButtonText: '<i class="fa-solid fa-cloud-arrow-up"></i> อัปโหลด',
    cancelButtonText: 'ยกเลิก',
    confirmButtonColor: '#4f46e5',
    width: '500px',
    preConfirm: () => {
      const docName = $('swl-doc-name').value.trim();
      const cat = $('swl-doc-cat').value;
      const desc = $('swl-doc-desc').value.trim();
      const file = $('swl-doc-file').files[0];
      if (!docName) return Swal.showValidationMessage('กรุณาระบุชื่อเอกสาร');
      if (!cat) return Swal.showValidationMessage('กรุณาเลือกหมวดหมู่');
      if (!file) return Swal.showValidationMessage('กรุณาเลือกไฟล์ก่อนอัปโหลด');
      if (file.size > 20 * 1024 * 1024) return Swal.showValidationMessage('ขนาดไฟล์ต้องไม่เกิน 20MB');
      return { docName, cat, desc, file };
    }
  });
  if (!v) return;

  Swal.fire({ title: 'กำลังอัปโหลดเอกสาร...', html: '<p style="font-size:0.85rem;color:#64748b">กรุณารอสักครู่ อาจใช้เวลาสักระยะ</p>', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
  try {
    const uploader = isAdminLoggedIn ? 'Admin' : (currentTeacher || 'Unknown');
    const fileData = await readFile(v.file);
    if (fileData) fileData.folderId = DOC_DRIVE_FOLDER_ID;
    const ext = v.file.name.split('.').pop();
    await ResourceHubCore.docs.add({
      docName: v.docName,
      category: v.cat,
      description: v.desc,
      uploader,
      ext,
      file: fileData,
      folderId: DOC_DRIVE_FOLDER_ID
    });
    await Swal.fire({ icon: 'success', title: 'อัปโหลดสำเร็จ!', text: `"${v.docName}" ถูกเพิ่มเข้าระบบเรียบร้อยแล้ว`, timer: 2000, showConfirmButton: false });
    loadDocuments();
  } catch (e) {
    console.error(e);
    alertBox('error', 'อัปโหลดไม่สำเร็จ', e.message || 'กรุณาลองใหม่อีกครั้ง');
  }
}

async function deleteDocument(docId, docName) {
  const confirm = await Swal.fire({
    title: 'ยืนยันการลบเอกสาร?',
    html: `<p class="text-slate-600 text-sm">คุณต้องการลบเอกสาร <strong class="text-rose-600">"${docName}"</strong> ออกจากระบบ?<br><span class="text-xs text-slate-400">การดำเนินการนี้ไม่สามารถยกเลิกได้</span></p>`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: '<i class="fa-solid fa-trash"></i> ลบเอกสาร',
    cancelButtonText: 'ยกเลิก',
    confirmButtonColor: '#e11d48'
  });
  if (!confirm.isConfirmed) return;
  submitAction(
    () => ResourceHubCore.docs.remove({ docId }),
    `ลบเอกสาร "${docName}" เรียบร้อยแล้ว`,
    () => loadDocuments()
  );
}

// === Repair Admin UI Enhancements ===
window.renderRepairTable = function () {
  const rawData = window.allRepairTasks || [];
  const listWithIndex = rawData.map((r, idx) => ({ r, originalIndex: idx }));

  const getWeight = st => {
    const s = (st || '').trim();
    if (['เสร็จสิ้น', 'เสร็จสิ้น/คืนเรียบร้อย', 'เรียบร้อยแล้ว'].includes(s)) return 3;
    if (['กำลังดำเนินการ', 'กำลังใช้งาน', 'จัดเตรียมแล้ว', 'กำลังดำเนินงาน'].includes(s)) return 2;
    return 1;
  };

  const searchQuery = (window.currentRepairSearch || '').toLowerCase().trim();

  const filteredList = listWithIndex.filter(({ r }) => {
    const w = getWeight(r[4]);
    if (window.currentRepairTab === 'pending' && w !== 1) return false;
    if (window.currentRepairTab === 'progress' && w !== 2) return false;
    if (window.currentRepairTab === 'done' && w !== 3) return false;

    if (searchQuery) {
      const detailText = (r[2] || '').toLowerCase();
      if (!detailText.includes(searchQuery)) return false;
    }

    return true;
  });

  filteredList.sort((a, b) => {
    const wA = getWeight(a.r[4]);
    const wB = getWeight(b.r[4]);
    if (wA !== wB) return wA - wB;
    return a.originalIndex - b.originalIndex;
  });

  const tbody = $('taskBody');
  if (!tbody) return;
  if (!filteredList.length) {
    tbody.innerHTML = `<tr><td colspan="8" class="p-8 text-center text-slate-500">ไม่มีรายการในสถานะนี้</td></tr>`;
    return;
  }

  tbody.innerHTML = filteredList.map(({ r, originalIndex }) => {
    const status = (r[4] || '').trim();
    const isDone = (status === 'เสร็จสิ้น' || status === 'เรียบร้อยแล้ว' || status === 'เสร็จสิ้น/คืนเรียบร้อย');

    const starIcon = isDone
      ? '<span class="text-slate-300"><i class="fa-regular fa-star"></i></span>'
      : '<span class="text-amber-400 drop-shadow-sm"><i class="fa-solid fa-star text-lg animate-bounce"></i></span>';

    const rowBg = isDone ? 'bg-white hover:bg-slate-50' : 'bg-rose-50/30 hover:bg-rose-50/60 font-medium';
    const img = r[5] && r[5] !== '-' ? `<a href="${r[5]}" target="_blank" class="text-blue-500 underline"><i class="fa-solid fa-image"></i> ดูรูป</a>` : '-';
    const topicText = `<span class="font-bold text-slate-800">${r[1]}</span>`;
    const detailBtn = `<button onclick="viewRepairDetails(${originalIndex})" class="text-left w-full max-w-[200px] sm:max-w-xs md:max-w-sm text-sm text-slate-600 hover:text-blue-700 hover:bg-blue-50 bg-slate-50 border border-slate-200 rounded-lg p-2.5 transition-all group" title="คลิกเพื่อดูรายละเอียด">
            <span class="line-clamp-2 leading-relaxed whitespace-normal">${r[2]}</span>
            <span class="text-[10px] text-blue-500 font-bold mt-1 opacity-0 group-hover:opacity-100 transition-opacity block"><i class="fa-solid fa-expand mr-1"></i> ดูรายละเอียด</span>
          </button>`;

    let urgencyTag = '';
    const newUrgency = (r[11] || '').trim();
    const detailStr = r[2] || '';
    
    if (newUrgency === 'ด่วน' || detailStr.includes('ความเร่งด่วน: ด่วน')) {
      urgencyTag = '<div class="mt-2"><span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-rose-100 text-rose-700 border border-rose-200 shadow-sm whitespace-nowrap"><i class="fa-solid fa-circle text-[6px] text-rose-500 animate-pulse"></i> ด่วน</span></div>';
    } else if (newUrgency === 'ตามคิว' || detailStr.includes('ความเร่งด่วน: ตามคิว')) {
      urgencyTag = '<div class="mt-2"><span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-blue-100 text-blue-700 border border-blue-200 shadow-sm whitespace-nowrap"><i class="fa-solid fa-circle text-[6px] text-blue-500"></i> ตามคิว</span></div>';
    } else if (newUrgency === 'ไม่รีบ' || detailStr.includes('ความเร่งด่วน: ไม่รีบ')) {
      urgencyTag = '<div class="mt-2"><span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200 shadow-sm whitespace-nowrap"><i class="fa-solid fa-circle text-[6px] text-emerald-500"></i> ไม่รีบ</span></div>';
    }

    return `<tr class="border-b ${rowBg} transition-colors">
            <td class="p-4 text-center">${starIcon}</td>
            <td class="p-4 text-slate-500">${r[0]}</td>
            <td class="p-4 align-top">
              <div class="flex flex-col items-start">
                ${statusTagClass(r[4])}
                ${urgencyTag}
              </div>
            </td>
            <td class="p-4">${topicText}</td>
            <td class="p-4">${detailBtn}</td>
            <td class="p-4 font-semibold text-slate-700">${r[3]}</td>
            <td class="p-4">${img}</td>
            <td class="p-4 text-center"><button onclick="updateTask(${originalIndex})" class="bg-blue-50 border border-blue-200 hover:bg-blue-600 hover:text-white text-blue-700 px-4 py-1.5 rounded-lg shadow-sm transition-colors">อัปเดต</button></td>
          </tr>`;
  }).join('');
};

window.filterRepairTab = function (tabId, btn) {
  window.currentRepairTab = tabId;
  if (btn) {
    const container = $('repairAdminTabs');
    if (container) {
      const btns = container.querySelectorAll('button');
      btns.forEach(b => {
        b.classList.remove('font-bold', 'text-blue-600', 'border-b-2', 'border-blue-600');
        b.classList.add('font-semibold', 'text-slate-500', 'hover:text-slate-700');
      });
      btn.classList.remove('font-semibold', 'text-slate-500', 'hover:text-slate-700');
      btn.classList.add('font-bold', 'text-blue-600', 'border-b-2', 'border-blue-600');
    }
  }
  window.renderRepairTable();
};

window.viewRepairDetails = function (index) {
  const row = window.allRepairTasks[index];
  if (!row) return;
  const topic = row[1] || '-';
  const detail = row[2] || '-';
  const fixDetail = row[6] || 'ยังไม่มีการบันทึกการแก้ปัญหา';
  const tech = row[7] || '-';
  const proofImg = (row[8] && row[8] !== '-') ? `<a href="${row[8]}" target="_blank" class="block mt-3 bg-emerald-50 text-emerald-700 text-center py-2 rounded-lg border border-emerald-200 hover:bg-emerald-100 font-semibold"><i class="fa-solid fa-image"></i> ดูรูปภาพผลการซ่อม</a>` : '';

  const cost = (row[9] && row[9] !== '-') ? row[9] : null;
  const receiptUrl = (row[10] && row[10] !== '-') ? row[10] : null;

  let costHtml = '';
  if (cost || receiptUrl) {
    costHtml = `<hr class="border-blue-100 my-3"><div class="flex flex-col gap-2">`;
    if (cost) costHtml += `<p class="text-sm text-slate-700 font-medium">ค่าใช้จ่าย: <span class="text-rose-500 font-bold">${cost} บาท</span></p>`;
    if (receiptUrl) costHtml += `<a href="${receiptUrl}" target="_blank" class="text-sm text-indigo-600 hover:text-indigo-800 underline font-medium"><i class="fa-solid fa-file-invoice mr-1"></i> ดูเอกสารใบเสร็จ/เบิกจ่าย</a>`;
    costHtml += `</div>`;
  }

  Swal.fire({
    title: 'รายละเอียดการแจ้งซ่อม',
    html: `<div class="text-left mt-4 text-slate-700 space-y-4">
                   <div class="bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <h3 class="font-bold text-slate-800 text-lg mb-1">${topic}</h3>
                      <p class="text-sm text-slate-600">${detail}</p>
                   </div>
                   <div class="bg-blue-50 p-4 rounded-xl border border-blue-200">
                      <div class="flex items-center gap-2 mb-2">
                         <i class="fa-solid fa-wrench text-blue-600"></i>
                         <h3 class="font-bold text-slate-800">รายละเอียดการแก้ปัญหา</h3>
                      </div>
                      <p class="text-sm text-slate-700 bg-white p-3 rounded-lg border border-blue-100">${fixDetail}</p>
                      <p class="text-sm text-slate-500 mt-3 font-medium"><i class="fa-solid fa-user-gear mr-1"></i> ช่างผู้ซ่อม: <span class="text-slate-800 font-bold">${tech}</span></p>
                      ${costHtml}
                      ${proofImg}
                   </div>
                 </div>`,
    confirmButtonText: 'ปิด',
    confirmButtonColor: '#3b82f6',
    width: '500px'
  });
};

window.viewAVDetails = function (index) {
  const row = window.allAVTasks[index];
  if (!row) return;
  const borrower = row[1] || '-';
  const equipment = row[2] || '-';
  const date = row[3] || '-';
  const location = row[4] || '-';
  const tech = row[6] || 'ยังไม่มีผู้รับผิดชอบ';

  Swal.fire({
    title: 'รายละเอียดการขอยืม',
    html: `<div class="text-left mt-4 text-slate-700 space-y-4">
                   <div class="bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <div class="flex items-center gap-2 mb-2">
                         <i class="fa-solid fa-microphone-lines text-blue-600"></i>
                         <h3 class="font-bold text-slate-800 text-lg">อุปกรณ์ที่ยืม</h3>
                      </div>
                      <p class="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">${equipment}</p>
                   </div>
                   <div class="bg-blue-50 p-4 rounded-xl border border-blue-200 space-y-2">
                      <p class="text-sm text-slate-700"><strong>ผู้ยืม:</strong> ${borrower}</p>
                      <p class="text-sm text-slate-700"><strong>วันที่ใช้งาน:</strong> ${date}</p>
                      <p class="text-sm text-slate-700"><strong>สถานที่:</strong> ${location}</p>
                      <hr class="border-blue-200 my-2">
                      <p class="text-sm text-slate-500 font-medium"><i class="fa-solid fa-user-gear mr-1"></i> ผู้จัดการงาน: <span class="text-slate-800 font-bold">${tech}</span></p>
                   </div>
                 </div>`,
    confirmButtonText: 'ปิด',
    confirmButtonColor: '#3b82f6',
    width: '500px'
  });
};

// === AV Admin UI Enhancements ===
window.renderAVTable = function () {
  const rawData = window.allAVTasks || [];
  const listWithIndex = rawData.map((r, idx) => ({ r, originalIndex: idx }));

  const getWeight = st => {
    const s = (st || '').trim();
    if (['เสร็จสิ้น', 'เสร็จสิ้น/คืนเรียบร้อย', 'เรียบร้อยแล้ว'].includes(s)) return 3;
    if (['กำลังดำเนินการ', 'กำลังใช้งาน', 'จัดเตรียมแล้ว', 'กำลังดำเนินงาน'].includes(s)) return 2;
    return 1;
  };

  const searchQuery = (window.currentAVSearch || '').toLowerCase().trim();

  const filteredList = listWithIndex.filter(({ r }) => {
    const w = getWeight(r[5]);
    if (window.currentAVTab === 'pending' && w !== 1) return false;
    if (window.currentAVTab === 'progress' && w !== 2) return false;
    if (window.currentAVTab === 'done' && w !== 3) return false;

    if (searchQuery) {
      const equipmentText = (r[2] || '').toLowerCase();
      if (!equipmentText.includes(searchQuery)) return false;
    }

    return true;
  });

  filteredList.sort((a, b) => {
    const wA = getWeight(a.r[5]);
    const wB = getWeight(b.r[5]);
    if (wA !== wB) return wA - wB;
    return a.originalIndex - b.originalIndex;
  });

  const tbody = $('avDataView');
  if (!tbody) return;
  if (!filteredList.length) {
    tbody.innerHTML = `<tr><td colspan="9" class="p-8 text-center text-slate-500">ไม่มีรายการในสถานะนี้</td></tr>`;
    return;
  }

  tbody.innerHTML = filteredList.map(({ r, originalIndex }) => {
    const st = r[5] || 'รอยืนยันการยืม';
    const tech = r[6] || '-';
    const isDone = (st === 'เสร็จสิ้น' || st === 'เสร็จสิ้น/คืนเรียบร้อย' || st === 'เรียบร้อยแล้ว');

    const starIcon = isDone
      ? '<span class="text-slate-300"><i class="fa-regular fa-star"></i></span>'
      : '<span class="text-amber-400 drop-shadow-sm"><i class="fa-solid fa-star text-lg animate-bounce"></i></span>';

    const rowBg = isDone ? 'bg-white hover:bg-slate-50' : 'bg-amber-50/30 hover:bg-amber-50/60 font-medium';

    const equipBtn = `<button onclick="viewAVDetails(${originalIndex})" class="text-left w-full max-w-[200px] sm:max-w-xs md:max-w-sm text-sm text-slate-600 hover:text-blue-700 hover:bg-blue-50 bg-slate-50 border border-slate-200 rounded-lg p-2.5 transition-all group" title="คลิกเพื่อดูรายละเอียด">
            <span class="line-clamp-2 leading-relaxed whitespace-normal">${r[2]}</span>
            <span class="text-[10px] text-blue-500 font-bold mt-1 opacity-0 group-hover:opacity-100 transition-opacity block"><i class="fa-solid fa-expand mr-1"></i> ดูรายละเอียด</span>
          </button>`;

    return `<tr class="border-b ${rowBg} transition-colors">
            <td class="px-4 py-4 text-center">${starIcon}</td>
            <td class="px-4 py-4 text-slate-500 whitespace-nowrap">${r[0]}</td>
            <td class="px-4 py-4">${statusTagClass(st)}</td>
            <td class="px-4 py-4 font-bold text-slate-800 whitespace-nowrap">${r[1]}</td>
            <td class="px-4 py-4">${equipBtn}</td>
            <td class="px-4 py-4 text-slate-600 whitespace-nowrap">${r[3]}</td>
            <td class="px-4 py-4 font-semibold text-slate-700 whitespace-nowrap">${r[4]}</td>
            <td class="px-4 py-4 font-medium text-slate-700">${tech}</td>
            <td class="px-4 py-4 text-center">
              <button onclick="openAVModal(${originalIndex},'${String(st).replace(/'/g, "\\'")}','${String(tech).replace(/'/g, "\\'")}')" class="bg-slate-100 hover:bg-amber-500 hover:text-white text-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-300 shadow-sm transition-colors">
                <i class="fa-solid fa-pen-to-square mr-1"></i> อัปเดต
              </button>
            </td>
          </tr>`;
  }).join('');
};

window.filterAVTab = function (tabId, btn) {
  window.currentAVTab = tabId;
  if (btn) {
    const container = $('avAdminTabs');
    if (container) {
      const btns = container.querySelectorAll('button');
      btns.forEach(b => {
        b.classList.remove('font-bold', 'text-blue-600', 'border-b-2', 'border-blue-600');
        b.classList.add('font-semibold', 'text-slate-500', 'hover:text-slate-700');
      });
      btn.classList.remove('font-semibold', 'text-slate-500', 'hover:text-slate-700');
      btn.classList.add('font-bold', 'text-blue-600', 'border-b-2', 'border-blue-600');
    }
  }
  window.renderAVTable();
};
// ============================================================
// USER MANAGEMENT (ADMIN)
// ============================================================
let allUsersList = [];

function fetchUsers() {
  $('user-manage-tbody').innerHTML = '<tr><td colspan="5" class="px-4 py-8 text-center text-slate-500"><i class="fa-solid fa-spinner fa-spin text-[#265D5A] text-2xl mb-2"></i><br>กำลังโหลดข้อมูล...</td></tr>';

  get('get_users').then(data => {
    allUsersList = data;
    renderUserTable();
  }).catch(e => {
    $('user-manage-tbody').innerHTML = '<tr><td colspan="5" class="px-4 py-8 text-center text-rose-500">เกิดข้อผิดพลาดในการโหลดข้อมูล</td></tr>';
    console.error(e);
  });
}

function renderUserTable() {
  const tbody = $('user-manage-tbody');
  tbody.innerHTML = '';
  if (!allUsersList || allUsersList.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="px-4 py-8 text-center text-slate-500">ไม่พบข้อมูลผู้ใช้</td></tr>';
    return;
  }

  allUsersList.forEach(user => {
    const email = sanitizeHtml(user[0]);
    const name = sanitizeHtml(user[1]);
    const role = sanitizeHtml(user[2]);
    const status = sanitizeHtml(user[3]);
    const picture = sanitizeHtml(user[4]);
    const lastLogin = sanitizeHtml(user[5]);

    let statusBadge = '';
    if (status === 'approved') statusBadge = '<span class="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-md">Approved</span>';
    else if (status === 'pending') statusBadge = '<span class="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-md">Pending</span>';
    else statusBadge = '<span class="px-2 py-1 bg-rose-100 text-rose-700 text-xs font-bold rounded-md">Banned</span>';

    const tr = document.createElement('tr');
    tr.className = 'hover:bg-slate-50 transition-colors';
    tr.innerHTML = `
      <td class="px-4 py-3">
        <div class="flex items-center gap-3">
          ${picture ? `<img src="${picture}" class="w-8 h-8 rounded-full shadow-sm" alt="profile">` : `<div class="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500"><i class="fa-solid fa-user"></i></div>`}
          <span class="font-medium">${name}</span>
        </div>
      </td>
      <td class="px-4 py-3">${email}</td>
      <td class="px-4 py-3">
        <select class="border border-slate-300 rounded-md text-sm p-1" onchange="updateUserRole('${email}', this.value, '${status}')">
          <option value="Teacher" ${role === 'Teacher' ? 'selected' : ''}>Teacher (ครู)</option>
          <option value="Tech" ${role === 'Tech' ? 'selected' : ''}>Tech (ช่าง)</option>
          <option value="AV" ${role === 'AV' ? 'selected' : ''}>AV (โสตฯ)</option>
          <option value="Admin" ${role === 'Admin' ? 'selected' : ''}>Admin (แอดมิน)</option>
          <option value="Executive" ${role === 'Executive' ? 'selected' : ''}>Executive (ผู้บริหาร)</option>
        </select>
      </td>
      <td class="px-4 py-3 text-xs">${new Date(lastLogin).toLocaleString('th-TH')}</td>
      <td class="px-4 py-3 text-center">
        <!-- Actions if needed -->
        <span class="text-slate-400 text-xs"><i class="fa-solid fa-check text-emerald-500 hidden" id="check-${email.replace(/[@.]/g, '')}"></i> บันทึกออโต้</span>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function updateUserRole(email, newRole, currentStatus) {
  saveUserChanges(email, newRole, currentStatus);
}

function updateUserStatus(email, currentRole, newStatus) {
  saveUserChanges(email, currentRole, newStatus);
}

function saveUserChanges(email, role, status) {
  post({ action: 'update_user', email: email, role: role, status: status })
    .then(() => {
      const icon = document.getElementById('check-' + email.replace(/[@.]/g, ''));
      if (icon) {
        icon.classList.remove('hidden');
        setTimeout(() => icon.classList.add('hidden'), 2000);
      }
    })
    .catch(e => {
      alertBox('error', 'บันทึกไม่สำเร็จ', 'ไม่สามารถอัปเดตข้อมูลผู้ใช้ได้');
    });
}
\ n f u n c t i o n   t o g g l e M o b i l e S i d e b a r ( )   {   c o n s t   s b   =   d o c u m e n t . g e t E l e m e n t B y I d ( ' a p p - s i d e b a r ' ) ;   c o n s t   b d   =   d o c u m e n t . g e t E l e m e n t B y I d ( ' m o b i l e - s i d e b a r - b a c k d r o p ' ) ;   i f ( s b . c l a s s L i s t . c o n t a i n s ( ' - t r a n s l a t e - x - f u l l ' ) ) {   s b . c l a s s L i s t . r e m o v e ( ' - t r a n s l a t e - x - f u l l ' ) ;   b d . c l a s s L i s t . r e m o v e ( ' h i d d e n ' ) ;   }   e l s e   {   s b . c l a s s L i s t . a d d ( ' - t r a n s l a t e - x - f u l l ' ) ;   b d . c l a s s L i s t . a d d ( ' h i d d e n ' ) ;   }   }  
 