console.log("%cFaCiLiTy System", "color: #4f46e5; font-size: 20px; font-weight: bold;");
console.log("%cDeveloped by Taohx_dz_parinya", "color: #10b981; font-size: 14px; font-weight: bold;");
console.log("%cUI Design By Dream_Patipat", "color: #f59e0b; font-size: 14px; font-weight: bold;");

(function _initSysVer() {
  window._SYS_VER = "RGV2ZWxvcGVkIGJ5IFRhb2h4X2R6X3BhcmlueWEsIFVJIERlc2lnbiBCeSBEcmVhbV9QYXRpcGF0LCBBSSBBc3Npc3RhbnQ6IEFudGlncmF2aXR5";
})();

/**
 * ==============================================================================
 * 📌 คำอธิบายโครงสร้างไฟล์ main.js (FaCiLiTy System)
 * ==============================================================================
 * ไฟล์นี้เป็นส่วนของ Logic ทั้งหมดที่ใช้ขับเคลื่อนเว็บไซต์ (Frontend) โดยแบ่งเป็น 18 ส่วนหลักๆ ดังนี้:
 *
 * 1. Global Config
 *    - ทำหน้าที่: เก็บตัวแปรสำคัญเช่น scriptURL สำหรับติดต่อกับฐานข้อมูล Google Apps Script
 *    - ตำแหน่งในเว็บ: ใช้ทุกหน้าเพื่อเชื่อมต่อฐานข้อมูล
 * 2. Security & Session
 *    - ทำหน้าที่: จัดการตัวแปรที่เก็บสถานะการล็อกอิน เช่น ชื่อครู สิทธิ์แอดมิน และอีเมล
 *    - ตำแหน่งในเว็บ: ระบบตรวจสอบสิทธิ์เมื่อเปลี่ยนหน้า (Nav) และใช้เช็คสิทธิ์ซ่อน/แสดงเมนูแอดมิน
 * 3. Helpers
 *    - ทำหน้าที่: ฟังก์ชันช่วยเหลือทั่วไป เช่น setBusy (แสดงปุ่มโหลด), alertBox (แสดงแจ้งเตือน SweetAlert2)
 *    - ตำแหน่งในเว็บ: ใช้ทุกหน้าเวลาบันทึกฟอร์มหรือเกิด Error
 * 4. UI Formatting Tools
 *    - ทำหน้าที่: ฟังก์ชันแปลงสถานะเป็นป้ายสี (Badge) เช่น "รอรับเรื่อง" (สีเหลือง), "เสร็จสิ้น" (สีเขียว)
 *    - ตำแหน่งในเว็บ: หน้าตารางแอดมิน (Dashboard, จัดการงานซ่อม) และหน้าประวัติของผู้แจ้ง (Timeline)
 * 5. Core Framework
 *    - ทำหน้าที่: ฟังก์ชัน renderTableData สำหรับลูปสร้าง <tr> ในตารางต่างๆ ลดการเขียนโค้ดซ้ำ
 *    - ตำแหน่งในเว็บ: ใช้สร้างตารางข้อมูลในหน้าแอดมินทุกหน้า
 * 6. ResourceHubCore (API)
 *    - ทำหน้าที่: ศูนย์กลางในการดึงข้อมูล (Fetch) ระหว่าง Frontend กับ Google Apps Script (Backend)
 *    - ตำแหน่งในเว็บ: ใช้โหลดข้อมูลต่างๆ เมื่อเข้าสู่แต่ละหน้า
 * 7. UI Controllers (ResourceHubCore.ui)
 *    - ทำหน้าที่: โลจิกสำหรับการส่งฟอร์ม (แจ้งซ่อม/ยืมโสตฯ) และแสดงผลหน้าจอ
 *    - ตำแหน่งในเว็บ: หน้าแจ้งซ่อม (page-repair-form), หน้าประวัติ (page-teacher-profile)
 * 8. Authentication (LINE LIFF & Google OAuth)
 *    - ทำหน้าที่: โลจิกล็อกอินด้วย LINE และ Google 
 *    - ตำแหน่งในเว็บ: หน้าล็อกอิน (page-auth) และ Modal เข้าสู่ระบบ
 * 9. Navigation & Routing (ระบบเปลี่ยนหน้า)
 *    - ทำหน้าที่: ฟังก์ชัน nav() ใช้เปลี่ยนหน้าเว็บโดยซ่อน/แสดง Div ตาม ID แทนการโหลดหน้าใหม่
 *    - ตำแหน่งในเว็บ: เมนูแถบด้านข้าง (Sidebar) และเมนูด่วนหน้าแรก
 * 10. Master Data & Cache
 *     - ทำหน้าที่: โหลดข้อมูลพื้นฐาน เช่น สถานที่ซ่อม, ชื่อช่าง, หมวดหมู่อุปกรณ์ แล้วเก็บใน Cache
 *     - ตำแหน่งในเว็บ: หน้าจัดการข้อมูลหลัก (page-master-data)
 * 11-12. Wrappers & Generic Form
 *     - ทำหน้าที่: ตัวกลางครอบฟังก์ชันส่งฟอร์มอื่นๆ และระบบส่งฟอร์มแบบ Generic
 * 13-14. Advanced Tasks & Dashboard Pro
 *     - ทำหน้าที่: จัดการงานซ่อมโครงการ/งานไอทีแบบละเอียด และโหลดกราฟสรุปผล (Chart.js)
 *     - ตำแหน่งในเว็บ: หน้าแดชบอร์ด (page-dashboard)
 * 15-18. Admin UI & User Management
 *     - ทำหน้าที่: ฟังก์ชันสำหรับแอดมินใช้จัดการตารางข้อมูลผู้ใช้งาน การซ่อมบำรุง และเอกสาร
 *     - ตำแหน่งในเว็บ: เมนูสำหรับแอดมิน เช่น หน้าตารางซ่อมอาคาร, จัดการผู้ใช้
 * 19. Satisfaction Survey & QR Code
 *     - ทำหน้าที่: แบบประเมินดาว 1-5 ดาว และระบบสแกน/สร้าง QR Code ด่วน
 *     - ตำแหน่งในเว็บ: Modal ประเมินความพึงพอใจ, และปุ่มสแกน QR บนหน้าแรก
 * ==============================================================================
 */

// ==========================================
// 1. ตั้งค่าพื้นฐานระบบ (Global Config)
// ==========================================
// 🔴 เปลี่ยน URL ตรงนี้เป็น URL ของการ Deploy ล่าสุดจาก Google Apps Script
const scriptURL = 'https://script.google.com/macros/s/AKfycbz8v26S7km-uQ5wR2neO9oYs0_UvTJPXGdLhyYHt4pNM6AVZxouW4qiS1REDhlgjU8QPg/exec';


// 🔴 โฟลเดอร์ที่เก็บรูป 
const REPAIR_DRIVE_FOLDER_ID = '1tkOHFwH4MC-eA_eNLThTcLVF3CRHQUXT';

// ==========================================
// 2. ระบบรักษาความปลอดภัยและการเข้าสู่ระบบ (Security & Session)
// ==========================================
// 🔒 SESSION CONFIG: ตั้งค่าเวลาและการล็อกบัญชีหากเข้าสู่ระบบผิดพลาด
const SESSION_EXPIRY_MS = 8 * 60 * 60 * 1000; // ออกจากระบบหลังจาก 8 ชั่วโมง
const MAX_LOGIN_ATTEMPTS = 5;                  // ล็อกหลังผิด 5 ครั้ง
const LOCKOUT_MS = 15 * 60 * 1000;             // ล็อก 15 นาที

// 🔒 ตรวจสอบ Session Expiry: ฟังก์ชันทำงานอัตโนมัติเพื่อล้างข้อมูล Session หากผู้ใช้ออนไลน์นานเกินกำหนด
(function checkSessionExpiry() {
  const loginTime = localStorage.getItem('session_login_time');
  if (loginTime && (Date.now() - parseInt(loginTime)) > SESSION_EXPIRY_MS) {
    localStorage.clear();
    console.warn('🔒 Session หมดอายุ — ล้างข้อมูลเรียบร้อย');
  }
})();

// 🔒 XSS Sanitizer: กรองโค้ดอันตราย (HTML/JS) ออกจากข้อมูลก่อนนำไปแสดงผลบนหน้าเว็บ เพื่อป้องกันการถูกแฮก
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

// 🔒 Login Attempt Tracker: ระบบจัดการการเข้าสู่ระบบผิดพลาด (ติดตามจำนวนครั้งที่กรอกรหัสผิด)
const loginAttempts = {
  get(key) {
    try { return JSON.parse(localStorage.getItem('login_attempts_' + key) || '{"count":0,"lockUntil":0}'); }
    catch { return { count: 0, lockUntil: 0 }; }
  },
  set(key, data) { localStorage.setItem('login_attempts_' + key, JSON.stringify(data)); },
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
  reset(key) { localStorage.removeItem('login_attempts_' + key); }
};

// 🔒 แสดงหน้าต่างนับเวลาถอยหลัง (Countdown) ตอนบัญชีถูกล็อก
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


// ==========================================
// 3. ตัวแปรสถานะและฟังก์ชันช่วยเหลือ (Helpers)
// ==========================================
// ตัวแปรเก็บข้อมูลผู้ใช้งานที่เข้าสู่ระบบปัจจุบัน
let currentTeacher = localStorage.getItem('logged_teacher') || null;
let currentRole = localStorage.getItem('logged_role') || null;
let currentEmail = localStorage.getItem('logged_email') || '';
let isAdminLoggedIn = localStorage.getItem('logged_admin') === 'true' || false;
let isRegisterMode = false;

// ฟังก์ชันย่อเพื่อเรียก DOM Elements แทนการใช้ document.getElementById หรือ querySelectorAll
const $ = id => document.getElementById(id);
const $$ = s => document.querySelectorAll(s);

// ฟังก์ชันสำหรับเรียกแจ้งเตือน (Alert) โดยใช้ไลบรารี SweetAlert2
const alertBox = (icon, title, text = '', opts = {}) => Swal.fire({ icon, title, text, ...opts });

// ฟังก์ชันสำหรับจัดการปุ่ม (ตั้งค่าตอนระบบกำลังประมวลผลให้ปุ่มคลิกไม่ได้ และเปลี่ยนไอคอนโหลด)
const setBusy = (btn, busy, label) => {
  btn.disabled = busy;
  btn.innerHTML = busy ? '<i class="fa-solid fa-spinner fa-spin"></i> กำลังดำเนินการ...' : label;
};

// ==========================================
// 4. เครื่องมือการแสดงผล UI (UI Formatting Tools)
// ==========================================
// ฟังก์ชันช่วยจัดรูปแบบแท็กสถานะ (Status Badge) พร้อมใส่สีและไอคอนตามสถานะงาน (เช่น สีเขียว=เสร็จ, สีเหลือง=กำลังทำ, สีแดง=รอดำเนินการ)
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

// ==========================================
// 5. ตัวจัดการโครงสร้างแอปพลิเคชัน (Core Framework)
// ==========================================
// ฟังก์ชันช่วยสร้างตารางอัตโนมัติ โดยรับข้อมูลและเรนเดอร์ลงใน <tbody> ของตาราง
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

// ฟังก์ชันรวมศูนย์สำหรับ Submit ฟอร์ม: มีหน้าจอโหลด, จัดการข้อความแจ้งเตือนสำเร็จ, และดัก Error ส่งมาจากหลังบ้าน
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

// ฟังก์ชันอ่านไฟล์รูปภาพหรือเอกสารให้อยู่ในรูปแบบ Base64 ก่อนส่งไปให้ฝั่งหลังบ้าน
const readFile = file => new Promise((resolve, reject) => {
  if (!file) return resolve(null);
  const r = new FileReader();
  r.onload = e => resolve({ name: file.name, type: file.type, data: e.target.result.split(',')[1] });
  r.onerror = reject;
  r.readAsDataURL(file);
});

// ==========================================
// 6. ศูนย์กลางควบคุม API (ResourceHubCore)
// ==========================================
// ออบเจ็กต์สำหรับรวมการเรียก API ระหว่างหน้าบ้านกับหลังบ้าน (Google Apps Script) เข้าด้วยกัน
const ResourceHubCore = {
  _cache: new Map(), // เก็บ Cache ของข้อมูล
  _cacheTTL: 60 * 1000, // อายุ Cache 60 วินาที

  api: {
    // โหลดข้อมูลด้วยวิธี GET (อ่านข้อมูล) พร้อมระบบ Cache
    async get(action, params = {}) {
      const cacheKey = action + JSON.stringify(params);
      const cached = ResourceHubCore._cache.get(cacheKey);
      
      if (cached && (Date.now() - cached.timestamp < ResourceHubCore._cacheTTL)) {
        return cached.data; // คืนค่าจาก Cache ถ้ายังไม่หมดอายุ
      }

      // เพิ่ม t: Date.now() เพื่อแก้ปัญหา Cache ของเบราว์เซอร์ระดับล่าง
      const q = new URLSearchParams({ action, t: Date.now(), ...params });
      const r = await fetch(`${scriptURL}?${q}`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json();
      
      // บันทึกลง Cache
      ResourceHubCore._cache.set(cacheKey, { data, timestamp: Date.now() });
      return data;
    },
    // ส่งข้อมูลด้วยวิธี POST (บันทึกข้อมูล)
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
        
        // ล้าง Cache ทั้งหมดเมื่อมีการ POST (ข้อมูลเปลี่ยน)
        ResourceHubCore._cache.clear();
        
        return json;
      } catch (e) {

        throw e;
      }
    }
  },
  // หมวดข้อมูลแจ้งซ่อมอาคารสถานที่
  work: {
    repairs: () => ResourceHubCore.api.get('get_tasks'),
  },
  // หมวดจัดการระบบยืม-คืนอุปกรณ์โสตฯ (ดึงรายการ, ยื่นเรื่อง, อัปเดตสถานะ)
  av: {
    list: () => ResourceHubCore.api.get('get_av_requests'),
    submit: payload => ResourceHubCore.api.post({ action: 'submit_av', ...payload }),
    updateStatus: payload => ResourceHubCore.api.post({ action: 'update_av_status', ...payload })
  },
  // หมวดดึงข้อมูลสรุปสถิติสำหรับนำไปทำ Dashboard
  dashboard: {
    legacy: (params = {}) => ResourceHubCore.api.get('get_dashboard', params),
    pro: (params = {}) => ResourceHubCore.api.get('get_unified_dashboard', params),
  },
  // หมวดจัดการข้อมูลหลัก (Master Data) เช่น รายชื่อครู, แผนก, สถานที่, อาการเสีย
  master: {
    list: () => ResourceHubCore.api.get('get_master_data'),
    add: payload => ResourceHubCore.api.post({ action: 'master_add', ...payload }),
    remove: payload => ResourceHubCore.api.post({ action: 'master_delete', ...payload })
  },
  // หมวดจัดการเอกสารและแบบฟอร์มให้ดาวน์โหลด
  docs: {
    list: () => ResourceHubCore.api.get('get_documents'),
    add: payload => ResourceHubCore.api.post({ action: 'add_document', ...payload }),
    remove: payload => ResourceHubCore.api.post({ action: 'delete_document', ...payload })
  },
  // ==========================================
  // 7. ส่วนควบคุมการทำงานหน้าจอและปุ่มกด (UI Controllers)
  // ==========================================
  ui: {
    // ดึงประวัติการแจ้งซ่อม/ยืมโสตฯ เฉพาะของครูคนที่ล็อกอินอยู่ ไปแสดงในหน้าโปรไฟล์
    async loadTeacherHistory(type) {
      if (!currentTeacher) return;
      const isRepair = type === 'repair';
      const nameEl = $(isRepair ? 'profile-teacher-name' : 'profile-teacher-av-name');
      if (nameEl) nameEl.textContent = isRepair ? `ยินดีต้อนรับ, ${sanitizeHtml(currentTeacher)}` : `ประวัติการขอยืมอุปกรณ์โสตฯ ของคุณ ${sanitizeHtml(currentTeacher)}`;

      const dataP = isRepair
        ? ResourceHubCore.work.repairs().then(d => (d || []).filter(r => r[3]?.toString().trim() === currentTeacher.trim()))
        : ResourceHubCore.av.list().then(d => (d || []).filter(r => r[1]?.toString().trim() === currentTeacher.trim() || r[7]?.toString().trim() === currentTeacher.trim()));

      const containerId = isRepair ? 'teacherTaskBody' : 'teacherAVTaskBody';
      const emptyMsg = isRepair ? 'คุณยังไม่มีประวัติการแจ้งซ่อมอาคารในระบบครับ' : 'คุณยังไม่มีประวัติการขอยืมอุปกรณ์โสตฯ ในระบบครับ';

      const container = $(containerId);
      if (!container) return;

      container.innerHTML = `<div class="col-span-full p-8 text-center text-slate-500"><i class="fa-solid fa-spinner fa-spin mr-2"></i>กำลังโหลดข้อมูล...</div>`;

      try {
        const data = await dataP;
        if (!data || !data.length) {
          container.innerHTML = `<div class="col-span-full p-8 text-center text-slate-500 bg-slate-50 rounded-2xl border border-slate-200">${emptyMsg}</div>`;
          return;
        }

        const renderTimeline = (status) => {
          const steps = isRepair ? [
            { label: 'ส่งเรื่อง', s: ['รอรับเรื่อง', 'กำลังดำเนินการ', 'เสร็จสิ้น'] },
            { label: 'รับเรื่องแล้ว', s: ['กำลังดำเนินการ', 'เสร็จสิ้น'] },
            { label: 'กำลังดำเนินการ', s: ['กำลังดำเนินการ', 'เสร็จสิ้น'] },
            { label: 'เสร็จสิ้น', s: ['เสร็จสิ้น'] }
          ] : [
            { label: 'ส่งเรื่อง', s: ['รอยืนยันการยืม', 'อนุมัติการยืม', 'กำลังใช้งาน', 'คืนอุปกรณ์แล้ว'] },
            { label: 'อนุมัติแล้ว', s: ['อนุมัติการยืม', 'กำลังใช้งาน', 'คืนอุปกรณ์แล้ว'] },
            { label: 'กำลังใช้งาน', s: ['กำลังใช้งาน', 'คืนอุปกรณ์แล้ว'] },
            { label: 'คืนแล้ว', s: ['คืนอุปกรณ์แล้ว'] }
          ];

          let html = `<div class="flex items-center justify-between mt-6 mb-2 relative">`;
          html += `<div class="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-100 rounded-full z-0"></div>`;
          
          let lastActiveIdx = -1;
          steps.forEach((step, idx) => {
            let isActive = false;
            if (idx === 0) isActive = true;
            if (step.s.includes(status)) isActive = true;
            if (isActive) lastActiveIdx = idx;
          });

          steps.forEach((step, idx) => {
            const isActive = idx <= lastActiveIdx;
            const bgClass = isActive ? (isRepair ? 'bg-[#265D5A] text-white' : 'bg-[#FF5F5F] text-white') : 'bg-white text-slate-300 border-2 border-slate-200';
            const textClass = isActive ? (isRepair ? 'text-[#265D5A] font-bold' : 'text-[#FF5F5F] font-bold') : 'text-slate-400';
            
            if (idx > 0 && isActive) {
              const lineColor = isRepair ? 'bg-[#265D5A]' : 'bg-[#FF5F5F]';
              html += `<div class="absolute left-0 top-1/2 -translate-y-1/2 h-1 ${lineColor} rounded-full z-0" style="width: ${(idx / (steps.length - 1)) * 100}%"></div>`;
            }

            html += `
              <div class="relative z-10 flex flex-col items-center gap-1">
                <div class="w-6 h-6 rounded-full flex items-center justify-center text-xs ${bgClass}">
                  ${isActive ? '<i class="fa-solid fa-check text-[10px]"></i>' : ''}
                </div>
                <span class="text-[10px] ${textClass} whitespace-nowrap text-center max-w-[60px] leading-tight absolute top-8">${step.label}</span>
              </div>
            `;
          });
          html += `</div><div class="h-8"></div>`;
          return html;
        };

        const html = data.map(r => {
          if (isRepair) {
            const img = r[5] && r[5] !== '-' ? `<button onclick="showImageModal('${r[5]}')" class="mt-3 text-[#265D5A] bg-[#B0EDE6]/30 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-[#B0EDE6] transition-colors"><i class="fa-solid fa-image"></i> ดูรูปปัญหา</button>` : '';
            const tech = r[6] ? `<div class="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2"><div class="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400"><i class="fa-solid fa-user-gear"></i></div><div><div class="text-xs font-bold text-slate-700">${sanitizeHtml(r[6])}</div><div class="text-[10px] text-slate-500 line-clamp-1">${sanitizeHtml(r[7] || '')}</div></div></div>` : '<div class="mt-3 pt-3 border-t border-slate-100"><span class="text-xs text-slate-400"><i class="fa-regular fa-clock"></i> รอเจ้าหน้าที่รับเรื่อง</span></div>';
            
            return `
              <div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
                <div>
                  <div class="flex justify-between items-start mb-2">
                    <span class="text-xs text-slate-400 font-medium">${sanitizeHtml(r[0])}</span>
                    ${statusTagClass(r[4])}
                  </div>
                  <h3 class="font-bold text-slate-800 text-base mb-1">${sanitizeHtml(r[1])}</h3>
                  <p class="text-sm text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">${sanitizeHtml(r[2])}</p>
                  ${img}
                </div>
                <div>
                  ${renderTimeline(r[4])}
                  ${tech}
                </div>
              </div>
            `;
          } else {
            const st = r[5] || 'รอยืนยันการยืม';
            const tech = r[6] ? `<div class="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2"><div class="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400"><i class="fa-solid fa-user-check"></i></div><div><div class="text-xs font-bold text-slate-700">${sanitizeHtml(r[6])}</div></div></div>` : '<div class="mt-3 pt-3 border-t border-slate-100"><span class="text-xs text-slate-400"><i class="fa-regular fa-clock"></i> รอเจ้าหน้าที่รับเรื่อง</span></div>';
            
            return `
              <div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
                <div>
                  <div class="flex justify-between items-start mb-2">
                    <span class="text-xs text-slate-400 font-medium">${sanitizeHtml(r[0])}</span>
                    ${statusTagClass(st)}
                  </div>
                  <h3 class="font-bold text-slate-800 text-base mb-1">${sanitizeHtml(r[2])}</h3>
                  <div class="flex flex-col gap-1 mt-2 mb-3">
                    <span class="text-xs text-slate-500"><i class="fa-regular fa-calendar text-[#FF5F5F]/70 w-4"></i> ${sanitizeHtml(r[3])}</span>
                    <span class="text-xs text-slate-500"><i class="fa-solid fa-location-dot text-[#FF5F5F]/70 w-4"></i> ${sanitizeHtml(r[4])}</span>
                  </div>
                </div>
                <div>
                  ${renderTimeline(st)}
                  ${tech}
                </div>
              </div>
            `;
          }
        }).join('');
        container.innerHTML = html;
      } catch (e) {
        container.innerHTML = `<div class="col-span-full p-8 text-center text-rose-500">เกิดข้อผิดพลาดในการโหลดข้อมูล: ${e.message}</div>`;
      }
    },
    // ฟังก์ชันเก่า (ยังเหลือไว้): ระบบส่งแจ้งซ่อมอาคารสถานที่
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
    // ฟังก์ชันเก่า (ยังเหลือไว้): ระบบขอยืมอุปกรณ์โสตฯ
    async submitAV() {
      const borrower = $('borrower').value.trim();
      const useDate = $('useDate').value;
      const loc = $('av_location').value.trim();
      const signer = $('signerName').value.trim();

      let equipmentList = [];
      const checkboxes = document.querySelectorAll('input[name="equipment"]:checked');
      checkboxes.forEach(cb => {
        const qty = cb.parentElement.querySelector('input[type=number]').value;
        equipmentList.push(`${cb.value} (${qty})`);
      });

      const otherEq = $('other_equip').value.trim();
      if (otherEq) {
        const otherQty = $('qty_other').value;
        equipmentList.push(`${otherEq} (${otherQty})`);
      }

      const equipmentStr = equipmentList.join(', ');

      if (!borrower || !useDate || !loc || !signer || !equipmentStr) {
        return alertBox('warning', 'ข้อมูลไม่ครบ', 'กรุณากรอกข้อมูลและเลือกอุปกรณ์ให้ครบถ้วน');
      }

      const btn = $('btnSubmitAV');
      setBusy(btn, true);
      try {
        await ResourceHubCore.api.post({
          action: 'submit_av',
          borrower: borrower,
          equipment: equipmentStr,
          useDate: useDate,
          location: loc,
          signature: signer
        });
        setBusy(btn, false, '<i class="fa-solid fa-paper-plane"></i> <span>ยืนยันการขอยืมอุปกรณ์</span>');
        await alertBox('success', 'สำเร็จ', 'ส่งเรื่องขอยืมอุปกรณ์เรียบร้อยแล้ว', { timer: 2000, showConfirmButton: false });
        $('avForm').reset();
        nav('page-teacher-profile');
      } catch (e) {
        setBusy(btn, false, '<i class="fa-solid fa-paper-plane"></i> <span>ยืนยันการขอยืมอุปกรณ์</span>');
        alertBox('error', 'ข้อผิดพลาด', e.message || 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
      }
    },
    // โหลดตารางงานทั้งหมดมาให้แอดมินดู (แจ้งซ่อม/ยืมโสตฯ)
    async loadAdminTable(type) {
      const isRepair = type === 'repair';
      const tbodyId = isRepair ? 'taskBody' : 'avDataView';
      const colSpan = isRepair ? 8 : 9;
      // แสดง Skeleton ก่อนโหลด
      const el = $(tbodyId);
      if (el) el.innerHTML = typeof getSkeletonCards === 'function' ? getSkeletonCards(5) : '<div class="p-8 text-center text-slate-400"><i class="fa-solid fa-circle-notch fa-spin text-2xl"></i></div>';
      try {
        const rawData = isRepair ? await ResourceHubCore.work.repairs() : await ResourceHubCore.av.list();
        if (!rawData || !rawData.length) {
          $(tbodyId).innerHTML = `<div class="p-8 text-center text-slate-500">${isRepair ? 'ไม่มีรายการแจ้งซ่อม' : 'ยังไม่มีรายการแจ้งยืมครับ'}</div>`;
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
        $(tbodyId).innerHTML = `<div class="p-8 text-center text-rose-500"><i class="fa-solid fa-triangle-exclamation mr-2"></i>ไม่สามารถโหลดข้อมูลได้ในขณะนี้</div>`;
      }
    },
    // แอดมินกดเปลี่ยนสถานะงานซ่อม หรือ ปิดงาน (อัปโหลดรูปหลักฐาน)
    async updateRepair(index) {
      const row = window.allRepairTasks ? window.allRepairTasks[index] : null;
      let detailsHtml = '';
      if (row) {
        const tStamp = row[0] || '-';
        const subj = row[1] || '-';
        const det = row[2] || '-';
        const rep = row[3] || '-';
        detailsHtml = '<div class="text-left mb-5 p-4 bg-slate-50 rounded-xl border border-slate-200 shadow-sm">'
          + '<div class="font-bold text-slate-800 mb-1 text-base">' + subj + '</div>'
          + '<div class="text-sm text-slate-600 mb-3" style="white-space:pre-wrap">' + det + '</div>'
          + '<div class="text-xs font-semibold text-slate-500 border-t border-slate-200 pt-2 mt-2">'
          + '<i class="fa-solid fa-user text-slate-400"></i> ' + rep
          + ' &nbsp;|&nbsp; <i class="fa-regular fa-clock text-slate-400"></i> ' + tStamp
          + '</div></div>';
      }
      const r = await Swal.fire({ title: 'อัปเดตสถานะงาน', html: detailsHtml, showDenyButton: true, showCancelButton: true, confirmButtonText: 'กำลังดำเนินการ', denyButtonText: 'เสร็จสิ้น (แนบรูป)', confirmButtonColor: '#3b82f6', denyButtonColor: '#10b981' });
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
      const taskData = window.allAVTasks ? window.allAVTasks[index] : null;
      let detailsHtml = '';
      if (taskData) {
        const timestamp = taskData[0] || '-';
        const borrower = taskData[1] || '-';
        const equipment = taskData[2] || '-';
        const useDate = taskData[3] || '-';
        const loc = taskData[4] || '-';
        detailsHtml = `<div class="text-left mb-5 p-4 bg-slate-50 rounded-xl border border-slate-200 shadow-sm"><div class="font-bold text-slate-800 mb-1 text-base"><i class="fa-solid fa-headphones text-amber-500"></i> ${borrower}</div><div class="text-sm text-slate-600 mb-2 whitespace-pre-wrap"><span class="font-semibold text-slate-700">อุปกรณ์:</span> ${equipment}</div><div class="text-xs text-slate-500 mb-1"><span class="font-semibold text-slate-600">วันที่ใช้:</span> ${useDate}</div><div class="text-xs text-slate-500 mb-3"><span class="font-semibold text-slate-600">สถานที่:</span> ${loc}</div><div class="text-xs font-semibold text-slate-500 flex items-center gap-1 border-t border-slate-200 pt-2"><i class="fa-regular fa-clock text-slate-400"></i> แจ้งเมื่อ: ${timestamp}</div></div>`;
      }
      const { value: v } = await Swal.fire({
        title: '🎛️ อัปเดตสถานะงานโสตฯ',
        html: detailsHtml + `<div class="text-left space-y-4 mt-2 text-slate-900"><select id="swal-av-status" class="w-full p-2.5 border rounded-xl bg-slate-50 font-semibold"><option value="รอยืนยันการยืม">⏳ รอยืนยันการยืม / รอตรวจสอบ</option><option value="จัดเตรียมแล้ว">🛠️ จัดเตรียมอุปกรณ์ให้แล้ว</option><option value="กำลังใช้งาน">🔊 กำลังใช้งาน / อยู่ระหว่างกิจกรรม</option><option value="เสร็จสิ้น/คืนเรียบร้อย">✅ เสร็จสิ้น / ตรวจรับของคืนเรียบร้อย</option></select><input id="swal-av-tech" class="w-full p-2.5 border rounded-xl bg-slate-50" placeholder="ระบุชื่อเจ้าหน้าที่โสตฯ" value="${oldTech !== '-' ? oldTech : ''}"></div>`,

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
    // ดึงและแสดงข้อมูลสรุปสำหรับหน้า Dashboard (คำนวณตัวเลข, เปลี่ยนกราฟ, แถบความคืบหน้า)
    async loadDashboard() {
      try {
        const loadingHtml = '<i class="fa-solid fa-circle-notch fa-spin text-slate-300/50"></i>';
        const idsToLoad = [
          'dash-total-all', 'dash-pending-all', 'dash-progress-all', 'dash-completed-all',
          'b-total', 'b-pending', 'b-progress', 'b-completed',
          'av-total', 'av-pending', 'av-active', 'av-completed',
          'it-total', 'it-pending', 'it-progress', 'it-completed',
          'avrep-total', 'avrep-pending', 'avrep-progress', 'avrep-completed',
          'proj-total', 'proj-pending', 'proj-progress', 'proj-completed',
          'ratio-building-count', 'ratio-av-count', 'ratio-it-count', 'ratio-av-repair-count', 'ratio-project-count',
          'ratio-building-pct', 'ratio-av-pct', 'ratio-it-pct', 'ratio-av-repair-pct', 'ratio-project-pct',
          'overall-progress-text',
          'b-rating', 'b-rating-count', 'av-rating', 'av-rating-count',
          'it-rating', 'it-rating-count', 'avrep-rating', 'avrep-rating-count',
          'proj-rating', 'proj-rating-count'
        ];
        idsToLoad.forEach(id => {
          if ($(id)) $(id).innerHTML = loadingHtml;
        });

        const monthFilter = $('dashboardMonthFilter') ? $('dashboardMonthFilter').value : '';
        const d = await ResourceHubCore.dashboard.legacy({ month: monthFilter });
        const bTotal = Number(d?.building?.total) || 0;
        const bPending = Number(d?.building?.pending) || 0;
        const bProgress = Number(d?.building?.inProgress) || 0;
        const bCompleted = Number(d?.building?.completed) || 0;

        const avTotal = Number(d?.av?.total) || 0;
        const avPending = Number(d?.av?.pending) || 0;
        const avActive = Number(d?.av?.active) || 0;
        const avCompleted = Number(d?.av?.completed) || 0;

        const itTotal = Number(d?.it?.total) || 0;
        const itPending = Number(d?.it?.pending) || 0;
        const itProgress = Number(d?.it?.inProgress) || 0;
        const itCompleted = Number(d?.it?.completed) || 0;

        const avRepTotal = Number(d?.avRep?.total) || 0;
        const avRepPending = Number(d?.avRep?.pending) || 0;
        const avRepProgress = Number(d?.avRep?.inProgress) || 0;
        const avRepCompleted = Number(d?.avRep?.completed) || 0;

        const projTotal = Number(d?.proj?.total) || 0;
        const projPending = Number(d?.proj?.pending) || 0;
        const projProgress = Number(d?.proj?.inProgress) || 0;
        const projCompleted = Number(d?.proj?.completed) || 0;

        const totalAll = bTotal + avTotal + itTotal + avRepTotal + projTotal;
        const pendingAll = bPending + avPending + itPending + avRepPending + projPending;
        const progressAll = bProgress + avActive + itProgress + avRepProgress + projProgress;
        const completedAll = bCompleted + avCompleted + itCompleted + avRepCompleted + projCompleted;

        // ยอดรวมระบบทั้งหมด
        if ($('dash-total-all')) $('dash-total-all').textContent = totalAll;
        if ($('dash-pending-all')) $('dash-pending-all').textContent = pendingAll;
        if ($('dash-progress-all')) $('dash-progress-all').textContent = progressAll;
        if ($('dash-completed-all')) $('dash-completed-all').textContent = completedAll;

        // อัปเดตแจ้งเตือนที่กระดิ่ง Header (สรุปงานรอดำเนินการ)
        const globalBadge = $('global-overdue-badge');
        if (globalBadge) {
          if (pendingAll > 0) {
            globalBadge.textContent = pendingAll > 99 ? '99+' : pendingAll;
            globalBadge.classList.remove('hidden');
          } else {
            globalBadge.classList.add('hidden');
          }
        }

        const dropdownCount = $('dropdown-overdue-count');
        if (dropdownCount) dropdownCount.textContent = pendingAll;

        const notifList = $('notification-list');
        if (notifList) {
          if (pendingAll > 0) {
            let html = '';
            if (bPending > 0) {
              html += `<div class="p-3 bg-white rounded-xl shadow-sm border border-rose-100 flex items-center justify-between mb-2">
                           <div class="flex items-center gap-3">
                             <div class="w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center text-rose-500">
                               <i class="fa-solid fa-wrench"></i>
                             </div>
                             <div>
                               <p class="text-xs font-bold text-slate-700">แจ้งซ่อมอาคาร</p>
                               <p class="text-[10px] text-slate-500">รอดำเนินการ ${bPending} รายการ</p>
                             </div>
                           </div>
                           <button onclick="toggleNotificationDropdown(); nav('page-technician');" class="text-xs font-bold text-[#265D5A] hover:underline">จัดการ</button>
                         </div>`;
            }
            if (avPending > 0) {
              html += `<div class="p-3 bg-white rounded-xl shadow-sm border border-amber-100 flex items-center justify-between">
                           <div class="flex items-center gap-3">
                             <div class="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center text-amber-500">
                               <i class="fa-solid fa-microphone-lines"></i>
                             </div>
                             <div>
                               <p class="text-xs font-bold text-slate-700">ยืมอุปกรณ์โสตฯ</p>
                               <p class="text-[10px] text-slate-500">รอดำเนินการ ${avPending} รายการ</p>
                             </div>
                           </div>
                           <button onclick="toggleNotificationDropdown(); nav('page-av-manage');" class="text-xs font-bold text-[#265D5A] hover:underline">จัดการ</button>
                         </div>`;
            }
            notifList.innerHTML = html;
          } else {
            notifList.innerHTML = '<div class="p-4 text-center text-sm text-slate-400">ไม่มีงานค้าง</div>';
          }
        }

        // งานซ่อมบำรุงอาคาร
        if ($('b-total')) $('b-total').textContent = bTotal;
        if ($('b-pending')) $('b-pending').textContent = bPending;
        if ($('b-progress')) $('b-progress').textContent = bProgress;
        if ($('b-completed')) $('b-completed').textContent = bCompleted;
        if ($('b-rating')) $('b-rating').textContent = d?.building?.rating?.avg || '0.0';
        if ($('b-rating-count')) $('b-rating-count').textContent = d?.building?.rating?.count || '0';

        // งานยืม-คืนโสตฯ
        if ($('av-total')) $('av-total').textContent = avTotal;
        if ($('av-pending')) $('av-pending').textContent = avPending;
        if ($('av-active')) $('av-active').textContent = avActive;
        if ($('av-completed')) $('av-completed').textContent = avCompleted;
        if ($('av-rating')) $('av-rating').textContent = d?.av?.rating?.avg || '0.0';
        if ($('av-rating-count')) $('av-rating-count').textContent = d?.av?.rating?.count || '0';

        // งานซ่อมไอที
        if ($('it-total')) $('it-total').textContent = itTotal;
        if ($('it-pending')) $('it-pending').textContent = itPending;
        if ($('it-progress')) $('it-progress').textContent = itProgress;
        if ($('it-completed')) $('it-completed').textContent = itCompleted;
        if ($('it-rating')) $('it-rating').textContent = d?.it?.rating?.avg || '0.0';
        if ($('it-rating-count')) $('it-rating-count').textContent = d?.it?.rating?.count || '0';

        // งานซ่อมโสตฯ
        if ($('avrep-total')) $('avrep-total').textContent = avRepTotal;
        if ($('avrep-pending')) $('avrep-pending').textContent = avRepPending;
        if ($('avrep-progress')) $('avrep-progress').textContent = avRepProgress;
        if ($('avrep-completed')) $('avrep-completed').textContent = avRepCompleted;
        if ($('avrep-rating')) $('avrep-rating').textContent = d?.avRep?.rating?.avg || '0.0';
        if ($('avrep-rating-count')) $('avrep-rating-count').textContent = d?.avRep?.rating?.count || '0';

        // เสนอโครงการ
        if ($('proj-total')) $('proj-total').textContent = projTotal;
        if ($('proj-pending')) $('proj-pending').textContent = projPending;
        if ($('proj-progress')) $('proj-progress').textContent = projProgress;
        if ($('proj-completed')) $('proj-completed').textContent = projCompleted;
        if ($('proj-rating')) $('proj-rating').textContent = d?.proj?.rating?.avg || '0.0';
        if ($('proj-rating-count')) $('proj-rating-count').textContent = d?.proj?.rating?.count || '0';

        // สถิติรายงานบั๊ก
        if ($('bug-count')) $('bug-count').textContent = d?.bugs || 0;

        // สัดส่วนกราฟและอัตราความสำเร็จ
        if ($('ratio-building-count')) $('ratio-building-count').textContent = `${bTotal} รายการ`;
        if ($('ratio-av-count')) $('ratio-av-count').textContent = `${avTotal} รายการ`;
        if ($('ratio-it-count')) $('ratio-it-count').textContent = `${itTotal} รายการ`;
        if ($('ratio-av-repair-count')) $('ratio-av-repair-count').textContent = `${avRepTotal} รายการ`;
        if ($('ratio-project-count')) $('ratio-project-count').textContent = `${projTotal} รายการ`;

        const bPct = totalAll > 0 ? Math.round((bTotal / totalAll) * 100) : 0;
        const avPct = totalAll > 0 ? Math.round((avTotal / totalAll) * 100) : 0;
        const itPct = totalAll > 0 ? Math.round((itTotal / totalAll) * 100) : 0;
        const avRepPct = totalAll > 0 ? Math.round((avRepTotal / totalAll) * 100) : 0;
        const projPct = totalAll > 0 ? Math.round((projTotal / totalAll) * 100) : 0;

        if ($('ratio-building-bar')) $('ratio-building-bar').style.width = `${bPct}%`;
        if ($('ratio-av-bar')) $('ratio-av-bar').style.width = `${avPct}%`;
        if ($('ratio-it-bar')) $('ratio-it-bar').style.width = `${itPct}%`;
        if ($('ratio-av-repair-bar')) $('ratio-av-repair-bar').style.width = `${avRepPct}%`;
        if ($('ratio-project-bar')) $('ratio-project-bar').style.width = `${projPct}%`;

        if ($('ratio-building-pct')) $('ratio-building-pct').textContent = `${bPct}%`;
        if ($('ratio-av-pct')) $('ratio-av-pct').textContent = `${avPct}%`;
        if ($('ratio-it-pct')) $('ratio-it-pct').textContent = `${itPct}%`;
        if ($('ratio-av-repair-pct')) $('ratio-av-repair-pct').textContent = `${avRepPct}%`;
        if ($('ratio-project-pct')) $('ratio-project-pct').textContent = `${projPct}%`;

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

// ==========================================
// 8. ระบบยืนยันตัวตนและการเข้าสู่ระบบ (Authentication)
// ==========================================
const LIFF_ID = "2011401549-8xNgb1CC"; // <-- LIFF ID LINE Deverloper 

document.addEventListener('DOMContentLoaded', () => {
  // Check for survey parameter
  const params = new URLSearchParams(window.location.search);
  if (params.get('action') === 'survey') {
    const type = params.get('type');
    const row = params.get('row');
    if (type && row) {
      setTimeout(() => openSurveyModal(type, row), 1500); // Wait for initialization
    }
  }

  if (LIFF_ID && LIFF_ID !== "ใส่_LIFF_ID_ที่นี่") {
    liff.init({ liffId: LIFF_ID }).then(() => {
      if (liff.isLoggedIn()) {
        if (!localStorage.getItem('logged_teacher')) {
          handleLiffLogin();
        } else {
          // ถ้ามี session อยู่แล้ว และเป็นแอดมิน ให้เด้งไป Dashboard หรือถอยไป Profile
          if (localStorage.getItem('logged_admin') === 'true') {
            nav('page-dashboard');
          } else {
            nav('page-teacher-profile');
          }
        }
      }
    }).catch(err => {
      console.error('LIFF Initialization failed', err);
    });
  }
});

function joinLineGroup() {
  // แก้ไข URL เป็นลิ้งค์กลุ่ม LINE ของคุณ
  window.open('https://line.me/ti/g/EkB7qqyTQy', '_blank');
}

function handleLiffLogin() {
  Swal.fire({ title: 'กำลังตรวจสอบบัญชี LINE...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
  liff.getProfile().then(profile => {
    const idToken = liff.getDecodedIDToken();
    const email = idToken && idToken.email ? idToken.email : profile.userId + '@line.me';
    const lineId = profile.userId;
    const name = profile.displayName;
    const picture = profile.pictureUrl;



    post({ action: 'link_line_account', email: email, lineId: lineId, name: name, picture: picture })
      .then((res) => {
        currentTeacher = res.name;
        currentRole = res.role;
        currentEmail = res.email || email || '';
        isAdminLoggedIn = (res.role === 'Admin' || res.role === 'Executive');

        localStorage.setItem('logged_teacher', currentTeacher);
        localStorage.setItem('logged_role', currentRole);
        localStorage.setItem('logged_email', currentEmail);
        if (isAdminLoggedIn) localStorage.setItem('logged_admin', 'true');
        localStorage.setItem('session_login_time', Date.now().toString());

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
      currentEmail = res.email || '';
      isAdminLoggedIn = (res.role === 'Admin' || res.role === 'Executive');

      localStorage.setItem('logged_teacher', currentTeacher);
      localStorage.setItem('logged_role', currentRole);
      localStorage.setItem('logged_email', currentEmail);
      if (isAdminLoggedIn) localStorage.setItem('logged_admin', 'true');
      localStorage.setItem('session_login_time', Date.now().toString());

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
  localStorage.removeItem('logged_teacher');
  localStorage.removeItem('logged_admin');
  localStorage.removeItem('logged_email');
  currentTeacher = null;
  currentEmail = '';
  isAdminLoggedIn = false;
  updateSessionUI();
  alertBox('info', 'ออกจากระบบเรียบร้อย', '', { timer: 1000, showConfirmButton: false });
  nav('page-auth');
}

// ==========================================
// 9. ระบบนำทางและการสลับหน้าจอ (Navigation & Routing)
// ==========================================
// ฟังก์ชันสำหรับเปลี่ยนหน้า (โดยการซ่อน-แสดง div ตาม ID)
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
    'page-user-manage': 'gnav-user-manage',
    'page-it-manage': 'gnav-it-manage',
    'page-av-repair-manage': 'gnav-av-repair-manage',
    'page-project-manage': 'gnav-project-manage',
    'page-it-repair': 'gnav-it-repair',
    'page-av-repair': 'gnav-av-repair',
    'page-project-form': 'gnav-project-form'
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
  } else if (pageId === 'page-teacher-profile') {
    ResourceHubCore.ui.loadTeacherHistory('repair');
  } else if (pageId === 'page-teacher-av-profile') {
    ResourceHubCore.ui.loadTeacherHistory('av');
  } else if (pageId === 'page-technician') {
    ResourceHubCore.ui.loadAdminTable('repair');
  } else if (pageId === 'page-av-manage') {
    ResourceHubCore.ui.loadAdminTable('av');
  } else if (pageId === 'page-it-manage' || pageId === 'page-av-repair-manage' || pageId === 'page-project-manage') {
    loadAdvancedTasks();
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

// ฟังก์ชันอัปเดตหน้าจอ (ซ่อน/แสดงเมนู) ตามบทบาท (Role) ของผู้ใช้งานที่ล็อกอินเข้ามา
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
  const basicNavItRepair = $('gnav-it-repair');
  const basicNavAvRepair = $('gnav-av-repair');
  const basicNavProject = $('gnav-project-form');
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

    // New Admin menus
    if ($('gnav-it-manage')) { $('gnav-it-manage').classList.remove('hidden'); $('gnav-it-manage').classList.add('flex'); }
    if ($('gnav-av-repair-manage')) { $('gnav-av-repair-manage').classList.remove('hidden'); $('gnav-av-repair-manage').classList.add('flex'); }
    if ($('gnav-project-manage')) { $('gnav-project-manage').classList.remove('hidden'); $('gnav-project-manage').classList.add('flex'); }
    if ($('home-card-it-repair')) { $('home-card-it-repair').classList.remove('hidden'); $('home-card-it-repair').classList.add('flex'); }
    if ($('home-card-av-repair')) { $('home-card-av-repair').classList.remove('hidden'); $('home-card-av-repair').classList.add('flex'); }
    if ($('home-card-project')) { $('home-card-project').classList.remove('hidden'); $('home-card-project').classList.add('flex'); }

    // Admin sees the basic menus too!
    if (basicNavHome) { basicNavHome.classList.remove('hidden'); basicNavHome.classList.add('flex'); }
    if (basicNavRepair) { basicNavRepair.classList.remove('hidden'); basicNavRepair.classList.add('flex'); }
    if (basicNavAV) { basicNavAV.classList.remove('hidden'); basicNavAV.classList.add('flex'); }
    if (basicNavItRepair) { basicNavItRepair.classList.remove('hidden'); basicNavItRepair.classList.add('flex'); }
    if (basicNavAvRepair) { basicNavAvRepair.classList.remove('hidden'); basicNavAvRepair.classList.add('flex'); }
    if (basicNavProject) { basicNavProject.classList.remove('hidden'); basicNavProject.classList.add('flex'); }
    if (basicNavCreateBtn) { basicNavCreateBtn.classList.remove('hidden'); }

    if ($('dropdown-user-name')) $('dropdown-user-name').textContent = currentRole === 'Executive' ? 'ผู้บริหาร (Executive)' : 'ผู้ดูแลระบบ (Admin)';
    if ($('dropdown-user-role')) {
      let textRole = currentRole === 'Executive' ? 'ผู้บริหาร' : 'เจ้าหน้าที่ / Admin';
      $('dropdown-user-role').innerHTML = `สถานะ: ${textRole}${currentEmail ? `<br><span class="text-[10px] text-slate-400 font-normal mt-0.5 block break-all"><i class="fa-regular fa-envelope mr-1"></i>${currentEmail}</span>` : ''}`;
    }

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

    // Hide admin-only menus for regular teachers
    if ($('gnav-it-manage')) $('gnav-it-manage').classList.add('hidden');
    if ($('gnav-av-repair-manage')) $('gnav-av-repair-manage').classList.add('hidden');
    if ($('gnav-project-manage')) $('gnav-project-manage').classList.add('hidden');
    if ($('home-card-it-repair')) { $('home-card-it-repair').classList.remove('hidden'); $('home-card-it-repair').classList.add('flex'); }
    if ($('home-card-av-repair')) { $('home-card-av-repair').classList.remove('hidden'); $('home-card-av-repair').classList.add('flex'); }
    if ($('home-card-project')) { $('home-card-project').classList.remove('hidden'); $('home-card-project').classList.add('flex'); }

    let roleDisplay = 'ผู้ใช้งานระบบ';

    if (currentRole === 'Tech') {
      roleDisplay = 'ช่างซ่อมบำรุง (Tech)';
      if (dashNav) { dashNav.classList.remove('hidden'); dashNav.classList.add('flex'); }
      if (techNav) { techNav.classList.remove('hidden'); techNav.classList.add('flex'); }
      if (homeCardDash) { homeCardDash.classList.remove('hidden'); homeCardDash.classList.add('flex'); }
      
      // New Admin menus for Tech
      if ($('gnav-project-manage')) { $('gnav-project-manage').classList.remove('hidden'); $('gnav-project-manage').classList.add('flex'); }
      if ($('home-card-project')) { $('home-card-project').classList.remove('hidden'); $('home-card-project').classList.add('flex'); }

      if (basicNavHome) basicNavHome.classList.add('hidden');
      if (basicNavRepair) basicNavRepair.classList.add('hidden');
      if (basicNavAV) basicNavAV.classList.add('hidden');
      if (basicNavItRepair) basicNavItRepair.classList.add('hidden');
      if (basicNavAvRepair) basicNavAvRepair.classList.add('hidden');
      if (basicNavProject) basicNavProject.classList.add('hidden');
      if (basicNavCreateBtn) basicNavCreateBtn.classList.add('hidden');

    } else if (currentRole === 'AV') {
      roleDisplay = 'เจ้าหน้าที่โสตฯ (AV)';
      if (dashNav) { dashNav.classList.remove('hidden'); dashNav.classList.add('flex'); }
      if (techNav) { techNav.classList.remove('hidden'); techNav.classList.add('flex'); }
      if (avManageNav) { avManageNav.classList.remove('hidden'); avManageNav.classList.add('flex'); }
      if (masterDataNav) { masterDataNav.classList.remove('hidden'); masterDataNav.classList.add('flex'); }
      if ($('gnav-user-manage')) { $('gnav-user-manage').classList.remove('hidden'); $('gnav-user-manage').classList.add('flex'); }
      if (homeCardDash) { homeCardDash.classList.remove('hidden'); homeCardDash.classList.add('flex'); }
  
      // New Admin menus for AV
      if ($('gnav-it-manage')) { $('gnav-it-manage').classList.remove('hidden'); $('gnav-it-manage').classList.add('flex'); }
      if ($('gnav-av-repair-manage')) { $('gnav-av-repair-manage').classList.remove('hidden'); $('gnav-av-repair-manage').classList.add('flex'); }
      if ($('gnav-project-manage')) { $('gnav-project-manage').classList.remove('hidden'); $('gnav-project-manage').classList.add('flex'); }
      if ($('home-card-it-repair')) { $('home-card-it-repair').classList.remove('hidden'); $('home-card-it-repair').classList.add('flex'); }
      if ($('home-card-av-repair')) { $('home-card-av-repair').classList.remove('hidden'); $('home-card-av-repair').classList.add('flex'); }
      if ($('home-card-project')) { $('home-card-project').classList.remove('hidden'); $('home-card-project').classList.add('flex'); }

      if (basicNavHome) basicNavHome.classList.add('hidden');
      if (basicNavRepair) basicNavRepair.classList.add('hidden');
      if (basicNavAV) basicNavAV.classList.add('hidden');
      if (basicNavItRepair) basicNavItRepair.classList.add('hidden');
      if (basicNavAvRepair) basicNavAvRepair.classList.add('hidden');
      if (basicNavProject) basicNavProject.classList.add('hidden');
      if (basicNavCreateBtn) basicNavCreateBtn.classList.add('hidden');

    } else if (currentRole === 'Staff') {
      roleDisplay = 'เจ้าหน้าที่ / แอดมิน (Staff)';
      if (dashNav) { dashNav.classList.remove('hidden'); dashNav.classList.add('flex'); }
      if (techNav) { techNav.classList.remove('hidden'); techNav.classList.add('flex'); }
      if (avManageNav) { avManageNav.classList.remove('hidden'); avManageNav.classList.add('flex'); }
      if (masterDataNav) { masterDataNav.classList.remove('hidden'); masterDataNav.classList.add('flex'); }
      if ($('gnav-user-manage')) { $('gnav-user-manage').classList.remove('hidden'); $('gnav-user-manage').classList.add('flex'); }
      if (homeCardDash) { homeCardDash.classList.remove('hidden'); homeCardDash.classList.add('flex'); }

      // New Admin menus for Staff
      if ($('gnav-it-manage')) { $('gnav-it-manage').classList.remove('hidden'); $('gnav-it-manage').classList.add('flex'); }
    if ($('gnav-av-repair-manage')) { $('gnav-av-repair-manage').classList.remove('hidden'); $('gnav-av-repair-manage').classList.add('flex'); }
    if ($('gnav-project-manage')) { $('gnav-project-manage').classList.remove('hidden'); $('gnav-project-manage').classList.add('flex'); }
      if ($('home-card-it-repair')) { $('home-card-it-repair').classList.remove('hidden'); $('home-card-it-repair').classList.add('flex'); }
      if ($('home-card-av-repair')) { $('home-card-av-repair').classList.remove('hidden'); $('home-card-av-repair').classList.add('flex'); }
      if ($('home-card-project')) { $('home-card-project').classList.remove('hidden'); $('home-card-project').classList.add('flex'); }

      if (basicNavHome) basicNavHome.classList.add('hidden');
      if (basicNavRepair) basicNavRepair.classList.add('hidden');
      if (basicNavAV) basicNavAV.classList.add('hidden');
      if (basicNavItRepair) basicNavItRepair.classList.add('hidden');
      if (basicNavAvRepair) basicNavAvRepair.classList.add('hidden');
      if (basicNavProject) basicNavProject.classList.add('hidden');
      if (basicNavCreateBtn) basicNavCreateBtn.classList.add('hidden');

    } else {
      // Normal Teacher
      if (basicNavHome) { basicNavHome.classList.remove('hidden'); basicNavHome.classList.add('flex'); }
      if (basicNavRepair) { basicNavRepair.classList.remove('hidden'); basicNavRepair.classList.add('flex'); }
      if (basicNavAV) { basicNavAV.classList.remove('hidden'); basicNavAV.classList.add('flex'); }
      if (basicNavItRepair) { basicNavItRepair.classList.remove('hidden'); basicNavItRepair.classList.add('flex'); }
      if (basicNavAvRepair) { basicNavAvRepair.classList.remove('hidden'); basicNavAvRepair.classList.add('flex'); }
      if (basicNavProject) { basicNavProject.classList.remove('hidden'); basicNavProject.classList.add('flex'); }
      if (basicNavCreateBtn) { basicNavCreateBtn.classList.remove('hidden'); }

      if (teacherProfileNav) { teacherProfileNav.classList.remove('hidden'); teacherProfileNav.classList.add('flex'); }
      if (teacherAVProfileNav) { teacherAVProfileNav.classList.remove('hidden'); teacherAVProfileNav.classList.add('flex'); }
      if (homeCardTeacherProfile) { homeCardTeacherProfile.classList.remove('hidden'); homeCardTeacherProfile.classList.add('flex'); }
      if (homeCardTeacherAVProfile) { homeCardTeacherAVProfile.classList.remove('hidden'); homeCardTeacherAVProfile.classList.add('flex'); }
    }

    if ($('dropdown-user-name')) $('dropdown-user-name').textContent = `คุณครู ${currentTeacher}`;
    if ($('dropdown-user-role')) {
      $('dropdown-user-role').innerHTML = `สถานะ: ${roleDisplay}${currentEmail ? `<br><span class="text-[10px] text-slate-400 font-normal mt-0.5 block break-all"><i class="fa-regular fa-envelope mr-1"></i>${currentEmail}</span>` : ''}`;
    }

    if ($('page-auth').classList.contains('active')) nav('page-teacher-profile');

  } else {
    // Guest
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

    // Hide admin-only menus for guests
    if ($('gnav-it-manage')) $('gnav-it-manage').classList.add('hidden');
    if ($('gnav-av-repair-manage')) $('gnav-av-repair-manage').classList.add('hidden');
    if ($('gnav-project-manage')) $('gnav-project-manage').classList.add('hidden');
    if ($('home-card-it-repair')) $('home-card-it-repair').classList.add('hidden');
    if ($('home-card-av-repair')) $('home-card-av-repair').classList.add('hidden');
    if ($('home-card-project')) $('home-card-project').classList.add('hidden');

    if (basicNavHome) { basicNavHome.classList.remove('hidden'); basicNavHome.classList.add('flex'); }
    if (basicNavRepair) { basicNavRepair.classList.remove('hidden'); basicNavRepair.classList.add('flex'); }
    if (basicNavAV) { basicNavAV.classList.remove('hidden'); basicNavAV.classList.add('flex'); }
    if (basicNavItRepair) { basicNavItRepair.classList.remove('hidden'); basicNavItRepair.classList.add('flex'); }
    if (basicNavAvRepair) { basicNavAvRepair.classList.remove('hidden'); basicNavAvRepair.classList.add('flex'); }
    if (basicNavProject) { basicNavProject.classList.remove('hidden'); basicNavProject.classList.add('flex'); }
    if (basicNavCreateBtn) { basicNavCreateBtn.classList.remove('hidden'); }

    if ($('dropdown-user-name')) $('dropdown-user-name').textContent = 'ยังไม่ได้เข้าสู่ระบบ';
    if ($('dropdown-user-role')) $('dropdown-user-role').textContent = 'สถานะ: ทั่วไป';

    nav('page-auth');
  }

  updateNotificationBadges();
}

// ฟังก์ชันระบบค้นหาข้อมูล (ค้นหางานซ่อม/ยืมโสตฯ หรือนำทางไปยังหน้าอื่นๆ จากคำค้น)
function handleGlobalSearch(keyword) {
  const term = keyword.toLowerCase().trim();
  const techPage = $('page-technician');
  const avPage = $('page-av-manage');

  if (techPage && !techPage.classList.contains('hidden')) {
    window.currentRepairSearch = term;
    if (typeof window.renderRepairTable === 'function') {
      window.renderRepairTable();
    }
    return;
  }

  if (avPage && !avPage.classList.contains('hidden')) {
    window.currentAVSearch = term;
    if (typeof window.renderAVTable === 'function') {
      window.renderAVTable();
    }
    return;
  }

  // Fallback to navigation if not on manageable pages
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
  const notifDropdown = $('notification-dropdown');
  if (notifDropdown && !notifDropdown.classList.contains('hidden')) {
    notifDropdown.classList.add('hidden');
  }
}

function toggleNotificationDropdown() {
  const dropdown = $('notification-dropdown');
  if (dropdown) dropdown.classList.toggle('hidden');
  const profileDropdown = $('profile-dropdown');
  if (profileDropdown && !profileDropdown.classList.contains('hidden')) {
    profileDropdown.classList.add('hidden');
  }
}

// ปิด dropdown เมื่อคลิกที่อื่น
document.addEventListener('click', (e) => {
  const profileDropdown = $('profile-dropdown');
  const profileBtn = $('profile-btn') || e.target.closest('button[title="ข้อมูลส่วนตัว"]');
  if (profileDropdown && !profileDropdown.classList.contains('hidden') && !profileDropdown.contains(e.target) && !profileBtn) {
    profileDropdown.classList.add('hidden');
  }

  const notifDropdown = $('notification-dropdown');
  const notifBtn = $('notification-bell');
  if (notifDropdown && !notifDropdown.classList.contains('hidden') && !notifDropdown.contains(e.target) && (!notifBtn || !notifBtn.contains(e.target))) {
    notifDropdown.classList.add('hidden');
  }
});

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

// ==========================================
// 10. ระบบจัดการข้อมูลหลัก (Master Data & Cache)
// ==========================================
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
          <div class="flex gap-4">
            <button onclick="openQrGenModal('${mergedEsc(x.name)}')" class="text-[#265D5A] hover:text-[#1a3f3d]" title="สร้าง QR Code"><i class="fa-solid fa-qrcode"></i></button>
            <button onclick="deleteMaster('location','${mergedEsc(x.id)}')" class="text-rose-500 hover:text-rose-700" title="ลบ"><i class="fa-solid fa-trash"></i></button>
          </div>
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

  const overdueInput = $('md-overdue-days');
  if (overdueInput && mergedCache.settings && mergedCache.settings.overdueDays) {
    overdueInput.value = mergedCache.settings.overdueDays;
  }
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
    const d = await ResourceHubCore.dashboard.legacy().catch(e => {
      console.error('Legacy dashboard fetch failed:', e);
      return null;
    });
    
    if (d) {
      const bPending = (Number(d?.building?.pending) || 0) + (Number(d?.building?.inProgress) || 0);
      const badgeRepair = document.getElementById('badge-repair');
      if (badgeRepair) {
        badgeRepair.textContent = bPending;
        if (bPending > 0) badgeRepair.classList.remove('hidden');
        else badgeRepair.classList.add('hidden');
      }

      const mbBadgeRepair = document.getElementById('mb-badge-repair');
      if (mbBadgeRepair) {
        mbBadgeRepair.textContent = bPending;
        if (bPending > 0) mbBadgeRepair.classList.remove('hidden');
        else mbBadgeRepair.classList.add('hidden');
      }

      const avPending = Number(d?.av?.pending) || 0;
      const badgeAV = document.getElementById('badge-av');
      if (badgeAV) {
        badgeAV.textContent = avPending;
        if (avPending > 0) badgeAV.classList.remove('hidden');
        else badgeAV.classList.add('hidden');
      }
    }
  } catch (e) {
    console.error('Error loading primary badges:', e);
  }

  try {
    const advD = await ResourceHubCore.api.get('get_adv_tasks').catch(e => {
      console.warn('Adv tasks fetch failed (API might not exist yet):', e);
      return null;
    });
    
    if (advD) {
      const badgeAVRepair = document.getElementById('badge-av-repair');
      if (badgeAVRepair && advD.av) {
        const pendingAvRep = advD.av.filter(r => !['เสร็จสิ้น', 'เรียบร้อยแล้ว', 'อนุมัติ'].includes((r[4] || '').trim())).length;
        badgeAVRepair.textContent = pendingAvRep;
        if (pendingAvRep > 0) badgeAVRepair.classList.remove('hidden');
        else badgeAVRepair.classList.add('hidden');
      }

      const badgeIt = document.getElementById('badge-it');
      if (badgeIt && advD.it) {
        const pendingIt = advD.it.filter(r => !['เสร็จสิ้น', 'เรียบร้อยแล้ว', 'อนุมัติ'].includes((r[4] || '').trim())).length;
        badgeIt.textContent = pendingIt;
        if (pendingIt > 0) badgeIt.classList.remove('hidden');
        else badgeIt.classList.add('hidden');
      }

      const badgeProject = document.getElementById('badge-project');
      if (badgeProject && advD.project) {
        const pendingProject = advD.project.filter(r => !['เสร็จสิ้น', 'เรียบร้อยแล้ว', 'อนุมัติ'].includes((r[4] || '').trim())).length;
        badgeProject.textContent = pendingProject;
        if (pendingProject > 0) badgeProject.classList.remove('hidden');
        else badgeProject.classList.add('hidden');
      }
    }
  } catch (e) {
    console.warn('Could not fetch adv tasks for badge', e);
  }
}

mergedCacheLoad();

// ==========================================
// 11. ฟังก์ชันทางลัดสำหรับเรียกใช้งานจากหน้า HTML (Wrappers)
// ==========================================
async function submitRepair() { return ResourceHubCore.ui.submitRepair(); }
async function submitAVForm() { return ResourceHubCore.ui.submitAV(); }
async function openAVModal(idx, oldStatus, oldTech) { return ResourceHubCore.ui.updateAV(idx, oldStatus, oldTech); }
async function updateTask(idx) { return ResourceHubCore.ui.updateRepair(idx); }
function loadBuildingTasks() { return ResourceHubCore.ui.loadAdminTable('repair'); }

// ==========================================
// 12. ระบบส่งแบบฟอร์มกลาง (Generic Form Submission)
// ==========================================
async function submitGenericForm(config) {
  const subject = $(config.prefix + 'Subject')?.value.trim();
  const detail = $(config.prefix + 'Detail')?.value.trim();
  const reporter = $(config.prefix + 'Reporter')?.value.trim();
  const dept = $(config.prefix + 'Department')?.value.trim() || '';
  const loc = $(config.prefix + 'Location')?.value.trim() || '';
  const urgency = document.querySelector(`input[name="${config.prefix}Urgency"]:checked`)?.value || 'ตามคิว';
  const contact = $(config.prefix + 'Contact')?.value.trim() || '';

  // Handle specific date fields
  const incidentDate = $(config.prefix + 'IncidentDate')?.value || '';
  const targetDate = $(config.prefix + 'TargetDate')?.value || '';

  const btn = $('btnSubmit' + config.btnSuffix);

  if (!subject || !reporter || !detail) {
    return alertBox('warning', 'กรอกข้อมูลไม่ครบ', config.missingText || 'กรุณากรอกข้อมูลให้ครบถ้วน');
  }

  setBusy(btn, true);
  try {
    const file = await readFile($(config.prefix + 'File')?.files[0]);
    const payload = { action: config.action, subject, detail, reporter, dept, loc, urgency, contact, file };
    if (incidentDate) payload.incidentDate = incidentDate;
    if (targetDate) payload.targetDate = targetDate;

    await ResourceHubCore.api.post(payload);
    setBusy(btn, false, config.btnOriginalHtml);
    await alertBox('success', 'ส่งเรื่องสำเร็จ!', config.successText, { timer: 2000, showConfirmButton: false });
    $(config.formId)?.reset();
    nav('page-home');
  } catch (e) {
    setBusy(btn, false, config.btnOriginalHtml);
    alertBox('error', 'ข้อผิดพลาด', e.message || 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
  }
}

async function submitItRepair() {
  return submitGenericForm({
    action: 'submit_it_repair',
    prefix: 'it',
    btnSuffix: 'ItRepair',
    missingText: 'กรุณากรอกชื่อผู้แจ้ง หัวข้อ และรายละเอียดปัญหา',
    successText: 'ทีมไอทีจะดำเนินการโดยเร็วที่สุดครับ',
    btnOriginalHtml: '<i class="fa-solid fa-paper-plane"></i> <span>ส่งแจ้งปัญหาไอที</span>',
    formId: 'itRepairForm'
  });
}

async function submitAvRepair() {
  return submitGenericForm({
    action: 'submit_av_repair',
    prefix: 'avRep',
    btnSuffix: 'AvRepair',
    missingText: 'กรุณากรอกชื่อผู้แจ้ง หัวข้อ และรายละเอียดปัญหา',
    successText: 'ทีมโสตฯ จะดำเนินการโดยเร็วที่สุดครับ',
    btnOriginalHtml: '<i class="fa-solid fa-paper-plane"></i> <span>ส่งแจ้งซ่อมโสตฯ</span>',
    formId: 'avRepairForm'
  });
}

async function submitProject() {
  return submitGenericForm({
    action: 'submit_project',
    prefix: 'proj',
    btnSuffix: 'Project',
    missingText: 'กรุณากรอกชื่อผู้เสนอ หัวข้อ และรายละเอียดโครงการ',
    successText: 'โครงการของคุณถูกบันทึกและรอการพิจารณาแล้วครับ',
    btnOriginalHtml: '<i class="fa-solid fa-paper-plane"></i> <span>ส่งเสนอโครงการ</span>',
    formId: 'projectForm'
  });
}

// ==========================================
// 13. จัดการรายการขั้นสูง (Advanced Tasks Management)
// ==========================================
async function loadAdvancedTasks() {
  // แสดง Skeleton ในทุก Container ที่เกี่ยวข้อง
  const skeletonHtml = typeof getSkeletonCards === 'function' ? getSkeletonCards(4) : '<div class="p-8 text-center text-slate-400"><i class="fa-solid fa-circle-notch fa-spin text-2xl"></i></div>';
  ['it-manage-list', 'av-repair-manage-list', 'project-manage-list'].forEach(id => {
    const el = $(id);
    if (el) el.innerHTML = skeletonHtml;
  });
  try {
    const data = await ResourceHubCore.api.get('get_adv_tasks');
    window.advTasksData = data;
    if (window.applyAdvFilters) {
      window.applyAdvFilters('it');
      window.applyAdvFilters('project');
      window.applyAdvFilters('av-repair');
    }
  } catch (e) {
    console.error('loadAdvancedTasks error:', e);
    ['it-manage-list', 'av-repair-manage-list', 'project-manage-list'].forEach(id => {
      const el = $(id);
      if (el) el.innerHTML = '<div class="p-8 text-center text-rose-500"><i class="fa-solid fa-triangle-exclamation mr-2"></i>ไม่สามารถโหลดข้อมูลได้ในขณะนี้</div>';
    });
  }
}

function renderAdvTable(tbodyId, rows, type) {
  const tbody = $('adv-section-' + type)?.querySelector('tbody');
  if (!tbody) return;
  if (!rows || !rows.length) {
    tbody.innerHTML = '<tr><td colspan="8" class="p-8 text-center text-slate-500">ไม่มีรายการในขณะนี้</td></tr>';
    return;
  }
  tbody.innerHTML = rows.map((r, i) => {
    let timestamp, subject, detail, status, urgency, reporter, img, isDone;

    if (type === 'it') {
      // IT_Repairs: [0:Timestamp, 1:Subject, 2:Detail, 3:Reporter, 4:Status, 5:Image_Report, ..., 11:Urgency, 12:Dept, 13:Loc]
      timestamp = r[0] || '';
      subject = r[1] || '';
      detail = r[2] || '';
      status = (r[4] || '').trim();
      urgency = (r[11] || '').trim();
      reporter = r[3] || '';
      img = r[5] && r[5] !== '-' ? '<button onclick="showImageModal(\'' + r[5] + '\')" class="text-blue-500 underline"><i class="fa-solid fa-image"></i> ดูรูป</button>' : '-';
    } else if (type === 'project') {
      // Facility_Projects: [0:Timestamp, 1:Subject, 2:Detail, 3:Reporter, 4:Status, 5:Document_Url, ..., 11:Urgency, 12:Dept, 13:Loc]
      timestamp = r[0] || '';
      subject = r[1] || '';
      detail = r[2] || '';
      status = (r[4] || '').trim();
      urgency = (r[11] || '').trim();
      reporter = r[3] || '';
      img = r[5] && r[5] !== '-' ? '<a href="' + r[5] + '" target="_blank" class="text-blue-500 underline"><i class="fa-solid fa-file-pdf"></i> เอกสาร</a>' : '-';
    }

    isDone = ['เสร็จสิ้น', 'เรียบร้อยแล้ว', 'อนุมัติ'].includes(status);
    let urgHtml = '<span class="text-xs text-slate-400">-</span>';

    if (isDone && type === 'it') {
      const rating = parseInt(r[18] || '0', 10);
      if (rating > 0) {
        const starArr = Array(5).fill(0).map((_, idx) =>
          '<i class="' + (idx < rating ? 'fa-solid' : 'fa-regular') + ' fa-star text-sm ' + (idx < rating ? 'text-amber-400' : 'text-slate-300') + '"></i>');
        urgHtml = '<span class="flex justify-center gap-0.5">' + starArr.join('') + '</span>';
      } else {
        urgHtml = `<button onclick="openSurveyModal('it_repair', ${i + 2})" class="text-xs text-blue-500 hover:text-blue-700 font-semibold whitespace-nowrap"><i class="fa-regular fa-star mr-0.5"></i>ประเมิน</button>`;
      }
    } else {
      if (urgency === 'ด่วน') urgHtml = '<span class="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold bg-rose-100 text-rose-700 border border-rose-200"><i class="fa-solid fa-bolt text-[9px]"></i> ด่วน</span>';
      else if (urgency === 'ตามคิว') urgHtml = '<span class="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold bg-blue-100 text-blue-700 border border-blue-200"><i class="fa-solid fa-list-ul text-[9px]"></i> ตามคิว</span>';
      else if (urgency === 'ไม่รีบ') urgHtml = '<span class="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200"><i class="fa-solid fa-leaf text-[9px]"></i> ไม่รีบ</span>';
    }

    const rowBg = isDone ? 'bg-white hover:bg-slate-50' : 'bg-rose-50/30 hover:bg-rose-50/60';
    return '<tr class="border-b ' + rowBg + ' transition-colors"><td class="p-4 text-center">' + urgHtml + '</td><td class="p-4 text-slate-500">' + timestamp + '</td><td class="p-4">' + statusTagClass(status) + '</td><td class="p-4 font-bold text-slate-800">' + subject + '</td><td class="p-4 text-sm text-slate-600 max-w-xs truncate">' + detail + '</td><td class="p-4 font-semibold text-slate-700">' + reporter + '</td><td class="p-4">' + img + '</td><td class="p-4 text-center"><button class="text-blue-500 hover:text-blue-700 font-semibold" onclick="updateAdvTask(\'' + type + '\',' + i + ',\'' + status + '\')"><i class="fa-solid fa-pen-to-square"></i></button></td></tr>';
  }).join('');
}

window.updateAdvTask = async function (type, index, currentStatus) {
  const allData = window.advTasksData[type === 'av-repair' ? 'av' : type];
  const taskData = allData ? allData[index] : null;
  let detailsHtml = '';
  if (taskData) {
    const timestamp = taskData[0] || '-';
    const subject = taskData[1] || '-';
    const detail = taskData[2] || '-';
    const reporter = taskData[3] || '-';
    detailsHtml = `<div class="text-left mb-5 p-4 bg-slate-50 rounded-xl border border-slate-200 shadow-sm"><div class="font-bold text-slate-800 mb-1 text-base">${subject}</div><div class="text-sm text-slate-600 mb-3 whitespace-pre-wrap">${detail}</div><div class="text-xs font-semibold text-slate-500 flex items-center gap-1 border-t border-slate-200 pt-2 mt-2"><i class="fa-solid fa-user text-slate-400"></i> ${reporter} &nbsp;&nbsp;|&nbsp;&nbsp;<i class="fa-regular fa-clock text-slate-400"></i> ${timestamp}</div></div>`;
  }

  const r = await Swal.fire({
    title: 'อัปเดตสถานะ',
    html: detailsHtml,
    showDenyButton: true,
    showCancelButton: true,
    confirmButtonText: 'กำลังดำเนินการ',
    denyButtonText: 'ปิดงาน (แนบรูป)',
    confirmButtonColor: '#3b82f6',
    denyButtonColor: '#10b981'
  });

  if (r.isConfirmed) {
    return submitAction(
      () => ResourceHubCore.api.post({ action: 'update_adv_task', tabType: type, rowIndex: index, status: 'กำลังดำเนินการ' }),
      'อัปเดตสถานะเรียบร้อย',
      () => loadAdvancedTasks()
    );
  }

  if (!r.isDenied) return;

  const techLabel = type === 'it' ? 'ชื่อช่างผู้ซ่อม / ผู้รับผิดชอบ' : 'ผู้อนุมัติโครงการ';
  const detailLabel = type === 'it' ? 'ซ่อมหรือแก้ไขอะไรไปบ้าง?' : 'บันทึกการอนุมัติ / รายละเอียดเพิ่มเติม';
  const proofLabel = type === 'it' ? 'รูปภาพผลการซ่อม (บังคับ)' : 'เอกสาร/รูปภาพอนุมัติ (บังคับ)';
  const statusToSave = type === 'it' ? 'เสร็จสิ้น' : 'อนุมัติ';

  const x = await Swal.fire({
    title: 'ปิดงาน / สรุปผล',
    html: `<div class="text-left space-y-3 mt-4 text-slate-900">
             <input id="advTechName" class="w-full p-2.5 border rounded-lg" placeholder="${techLabel}">
             <textarea id="advFixDetail" rows="2" class="w-full p-2.5 border rounded-lg" placeholder="${detailLabel}"></textarea>
             <label class="block text-xs font-semibold text-slate-600 mt-2">${proofLabel}</label>
             <input type="file" id="advProofFile" accept="image/*,application/pdf" class="w-full p-2 border rounded-lg text-sm bg-slate-50">
             <hr class="my-2 border-slate-200">
             <label class="block text-xs font-semibold text-slate-600">ค่าใช้จ่าย (บาท) [ไม่บังคับ]</label>
             <input type="number" id="advRepairCost" min="0" class="w-full p-2.5 border rounded-lg bg-slate-50" placeholder="0">
             <label class="block text-xs font-semibold text-slate-600 mt-2">เอกสารใบเสร็จ / เบิกจ่าย [ไม่บังคับ]</label>
             <input type="file" id="advReceiptFile" accept="image/*,application/pdf" class="w-full p-2 border rounded-lg text-sm bg-slate-50">
           </div>`,
    focusConfirm: false, showCancelButton: true, confirmButtonText: 'บันทึกปิดงาน', cancelButtonText: 'ยกเลิก',
    preConfirm: () => {
      const techName = $('advTechName').value.trim();
      const fixDetail = $('advFixDetail').value.trim();
      const file = $('advProofFile').files[0];
      const cost = $('advRepairCost').value.trim();
      const receipt = $('advReceiptFile').files[0];
      if (!techName || !fixDetail || !file) return Swal.showValidationMessage('กรุณากรอกข้อมูลและแนบไฟล์ให้ครบถ้วนครับ');
      return { techName, fixDetail, file, cost, receipt };
    }
  });

  if (!x.isConfirmed) return;
  submitAction(
    async () => {
      const file = await readFile(x.value.file);
      let receiptFile = null;
      if (x.value.receipt) {
        receiptFile = await readFile(x.value.receipt);
      }
      return ResourceHubCore.api.post({
        action: 'update_adv_task',
        tabType: type,
        rowIndex: index,
        status: statusToSave,
        technician: x.value.techName,
        fixDetail: x.value.fixDetail,
        file,
        cost: x.value.cost,
        receiptFile
      });
    },
    'ปิดงานสำเร็จ',
    () => loadAdvancedTasks()
  );
};
function switchAdvTab(tabId, btn) {
  document.querySelectorAll('.adv-section').forEach(s => {
    s.classList.add('hidden');
    s.classList.remove('block');
  });
  const target = $('adv-section-' + tabId);
  if (target) {
    target.classList.remove('hidden');
    target.classList.add('block');
  }
  if (btn) {
    const container = $('advManageMainTabs');
    if (container) {
      container.querySelectorAll('button').forEach(b => {
        b.classList.remove('font-bold', 'text-sky-600', 'border-b-2', 'border-sky-600');
        b.classList.add('font-semibold', 'text-slate-500', 'hover:text-slate-700');
      });
      btn.classList.remove('font-semibold', 'text-slate-500', 'hover:text-slate-700');
      btn.classList.add('font-bold', 'text-sky-600', 'border-b-2', 'border-sky-600');
    }
  }
}

// ==========================================
// 14. แดชบอร์ดขั้นสูง (Dashboard Pro)
// ==========================================
async function loadDashboard() { return ResourceHubCore.ui.loadDashboard(); }
async function loadDashboardPro() { /* deprecated: merged into loadDashboard */ }

// ==========================================
// 15. ระบบคลังเอกสาร (Document Module)
// ==========================================

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

// ==========================================
// 16. ส่วนเสริมหน้าจอแอดมินแจ้งซ่อม (Repair Admin UI Enhancements)
// ==========================================
// ===== Skeleton Loading Helper =====
function getSkeletonCards(count) {
  count = count || 4;
  let html = '';
  for (let i = 0; i < count; i++) {
    html += '<div class="skeleton-card">'
      + '<div class="skeleton skeleton-avatar"></div>'
      + '<div class="skeleton-body">'
      + '<div class="skeleton skeleton-line w-1/2" style="margin-bottom:10px"></div>'
      + '<div class="skeleton skeleton-line w-3/4" style="margin-bottom:10px"></div>'
      + '<div class="skeleton skeleton-line w-full" style="margin-bottom:12px"></div>'
      + '<div class="skeleton skeleton-badge"></div>'
      + '</div></div>';
  }
  return html;
}

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
  const dateFilter = window.currentRepairDate || '';
  const reporterFilter = (window.currentRepairReporter || '').toLowerCase().trim();
  const locFilter = (window.currentRepairLocation || '').toLowerCase().trim();

  const filteredList = listWithIndex.filter(({ r }) => {
    const w = getWeight(r[4]);
    if (window.currentRepairTab === 'pending' && w !== 1) return false;
    if (window.currentRepairTab === 'progress' && w !== 2) return false;
    if (window.currentRepairTab === 'done' && w !== 3) return false;

    if (searchQuery) {
      const detailText = (r[2] || '').toLowerCase();
      if (!detailText.includes(searchQuery)) return false;
    }

    if (reporterFilter && !(r[3] || '').toLowerCase().includes(reporterFilter)) return false;
    if (locFilter && !(r[13] || '').toLowerCase().includes(locFilter)) return false;

    if (dateFilter) {
      const parts = (r[0] || '').split(' ')[0].split('/'); // dd/mm/yyyy
      if (parts.length === 3) {
        const taskDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
        if (!isNaN(taskDate.getTime())) {
          const now = new Date();
          const diffDays = (now - taskDate) / (1000 * 60 * 60 * 24);
          if (dateFilter === 'today' && taskDate.toDateString() !== now.toDateString()) return false;
          if (dateFilter === 'week' && diffDays > 7) return false;
          if (dateFilter === 'month' && diffDays > 30) return false;
        }
      }
    }

    return true;
  });

  filteredList.sort((a, b) => {
    const wA = getWeight(a.r[4]);
    const wB = getWeight(b.r[4]);
    if (wA !== wB) return wA - wB;
    return b.originalIndex - a.originalIndex;
  });

  const tbody = $('taskBody');
  if (!tbody) return;
  if (!filteredList.length) {
    tbody.innerHTML = `<div class="p-10 text-center flex flex-col items-center gap-3 text-slate-400 bg-white">
        <i class="fa-solid fa-folder-open text-5xl text-blue-200"></i>
        <p class="font-semibold text-slate-500">ไม่มีรายการในขณะนี้</p>
      </div>`;
    return;
  }

  // จำกัดการวาด DOM สูงสุด 100 รายการเพื่อไม่ให้หน้าจอกระตุกหรือค้าง
  tbody.innerHTML = filteredList.slice(0, 100).map(({ r, originalIndex }) => {
    const timestamp = r[0] || '';
    const subject = r[1] || '';
    const detail = r[2] || '';
    const reporter = r[3] || '';
    const status = (r[4] || '').trim();
    const isDone = (status === 'เสร็จสิ้น' || status === 'เรียบร้อยแล้ว' || status === 'เสร็จสิ้น/คืนเรียบร้อย');
    const img = r[5] && r[5] !== '-' ? `<button onclick="event.stopPropagation(); showImageModal('${r[5]}')" class="text-xs text-blue-500 bg-blue-50 px-2 py-1 rounded-md border border-blue-200 hover:bg-blue-100 mt-2"><i class="fa-solid fa-image"></i> รูปภาพ</button>` : '';

    const urgency = (r[11] || '').trim() || (r[12] || '').trim();

    const rowBg = isDone ? 'bg-white hover:bg-slate-50' : 'bg-rose-50/30 hover:bg-rose-50/60 font-medium';
    
    const getInitials = (name) => {
      if (!name || name === '-') return 'U';
      const parts = name.trim().split(' ');
      if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
      return name.substring(0, 2).toUpperCase();
    };
    const getAvatarColor = (name) => {
      const colors = ['bg-[#265D5A]', 'bg-blue-600', 'bg-emerald-600', 'bg-violet-600', 'bg-rose-600', 'bg-amber-600', 'bg-cyan-600'];
      let hash = 0;
      for (let i = 0; i < (name || '').length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
      return colors[Math.abs(hash) % colors.length];
    };
    const avatarColor = getAvatarColor(reporter);
    const isUnread = !isDone;
    let urgBadge = '';
    if (urgency === 'ด่วน' || detail.includes('ความเร่งด่วน: ด่วน')) {
      urgBadge = '<span class="text-rose-500 text-[10px] font-bold px-2 py-0.5 bg-rose-50 rounded-full border border-rose-100 ml-2 shadow-sm whitespace-nowrap"><i class="fa-solid fa-circle text-[6px] text-rose-500 animate-pulse mr-0.5"></i> ด่วน</span>';
    } else if (urgency === 'ตามคิว') {
      urgBadge = '<span class="text-blue-500 text-[10px] font-bold px-2 py-0.5 bg-blue-50 rounded-full border border-blue-100 ml-2 shadow-sm whitespace-nowrap"><i class="fa-solid fa-circle text-[6px] text-blue-500 mr-0.5"></i> ตามคิว</span>';
    }

    const initials = getInitials(reporter);
    const avatarBg = avatarColor;
    const fontClass = isUnread ? 'font-bold text-slate-800' : 'font-semibold text-slate-700';
    const subjectFontClass = isUnread ? 'font-bold text-slate-800' : 'font-semibold text-slate-600';
    const paperclip = img ? '<i class="fa-solid fa-paperclip text-slate-400" title="มีรูปภาพแนบ"></i>' : '';

    const html = '<div onclick="updateTask(' + originalIndex + ')" class="' + rowBg + ' cursor-pointer p-4 md:p-5 flex gap-4 items-start transition-colors border-b border-slate-100 group">'
      + '<div class="flex-shrink-0 mt-1">'
      + '<div class="w-12 h-12 rounded-full ' + avatarBg + ' text-white flex items-center justify-center font-bold text-lg shadow-sm group-hover:scale-105 transition-transform">'
      + initials
      + '</div></div>'
      + '<div class="flex-1 min-w-0">'
      + '<div class="flex flex-col md:flex-row md:justify-between md:items-center mb-1.5 gap-1 md:gap-4">'
      + '<h4 class="text-base ' + fontClass + ' truncate flex items-center">' + reporter + ' ' + urgBadge + '</h4>'
      + '<span class="text-xs text-slate-500 whitespace-nowrap font-medium md:order-last order-first">' + timestamp + '</span>'
      + '</div>'
      + '<div class="text-sm ' + subjectFontClass + ' mb-1.5 truncate flex items-center gap-2">' + subject + paperclip + '</div>'
      + '<div class="text-sm text-slate-500 line-clamp-2 leading-relaxed mb-3">' + detail + '</div>'
      + '<div class="flex flex-wrap gap-2 items-center">' + statusTagClass(status) + img + '</div>'
      + '</div></div>';
    return html;
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
  function getDriveImgHtml(url, title, colorTheme) {
    if (!url || url === '-') return '';
    let fileId = '';
    const m1 = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (m1) fileId = m1[1];
    else {
      const m2 = url.match(/id=([a-zA-Z0-9_-]+)/);
      if (m2) fileId = m2[1];
    }
    if (fileId) {
      return `<div class="mt-3 text-center"><p class="text-sm text-slate-500 font-medium mb-2">${title}:</p><button onclick="showImageModal('${url}')" class="block focus:outline-none w-full"><img src="https://drive.google.com/thumbnail?id=${fileId}&sz=w800" class="max-w-full h-auto rounded-lg border border-${colorTheme}-200 mx-auto max-h-64 object-contain shadow-sm hover:opacity-90 transition-opacity cursor-pointer" alt="${title}"></button></div>`;
    }
    return `<button onclick="showImageModal('${url}')" class="block w-full mt-3 bg-${colorTheme}-50 text-${colorTheme}-700 text-center py-2 rounded-lg border border-${colorTheme}-200 hover:bg-${colorTheme}-100 font-semibold"><i class="fa-solid fa-image"></i> ดู${title}</button>`;
  }

  const topic = row[1] || '-';
  const detail = row[2] || '-';
  const fixDetail = row[6] || 'ยังไม่มีการบันทึกการแก้ปัญหา';
  const tech = row[7] || '-';
  const reportImg = getDriveImgHtml(row[5], 'รูปภาพประกอบปัญหา', 'slate');
  const proofImg = getDriveImgHtml(row[8], 'รูปภาพผลการซ่อม', 'emerald');

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
                      ${reportImg}
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
    html: `< div class="text-left mt-4 text-slate-700 space-y-4" >
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
                 </div > `,
    confirmButtonText: 'ปิด',
    confirmButtonColor: '#3b82f6',
    width: '500px'
  });
};

// ==========================================
// 17. ส่วนเสริมหน้าจอแอดมินโสตฯ (AV Admin UI Enhancements)
// ==========================================
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
  const dateFilter = window.currentAVDate || '';
  const reporterFilter = (window.currentAVReporter || '').toLowerCase().trim();
  const locFilter = (window.currentAVLocation || '').toLowerCase().trim();

  const filteredList = listWithIndex.filter(({ r }) => {
    const w = getWeight(r[5]);
    if (window.currentAVTab === 'pending' && w !== 1) return false;
    if (window.currentAVTab === 'progress' && w !== 2) return false;
    if (window.currentAVTab === 'done' && w !== 3) return false;

    if (searchQuery) {
      const equipmentText = (r[2] || '').toLowerCase();
      if (!equipmentText.includes(searchQuery)) return false;
    }

    if (reporterFilter && !(r[1] || '').toLowerCase().includes(reporterFilter)) return false;
    if (locFilter && !(r[4] || '').toLowerCase().includes(locFilter)) return false;

    if (dateFilter) {
      const parts = (r[0] || '').split(' ')[0].split('/'); // dd/mm/yyyy
      if (parts.length === 3) {
        const taskDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
        if (!isNaN(taskDate.getTime())) {
          const now = new Date();
          const diffDays = (now - taskDate) / (1000 * 60 * 60 * 24);
          if (dateFilter === 'today' && taskDate.toDateString() !== now.toDateString()) return false;
          if (dateFilter === 'week' && diffDays > 7) return false;
          if (dateFilter === 'month' && diffDays > 30) return false;
        }
      }
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
    tbody.innerHTML = `<tr><td colspan="9" class="p-10 text-center">
      <div class="flex flex-col items-center gap-3 text-slate-400">
        <i class="fa-solid fa-folder-open text-5xl text-blue-200"></i>
        <p class="font-semibold text-slate-500">ไม่มีรายการในขณะนี้</p>
      </div>
    </td></tr>`;
    return;
  }

  // จำกัดการวาด DOM สูงสุด 100 รายการ
  tbody.innerHTML = filteredList.slice(0, 100).map(({ r, originalIndex }) => {
    const st = r[5] || 'รอยืนยันการยืม';
    const tech = r[6] || '-';
    const isDone = (st === 'เสร็จสิ้น' || st === 'เสร็จสิ้น/คืนเรียบร้อย' || st === 'เรียบร้อยแล้ว');

    let starIcon = '';
    if (isDone) {
      const rating = parseInt(r[18] || '0', 10);
      if (rating > 0) {
        const starArr = Array(5).fill(0).map((_, i) =>
          '<i class="' + (i < rating ? 'fa-solid' : 'fa-regular') + ' fa-star text-sm ' + (i < rating ? 'text-amber-400' : 'text-slate-300') + '"></i>');
        starIcon = '<span class="flex justify-center gap-0.5">' + starArr.join('') + '</span>';
      } else {
        starIcon = `<button onclick="openSurveyModal('av', ${originalIndex + 2})" class="text-xs text-blue-500 hover:text-blue-700 font-semibold whitespace-nowrap"><i class="fa-regular fa-star mr-0.5"></i>ประเมิน</button>`;
      }
    } else {
      starIcon = '<span class="text-amber-400 drop-shadow-sm"><i class="fa-solid fa-star text-lg animate-bounce"></i></span>';
    }

    const rowBg = isDone ? 'bg-white hover:bg-slate-50' : 'bg-amber-50/30 hover:bg-amber-50/60 font-medium';
    const isUnread = !isDone;

    // Function to get initials for avatar
    const getInitials = (name) => {
      if (!name) return 'U';
      const parts = name.trim().split(' ');
      if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
      return name.substring(0, 2).toUpperCase();
    };
    
    // Function to get a deterministic color based on name
    const getAvatarColor = (name) => {
      const colors = ['bg-amber-600', 'bg-blue-600', 'bg-emerald-600', 'bg-violet-600', 'bg-rose-600', 'bg-cyan-600'];
      let hash = 0;
      for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
      return colors[Math.abs(hash) % colors.length];
    };
    
    const avatarColor = getAvatarColor(r[1] || '');

    return `<div onclick="openAVModal(${originalIndex}, '${st}', '${tech}')" class="${rowBg} cursor-pointer p-4 flex gap-4 items-start transition-colors border-b border-slate-100 hover:bg-slate-50">
      <div class="flex-shrink-0 mt-1">
        <div class="w-12 h-12 rounded-full ${avatarColor} text-white flex items-center justify-center font-bold text-lg shadow-sm">
          ${getInitials(r[1] || '')}
        </div>
      </div>
      <div class="flex-1 min-w-0">
        <div class="flex justify-between items-baseline mb-1">
          <h4 class="text-base ${isUnread ? 'font-bold text-slate-800' : 'font-semibold text-slate-700'} truncate pr-2">${r[1]}</h4>
          <span class="text-xs text-slate-500 whitespace-nowrap">${r[0]}</span>
        </div>
        <div class="text-sm ${isUnread ? 'font-bold text-slate-800' : 'font-semibold text-slate-600'} mb-1 flex items-center gap-2">
          <i class="fa-solid fa-microphone-lines text-amber-500"></i> ${r[2]}
        </div>
        <div class="text-sm text-slate-500 line-clamp-2 leading-relaxed mb-3">
          ใช้วันที่: ${r[3]} | สถานที่: ${r[4]} <br> ช่างผู้ดูแล: ${tech}
        </div>
        <div class="flex flex-wrap gap-2 items-center">
          ${starIcon.replace(/onclick="[^"]*"/g, (match) => 'onclick="event.stopPropagation(); ' + match.substring(9))}
          ${statusTagClass(st)}
        </div>
      </div>
    </div>`;
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
// ==========================================
// 18. ระบบจัดการผู้ใช้งาน (User Management - Admin Only)
// ==========================================
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

function toggleMobileSidebar() {
  const sb = document.getElementById('app-sidebar');
  const bd = document.getElementById('mobile-sidebar-backdrop');
  if (sb.classList.contains('-translate-x-full')) {
    sb.classList.remove('-translate-x-full');
    bd.classList.remove('hidden');
  } else {
    sb.classList.add('-translate-x-full');
    bd.classList.add('hidden');
  }
}

window.showImageModal = function (url) {
  if (!url || url === '-') return;
  let fileId = '';
  const m1 = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (m1) fileId = m1[1];
  else {
    const m2 = url.match(/id=([a-zA-Z0-9_-]+)/);
    if (m2) fileId = m2[1];
  }
  const imgSrc = fileId ? `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000` : url;

  Swal.fire({
    imageUrl: imgSrc,
    imageAlt: 'รูปภาพ',
    showConfirmButton: true,
    confirmButtonText: 'ปิด',
    confirmButtonColor: '#3b82f6',
    width: 'auto',
    imageHeight: 'auto',
    customClass: {
      image: 'object-contain max-h-[80vh] w-auto max-w-[90vw] rounded-lg'
    }
  });
};

window.exportTableToCSV = function (tbodyId, filename) {
  const tbody = $(tbodyId);
  if (!tbody) {
    alertBox('error', 'ไม่พบข้อมูล', 'ไม่สามารถส่งออกข้อมูลได้');
    return;
  }

  const rows = tbody.querySelectorAll('tr');
  if (rows.length === 0 || (rows.length === 1 && rows[0].innerText.includes('ไม่มีรายการ'))) {
    alertBox('warning', 'ไม่มีข้อมูล', 'ไม่มีข้อมูลสำหรับส่งออกในขณะนี้');
    return;
  }

  let csvContent = '\uFEFF'; // BOM for Excel

  let headers = [];
  const table = tbody.closest('table');
  if (table) {
    const thead = table.querySelector('thead');
    if (thead) {
      const ths = thead.querySelectorAll('th');
      ths.forEach(th => {
        let text = th.innerText.trim();
        headers.push('"' + text.replace(/"/g, '""') + '"');
      });
      csvContent += headers.join(',') + '\n';
    }
  }

  rows.forEach(row => {
    let rowData = [];
    const cols = row.querySelectorAll('td');
    cols.forEach((col, index) => {
      let text = col.innerText.trim();
      text = text.replace(/"/g, '""');
      rowData.push('"' + text + '"');
    });
    csvContent += rowData.join(',') + '\n';
  });

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

window.saveOverdueSettings = function () {
  const input = document.getElementById('md-overdue-days');
  if (!input) return;
  const days = parseInt(input.value);
  if (isNaN(days) || days < 1) {
    alertBox('error', 'ข้อผิดพลาด', 'กรุณาระบุจำนวนวันให้ถูกต้อง (อย่างน้อย 1 วัน)');
    return;
  }

  submitAction(
    () => ResourceHubCore.api.post({ action: 'save_overdue_settings', days: days }),
    'บันทึกการตั้งค่าแจ้งเตือนเรียบร้อย',
    () => {
      // Refresh หรืออัปเดต UI ถ้าจำเป็น
    }
  );
};

// ==========================================
// ⭐️ ระบบประเมินความพึงพอใจ (Satisfaction Survey)
// ==========================================
window.openSurveyModal = function (type, row) {
  $('survey-type').value = type;
  $('survey-row').value = row;
  $('survey-rating').value = '0';
  $('survey-comment').value = '';
  setSurveyRating(0);
  $('surveyModal').classList.remove('hidden');
};

window.closeSurveyModal = function () {
  $('surveyModal').classList.add('hidden');
};

window.setSurveyRating = function (rating) {
  $('survey-rating').value = rating;
  const stars = document.querySelectorAll('.survey-star');
  stars.forEach(star => {
    const val = parseInt(star.getAttribute('data-value'));
    if (val <= rating) {
      star.classList.remove('text-slate-200');
      star.classList.add('text-amber-400');
    } else {
      star.classList.remove('text-amber-400');
      star.classList.add('text-slate-200');
    }
  });
};

window.submitSurvey = function () {
  const rating = parseInt($('survey-rating').value);
  if (rating === 0 || isNaN(rating)) {
    alertBox('warning', 'กรุณาให้คะแนน', 'กรุณากดเลือกดาวเพื่อประเมินความพึงพอใจก่อนกดส่งครับ');
    return;
  }

  const type = $('survey-type').value;
  const row = $('survey-row').value;
  const comment = $('survey-comment').value;

  submitAction(
    () => ResourceHubCore.api.post({ action: 'submit_survey', type, row, rating, comment }),
    'ขอบคุณที่ร่วมประเมินความพึงพอใจครับ',
    () => {
      closeSurveyModal();
      // ปิด LIFF หากเปิดผ่าน LINE
      if (typeof liff !== 'undefined' && liff.isLoggedIn()) {
        setTimeout(() => { liff.closeWindow(); }, 1500);
      }
    }
  );
};

// ==========================================
// 📄 ระบบออกรายงาน PDF (Export Dashboard)
// ==========================================
window.exportDashboardToPDF = function () {
  const element = document.getElementById('page-dashboard');
  if (!element) return;

  // เตรียมส่วนหัว (Header Bar) ที่มีปุ่ม จะซ่อนปุ่ม
  const headerDiv = element.querySelector('.bg-gradient-to-r');
  const buttons = headerDiv ? headerDiv.querySelectorAll('button') : [];

  // ซ่อนปุ่มชั่วคราว
  buttons.forEach(btn => btn.style.display = 'none');

  Swal.fire({ title: 'กำลังสร้างไฟล์ PDF...', text: 'กรุณารอสักครู่', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

  const opt = {
    margin: [10, 10, 10, 10],
    filename: `FaCiLiTy_Dashboard_${new Date().toISOString().split('T')[0]}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, logging: false },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  html2pdf().set(opt).from(element).save().then(() => {
    // คืนค่าการแสดงผล
    buttons.forEach(btn => btn.style.display = '');
    Swal.close();
  }).catch(err => {
    console.error(err);
    buttons.forEach(btn => btn.style.display = '');
    alertBox('error', 'ข้อผิดพลาด', 'ไม่สามารถ Export เป็น PDF ได้');
  });
};


// ==========================================
// ⬛ ระบบสร้าง QR Code (QR Generator)
// ==========================================
let currentQrCode = null;

window.openQrGenModal = function (text) {
  $('qrGenText').textContent = text;
  $('qrGenCanvas').innerHTML = '';
  currentQrCode = new QRCode($('qrGenCanvas'), {
    text: text,
    width: 200,
    height: 200,
    colorDark: "#000000",
    colorLight: "#ffffff",
    correctLevel: QRCode.CorrectLevel.H
  });
  $('qrGenModal').classList.remove('hidden');
};

window.closeQrGenModal = function () {
  $('qrGenModal').classList.add('hidden');
};

window.downloadQrCode = function () {
  const canvas = document.querySelector('#qrGenCanvas canvas');
  const img = document.querySelector('#qrGenCanvas img');
  if (img && img.src && img.src.startsWith('data:')) {
    const link = document.createElement('a');
    link.download = 'QR_' + $('qrGenText').textContent + '.png';
    link.href = img.src;
    link.click();
  } else if (canvas) {
    const link = document.createElement('a');
    link.download = 'QR_' + $('qrGenText').textContent + '.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  } else {
    alertBox('error', 'เกิดข้อผิดพลาด', 'ไม่สามารถดาวน์โหลดรูป QR Code ได้');
  }
};


window.currentAdvFilters = {
  'it': { status: 'all', date: '', search: '', reporter: '' },
  'av-repair': { status: 'all', date: '', search: '', reporter: '' },
  'project': { status: 'all', date: '', search: '', reporter: '' }
};

window.filterAdvTab = function(type, status, btn) {
  window.currentAdvFilters[type].status = status;
  const containerId = type === 'it' ? 'itManageTabs' : (type === 'av-repair' ? 'avRepairManageTabs' : 'projectManageTabs');
  const container = document.getElementById(containerId);
  if (container) {
    container.querySelectorAll('button').forEach(b => {
      b.className = 'px-4 py-2 font-semibold text-slate-500 hover:text-slate-700 whitespace-nowrap';
    });
    btn.className = 'px-4 py-2 font-bold text-blue-600 border-b-2 border-blue-600 whitespace-nowrap';
  }
  window.applyAdvFilters(type);
};

window.applyAdvFilters = function(type) {
  if (!window.advTasksData || !window.advTasksData[type === 'av-repair' ? 'av' : type]) return;
  const allRows = window.advTasksData[type === 'av-repair' ? 'av' : type];
  const filters = window.currentAdvFilters[type];
  let filtered = allRows;
  
  if (filters.status === 'pending') filtered = filtered.filter(r => r[4] === 'รอดำเนินการ');
  else if (filters.status === 'progress') filtered = filtered.filter(r => r[4] === 'กำลังดำเนินการ');
  else if (filters.status === 'done') filtered = filtered.filter(r => ['เสร็จสิ้น', 'อนุมัติ', 'ไม่อนุมัติ', 'ยกเลิก'].includes(r[4]));
  
  if (filters.search) {
    const s = filters.search.toLowerCase();
    filtered = filtered.filter(r => (r[1] && r[1].toLowerCase().includes(s)) || (r[2] && r[2].toLowerCase().includes(s)));
  }
  if (filters.date) {
    const now = new Date();
    filtered = filtered.filter(r => {
      if (!r[0]) return false;
      const parts = r[0].split(' ');
      if (parts.length < 2) return true;
      const dateParts = parts[0].split('/');
      if (dateParts.length < 3) return true;
      const d = new Date(dateParts[2], dateParts[1] - 1, dateParts[0]);
      if (filters.date === 'today') return d.toDateString() === now.toDateString();
      if (filters.date === 'week') return (now - d) <= 7 * 24 * 60 * 60 * 1000;
      if (filters.date === 'month') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      return true;
    });
  }
  if (filters.reporter) {
    const s = filters.reporter.toLowerCase();
    filtered = filtered.filter(r => r[3] && r[3].toLowerCase().includes(s));
  }
  
  const tbodyId = type === 'it' ? 'itTaskBody' : (type === 'av-repair' ? 'avRepairTaskBody' : 'projectBody');
  if (window.renderAdvTableFiltered) window.renderAdvTableFiltered(tbodyId, filtered, type);
};

window.renderAdvTableFiltered = function(tbodyId, rows, type) {
  const tbody = document.getElementById(tbodyId);
  if (!tbody) return;
  if (!rows || !rows.length) {
    tbody.innerHTML = '<div class="p-8 text-center text-slate-500 bg-white">ไม่มีรายการที่ตรงกับเงื่อนไข</div>';
    return;
  }
  tbody.innerHTML = rows.map((r, i) => {
    const allData = window.advTasksData[type === 'av-repair' ? 'av' : type];
    const originalIndex = allData.indexOf(r);
    const timestamp = r[0] || '';
    const subject = r[1] || '';
    const detail = r[2] || '';
    const reporter = r[3] || '';
    const status = r[4] || '';
    const img = r[5] && r[5] !== '-' ? `<button onclick="event.stopPropagation(); showImageModal('${r[5]}')" class="text-xs text-blue-500 bg-blue-50 px-2 py-1 rounded-md border border-blue-200 hover:bg-blue-100"><i class="fa-solid fa-image"></i> รูปภาพ</button>` : '';
    const urgency = r[6] || '';
    const isDone = ['เสร็จสิ้น', 'อนุมัติ', 'ไม่อนุมัติ', 'ยกเลิก'].includes(status);
    const rowBg = isDone ? 'bg-white hover:bg-slate-50' : 'bg-rose-50/30 hover:bg-rose-50/60 font-medium';
    
    const getInitials = (name) => {
      if (!name) return 'U';
      const parts = name.trim().split(' ');
      if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
      return name.substring(0, 2).toUpperCase();
    };
    const getAvatarColor = (name) => {
      const colors = ['bg-[#265D5A]', 'bg-blue-600', 'bg-emerald-600', 'bg-violet-600', 'bg-rose-600', 'bg-amber-600', 'bg-cyan-600'];
      let hash = 0;
      for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
      return colors[Math.abs(hash) % colors.length];
    };
    const avatarColor = getAvatarColor(reporter);
    const isUnread = !isDone;
    let urgBadge = '';
    if (urgency === 'ด่วน') urgBadge = '<span class="text-rose-500 text-[10px] font-bold px-2 py-0.5 bg-rose-50 rounded-full border border-rose-100 ml-2">ด่วน</span>';
    
    return `<div onclick="updateAdvTask('${type}', ${originalIndex}, '${status}')" class="${rowBg} cursor-pointer p-4 flex gap-4 items-start transition-colors border-b border-slate-100 hover:bg-slate-50"><div class="flex-shrink-0 mt-1"><div class="w-12 h-12 rounded-full ${avatarColor} text-white flex items-center justify-center font-bold text-lg shadow-sm">${getInitials(reporter)}</div></div><div class="flex-1 min-w-0"><div class="flex justify-between items-baseline mb-1"><h4 class="text-base ${isUnread ? 'font-bold text-slate-800' : 'font-semibold text-slate-700'} truncate pr-2 flex items-center">${reporter} ${urgBadge}</h4><span class="text-xs text-slate-500 whitespace-nowrap">${timestamp}</span></div><div class="text-sm ${isUnread ? 'font-bold text-slate-800' : 'font-semibold text-slate-600'} mb-1 truncate flex items-center gap-2">${subject}${img ? '<i class="fa-solid fa-paperclip text-slate-400" title="มีแนบ"></i>' : ''}</div><div class="text-sm text-slate-500 line-clamp-2 leading-relaxed mb-3">${detail}</div><div class="flex flex-wrap gap-2 items-center">${statusTagClass(status)}${img}</div></div></div>`;
  }).join('');
};

function toggleDesktopSidebar() {
  const sb = document.getElementById('app-sidebar');
  if (sb) {
    if (sb.classList.contains('md:flex')) {
      sb.classList.replace('md:flex', 'md:hidden');
    } else {
      sb.classList.replace('md:hidden', 'md:flex');
    }
  }
}
window.toggleDesktopSidebar = toggleDesktopSidebar;
