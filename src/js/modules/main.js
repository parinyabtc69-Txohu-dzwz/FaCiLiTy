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
const scriptURL = 'https://script.google.com/macros/s/AKfycbyMZhZ6AftlGNqrcu15xKGXjIxq9zPCaJZbJooi9qBykjT4pjA71mQpn1kfz8-qyaiaLg/exec';


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
  if (loginTime && (Date.now() - parseInt(loginTime, 10)) > SESSION_EXPIRY_MS) {
    ['logged_teacher', 'logged_role', 'logged_email', 'logged_admin', 'session_login_time'].forEach(k => localStorage.removeItem(k));
    console.warn('🔒 Session หมดอายุ — ล้างข้อมูล Session เรียบร้อย');
  }
})();

// 🔒 XSS Sanitizer: กรองโค้ดอันตราย (HTML/JS) ออกจากข้อมูลก่อนนำไปแสดงผลบนหน้าเว็บ เพื่อป้องกันการถูกแฮก
function sanitizeHtml(str) {
  if (typeof str !== 'string') return (str === null || str === undefined) ? '' : String(str);
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
}
const esc = sanitizeHtml;

// 🔗 ดึง Google Drive File ID ออกจาก URL เพื่อเก็บไว้อ้างอิง/จัดการไฟล์ใน Drive
window.extractDriveFileId = function extractDriveFileId(url) {
  const s = String(url || '').trim();
  if (!s) return '';
  const mPath = s.match(/\/d\/([a-zA-Z0-9_-]{10,})/);
  if (mPath) return mPath[1];
  const mParam = s.match(/[?&]id=([a-zA-Z0-9_-]{10,})/);
  return mParam ? mParam[1] : '';
};

// ⚡ ดึงเอกสารใบงานจาก Real-Time Stream ของ NotificationHub ก่อน ลดการยิง .get() ซ้ำเพื่อประหยัด Read Quota
async function getTicketsDocsCachedOrFetch(limitCount = 150) {
  if (window.NotificationHub && typeof window.NotificationHub.getLatestTickets === 'function') {
    const cache = window.NotificationHub.getLatestTickets();
    if (cache && cache.loaded && Array.isArray(cache.docs) && cache.docs.length > 0 &&
        (!cache.truncated || limitCount <= (cache.limit || 150))) {
      return cache.docs;
    }
  }
  if (!window.firestoreDb) return [];
  const ticketsRef = window.firestoreDb.collection('tickets');
  const q = (typeof ticketsRef.orderBy === 'function' && typeof ticketsRef.limit === 'function')
    ? ticketsRef.orderBy('createdAt', 'desc').limit(limitCount)
    : (typeof ticketsRef.orderBy === 'function' ? ticketsRef.orderBy('createdAt', 'desc') : ticketsRef);
  const fetchPromise = q.get();
  const snap = await (typeof window.withTimeout === 'function' ? window.withTimeout(fetchPromise, 3500) : fetchPromise);
  const docs = [];
  if (snap && typeof snap.forEach === 'function') {
    snap.forEach(doc => docs.push({ id: doc.id, data: doc.data() || {} }));
  }
  return docs;
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
if (currentRole === 'Executive') {
  isAdminLoggedIn = false;
  localStorage.removeItem('logged_admin');
}
window.currentTeacher = currentTeacher;
window.currentRole = currentRole;
window.currentEmail = currentEmail;
try { window.currentGoogleIdToken = sessionStorage.getItem('facility_google_id_token') || ''; } catch (_) { window.currentGoogleIdToken = ''; }
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

// ฟังก์ชันอ่านไฟล์และย่อขนาดรูปภาพอัจฉริยะ (Smart Image Compression) ก่อนแปลงเป็น Base64
const readFile = (file, maxWidth = 1280, quality = 0.75) => new Promise((resolve, reject) => {
  if (!file) return resolve(null);
  
  // หากไม่ใช่ไฟล์รูปภาพ (เช่น PDF / เอกสาร) ให้อ่านไฟล์โดยตรง
  if (!file.type || !file.type.startsWith('image/')) {
    const r = new FileReader();
    r.onload = e => resolve({ name: file.name, type: file.type, data: e.target.result.split(',')[1] });
    r.onerror = reject;
    r.readAsDataURL(file);
    return;
  }

  // หากเป็นรูปภาพ ให้ย่อขนาดและบีบอัดผ่าน Canvas อัตโนมัติ (ลดจาก 5-10MB เหลือ ~150-250KB อัปโหลดไว 10 เท่า)
  const reader = new FileReader();
  reader.onload = e => {
    const img = new Image();
    img.onload = () => {
      let width = img.width;
      let height = img.height;
      if (width > maxWidth || height > maxWidth) {
        if (width > height) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxWidth) / height);
          height = maxWidth;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      const dataUrl = canvas.toDataURL('image/jpeg', quality);
      resolve({
        name: (file.name.replace(/\.[^/.]+$/, "") || 'photo') + '.jpg',
        type: 'image/jpeg',
        data: dataUrl.split(',')[1]
      });
    };
    img.onerror = () => {
      // Fallback กรณีโหลดเข้า Image ไม่ได้
      resolve({ name: file.name, type: file.type, data: e.target.result.split(',')[1] });
    };
    img.src = e.target.result;
  };
  reader.onerror = reject;
  reader.readAsDataURL(file);
});
window.readFile = readFile;

// ==========================================
// 6. ศูนย์กลางควบคุม API (ResourceHubCore)
// ==========================================
// ออบเจ็กต์สำหรับรวมการเรียก API ระหว่างหน้าบ้านกับหลังบ้าน (Google Apps Script) เข้าด้วยกัน
const ResourceHubCore = {
  _cache: new Map(), // เก็บ Cache ของข้อมูล
  _cacheTTL: 120 * 1000, // อายุ Cache 120 วินาที (สอดคล้องกับ Backend CacheService)

  api: {
    // 🔒 SEC-02: API Secret Key สำหรับยืนยันสิทธิ์กับ Google Apps Script
    apiKey: 'FACILITY_SECURE_API_v1',

    // โหลดข้อมูลด้วยวิธี GET (อ่านข้อมูล) พร้อมระบบ Cache
    async get(action, params = {}) {
      const cacheKey = action + JSON.stringify(params);
      const cached = ResourceHubCore._cache.get(cacheKey);
      
      if (cached && (Date.now() - cached.timestamp < ResourceHubCore._cacheTTL)) {
        return cached.data; // คืนค่าจาก Cache ถ้ายังไม่หมดอายุ
      }

      // ส่ง apiKey และ t: Date.now() เพื่อแก้ปัญหา Cache ของเบราว์เซอร์ระดับล่าง
      const q = new URLSearchParams({ action, apiKey: ResourceHubCore.api.apiKey, t: Date.now(), ...params });
      const r = await fetch(`${scriptURL}?${q}`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json();
      
      // บันทึกลง Cache
      ResourceHubCore._cache.set(cacheKey, { data, timestamp: Date.now() });
      return data;
    },
    // ส่งข้อมูลด้วยวิธี POST (บันทึกข้อมูล) พร้อมแนบ apiKey และ Google ID Token (ถ้ายังไม่หมดอายุ)
    async post(payload) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout

      const rawTok = window.currentGoogleIdToken || '';
      const validIdToken = (rawTok && typeof parseGoogleJwt === 'function' && parseGoogleJwt(rawTok)) ? rawTok : '';
      const fullPayload = {
        apiKey: ResourceHubCore.api.apiKey,
        ...(validIdToken && !payload.idToken && !payload.credential ? { idToken: validIdToken } : {}),
        ...(currentEmail && !payload.actorEmail ? { actorEmail: currentEmail } : {}),
        ...payload
      };
      const r = await fetch(scriptURL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(fullPayload),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const text = await r.text();
      try {
        const json = text ? JSON.parse(text) : { status: 'success' };
        if (json.status === 'error') throw new Error(json.message);
        
        // ล้างเฉพาะ Cache ที่เกี่ยวข้องกับการเปลี่ยนแปลง (Selective Smart Cache Invalidation)
        const act = payload.action || '';
        if (act === 'submit_repair' || act === 'update_task_status' || act === 'update_task_proof') {
          ResourceHubCore._cache.delete('tasks{}');
        } else if (act === 'submit_av' || act === 'update_av_status') {
          ResourceHubCore._cache.delete('av_requests{}');
        } else if (act === 'submit_it_repair' || act === 'submit_av_repair' || act === 'submit_project' || act === 'update_adv_task') {
          ResourceHubCore._cache.delete('adv_tasks{}');
        } else if (act === 'update_user' || act === 'delete_user') {
          ResourceHubCore._cache.delete('get_users{}');
          window.cachedUsers = null;
          window.cachedTechList = null;
          try { localStorage.removeItem('cached_tech_list'); } catch(e) {}
        } else if (act === 'master_add' || act === 'master_delete') {
          ResourceHubCore._cache.delete('master_data{}');
        }
        // คำขออื่นๆ เช่น notify_chat, upload_chat_image, edit_assignment ไม่จำเป็นต้องล้างแคชข้อมูลหลัก
        
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

      const fmtHistoryDate = (val) => {
        if (!val) return '-';
        try {
          if (typeof val.toDate === 'function') return val.toDate().toLocaleString('th-TH');
          if (typeof val.seconds === 'number') return new Date(val.seconds * 1000).toLocaleString('th-TH');
          const dObj = new Date(val);
          return isNaN(dObj.getTime()) ? String(val) : dObj.toLocaleString('th-TH');
        } catch (_) {
          return String(val);
        }
      };

      const myNameTrim = (currentTeacher || '').trim();
      const myEmailLow = (currentEmail || localStorage.getItem('logged_email') || '').trim().toLowerCase();
      const isMineTicket = (d) => {
        const dEmail = (d.reporterEmail || '').trim().toLowerCase();
        const dName = (d.reporterName || d.borrower || '').trim();
        return (myEmailLow && dEmail && dEmail === myEmailLow) || (myNameTrim && dName === myNameTrim);
      };

      const dataP = isRepair
        ? (window.firestoreDb ? getTicketsDocsCachedOrFetch(150).then(docs => {
            const arr = [];
            docs.forEach(doc => {
              const d = doc.data || {};
              const tid = String(d.ticketId || doc.id || '');
              const tType = String(d.type || '').toLowerCase();
              const isBuilding = tType === 'building' || (!tType && !/^(IT|AV|PRJ)/i.test(tid));
              if (isBuilding && isMineTicket(d)) {
                arr.push([
                  fmtHistoryDate(d.createdAt),
                  d.subject || 'ไม่ระบุ',
                  d.detail || '',
                  d.reporterName || '',
                  d.status || 'รอดำเนินการ',
                  d.fileUrl || '-',
                  d.techName || d.tech || '',
                  d.fixDetail || ''
                ]);
              }
            });
            return arr;
          }) : ResourceHubCore.work.repairs().then(d => (d || []).filter(r => r[3]?.toString().trim() === myNameTrim)))
        : (window.firestoreDb ? getTicketsDocsCachedOrFetch(150).then(async docs => {
            const arr = [];
            docs.forEach(doc => {
              const d = doc.data || {};
              const tid = String(d.ticketId || doc.id || '');
              const tType = String(d.type || '').toLowerCase();
              if ((tType === 'av' || /^AV/i.test(tid)) && isMineTicket(d)) {
                arr.push([
                  fmtHistoryDate(d.createdAt),
                  d.reporterName || '',
                  d.subject || d.detail || 'รายการโสตฯ',
                  d.incidentDate ? fmtHistoryDate(d.incidentDate) : '-',
                  d.location || '-',
                  d.status || 'จัดเตรียมแล้ว',
                  d.techName || d.tech || ''
                ]);
              }
            });
            if (arr.length) return arr;
            try {
              const legacy = await ResourceHubCore.av.list();
              return (legacy || []).filter(r => r[1]?.toString().trim() === myNameTrim || r[7]?.toString().trim() === myNameTrim);
            } catch (_) {
              return [];
            }
          }) : ResourceHubCore.av.list().then(d => (d || []).filter(r => r[1]?.toString().trim() === myNameTrim || r[7]?.toString().trim() === myNameTrim)));

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
          const s = String(status || '').trim();
          const isCancelled = /ยกเลิก|ไม่อนุมัติ|ปฏิเสธ/.test(s);
          const steps = isRepair
            ? [
                { label: 'ส่งเรื่อง' },
                { label: 'รับเรื่องแล้ว' },
                { label: 'กำลังดำเนินการ' },
                { label: 'เสร็จสิ้น' }
              ]
            : [
                { label: 'ส่งเรื่อง' },
                { label: 'จัดเตรียม / รับเรื่อง' },
                { label: 'กำลังใช้งาน' },
                { label: 'เสร็จสิ้น / คืนแล้ว' }
              ];

          let lastActiveIdx = 0;
          if (isCancelled) {
            lastActiveIdx = -1;
          } else if (/เสร็จ|เรียบร้อย|ปิดงาน|คืนเรียบร้อย|คืนอุปกรณ์|คืนแล้ว/.test(s)) {
            lastActiveIdx = 3;
          } else if (/กำลัง|รอตรวจรับ|แก้ไข|ใช้งานอยู่/.test(s)) {
            lastActiveIdx = 2;
          } else if (/มอบหมาย|จัดเตรียมแล้ว|อนุมัติ|รับเรื่อง|รับงาน/.test(s) && !/^รอ/.test(s)) {
            lastActiveIdx = 1;
          }

          let html = `<div class="flex items-center justify-between mt-6 mb-2 relative">`;
          html += `<div class="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-100 rounded-full z-0"></div>`;

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
            const img = r[5] && r[5] !== '-' && /^https?:\/\//i.test(String(r[5]))
              ? `<button type="button" data-url="${sanitizeHtml(r[5])}" onclick="showImageModal(this.dataset.url)" class="mt-3 text-[#265D5A] bg-[#B0EDE6]/30 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-[#B0EDE6] transition-colors"><i class="fa-solid fa-image"></i> ดูรูปปัญหา</button>`
              : '';
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
        container.innerHTML = `<div class="col-span-full p-8 text-center text-rose-500">เกิดข้อผิดพลาดในการโหลดข้อมูล: ${sanitizeHtml(e && e.message ? e.message : 'ไม่ทราบสาเหตุ')}</div>`;
      }
    },
    // ฟังก์ชันเก่า (ยังเหลือไว้): ระบบส่งแจ้งซ่อมอาคารสถานที่
    async submitRepair() {
      const subject = $('subject').value.trim();
      let detail = $('detail').value.trim();
      const reporter = $('reporter').value.trim();
      let dept = $('department') ? $('department').value.trim() : '';
      if (dept === '__OTHER__') dept = $('department_other') ? $('department_other').value.trim() : '';
      let rawLoc = $('repair_location') ? $('repair_location').value.trim() : '';
      if (rawLoc === '__OTHER__') rawLoc = $('repair_location_other') ? $('repair_location_other').value.trim() : '';
      const inst = $('repair_inst') ? $('repair_inst').value : '';
      const loc = (inst ? `[${inst}] ` : '') + rawLoc;
      const urgency = ''; // Set by Supervisor during approval

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
        
        await backgroundSubmitAndSync(
          { action: 'submit_repair', subject, detail, reporter, file, folderId: REPAIR_DRIVE_FOLDER_ID, urgency, dept, loc, incidentDate: formattedIncidentDate, contact },
          'building', subject, detail, reporter, dept, loc, contact, incidentDate
        );
        
        setBusy(btn, false, '<i class="fa-solid fa-paper-plane"></i> <span>ส่งเรื่องแจ้งซ่อม</span>');
        await alertBox('success', 'สำเร็จ', 'ส่งเรื่องแจ้งซ่อมเรียบร้อยแล้ว', { timer: 2000, showConfirmButton: false });
        $('repairForm').reset();
        nav('page-home');
      } catch (e) {
        setBusy(btn, false, '<i class="fa-solid fa-paper-plane"></i> <span>ส่งเรื่องแจ้งซ่อม</span>');
        alertBox('error', 'ข้อผิดพลาด', e.message || 'ไม่สามารถดำเนินการได้');
      }
    },
    // ฟังก์ชันเก่า (ยังเหลือไว้): ระบบขอยืมอุปกรณ์โสตฯ
    async submitAV() {
      const borrower = $('borrower').value.trim();
      const useDate = $('useDate').value;
      let rawLoc = $('av_location') ? $('av_location').value.trim() : '';
      if (rawLoc === '__OTHER__') rawLoc = $('av_location_other') ? $('av_location_other').value.trim() : '';
      const inst = $('av_inst') ? $('av_inst').value : '';
      const loc = (inst ? `[${inst}] ` : '') + rawLoc;
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
        await backgroundSubmitAndSync(
          { action: 'submit_av', borrower: borrower, equipment: equipmentStr, useDate: useDate, location: loc, signature: signer },
          'av', 'ขอยืม-คืนโสตทัศนูปกรณ์', equipmentStr, borrower, '', loc, '', useDate
        );
        
        setBusy(btn, false, '<i class="fa-solid fa-paper-plane"></i> <span>ยืนยันการขอยืมอุปกรณ์</span>');
        await alertBox('success', 'สำเร็จ', 'ส่งเรื่องขอยืมอุปกรณ์เรียบร้อยแล้ว', { timer: 2000, showConfirmButton: false });
        $('avForm').reset();
        nav('page-home');
      } catch (e) {
        setBusy(btn, false, '<i class="fa-solid fa-paper-plane"></i> <span>ยืนยันการขอยืมอุปกรณ์</span>');
        alertBox('error', 'ข้อผิดพลาด', e.message || 'ไม่สามารถดำเนินการได้');
      }
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
          'proj-total', 'proj-pending', 'proj-progress', 'proj-completed',
          'ratio-building-count', 'ratio-av-count', 'ratio-it-count', 'ratio-project-count',
          'ratio-building-pct', 'ratio-av-pct', 'ratio-it-pct', 'ratio-project-pct',
          'overall-progress-text',
          'b-rating', 'b-rating-count', 'av-rating', 'av-rating-count',
          'it-rating', 'it-rating-count', 'proj-rating', 'proj-rating-count'
        ];
        idsToLoad.forEach(id => {
          if ($(id)) $(id).innerHTML = loadingHtml;
        });

        const monthFilter = $('dashboardMonthFilter') ? $('dashboardMonthFilter').value : '';
        let d = null;
        let bTotal=0, bPending=0, bProgress=0, bCompleted=0;
        let avTotal=0, avPending=0, avActive=0, avCompleted=0;
        let itTotal=0, itPending=0, itProgress=0, itCompleted=0;
        let projTotal=0, projPending=0, projProgress=0, projCompleted=0;

        let bRatingSum=0, bRatingCount=0;
        let avRatingSum=0, avRatingCount=0;
        let itRatingSum=0, itRatingCount=0;
        let projRatingSum=0, projRatingCount=0;

        function classifyTicket(status, tech, type = '') {
          const s = String(status || '').trim();
          const t = String(type || '').toLowerCase();
          if (/ยกเลิก|ไม่อนุมัติ|ปฏิเสธ/.test(s)) return 'cancel';
          if (/เสร็จ|เรียบร้อย|ปิดงาน|คืนเรียบร้อย|คืนอุปกรณ์/.test(s)) return 'done';
          if (t === 'project' && /อนุมัติ/.test(s) && !/^รอ/.test(s)) return 'done';
          if (/กำลัง|รอตรวจรับ|แก้ไข|จัดเตรียมแล้ว|กำลังใช้งาน/.test(s)) return 'progress';
          if (/มอบหมาย|อนุมัติ|รับเรื่องแล้ว|รับงาน|ใช้งานอยู่/.test(s) && !/^รอ/.test(s)) return 'progress';
          if (tech) return 'progress';
          return 'pending';
        }

        let ticketsLoaded = false;
        let firestoreBugCount = null;
        if (!window.firestoreDb && typeof initFirebase === 'function') initFirebase();
        if (window.firestoreDb) {
          try {
            const docs = await getTicketsDocsCachedOrFetch(monthFilter ? 250 : 150);
            if (docs && docs.length > 0) {
              docs.forEach(doc => {
                const data = doc.data;
                if (!data) return;
                
                if (monthFilter && data.createdAt) {
                   const date = typeof data.createdAt.toDate === 'function'
                     ? data.createdAt.toDate()
                     : (data.createdAt.seconds ? new Date(data.createdAt.seconds * 1000) : new Date(data.createdAt));
                   if (!isNaN(date.getTime())) {
                     const mStr = date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0');
                     if (mStr !== monthFilter) return;
                   }
                }
                
                let type = data.type || '';
                const ticketId = data.ticketId || doc.id || '';
                if (!type) {
                  if (ticketId.startsWith('BLD')) type = 'building';
                  else if (ticketId.startsWith('IT')) type = 'it';
                  else if (ticketId.startsWith('AV')) type = 'av';
                  else if (ticketId.startsWith('PRJ')) type = 'project';
                }

                const tech = data.techName || data.tech || '';
                const status = data.status || '';
                const group = classifyTicket(status, tech, type);
                const rating = Number(data.rating) || 0;

                if (type === 'building') {
                  bTotal++;
                  if (group === 'pending') bPending++;
                  else if (group === 'progress') bProgress++;
                  else if (group === 'done') bCompleted++;
                  if (rating > 0) { bRatingSum += rating; bRatingCount++; }
                } else if (type === 'it') {
                  itTotal++;
                  if (group === 'pending') itPending++;
                  else if (group === 'progress') itProgress++;
                  else if (group === 'done') itCompleted++;
                  if (rating > 0) { itRatingSum += rating; itRatingCount++; }
                } else if (type === 'av') {
                  avTotal++;
                  if (group === 'pending') avPending++;
                  else if (group === 'progress') avActive++;
                  else if (group === 'done') avCompleted++;
                  if (rating > 0) { avRatingSum += rating; avRatingCount++; }
                } else if (type === 'project') {
                  projTotal++;
                  if (group === 'pending') projPending++;
                  else if (group === 'progress') projProgress++;
                  else if (group === 'done') projCompleted++;
                  if (rating > 0) { projRatingSum += rating; projRatingCount++; }
                }
              });
              ticketsLoaded = true;
            }
          } catch (fsErr) {
            console.warn('Firestore tickets fetch fallback note:', fsErr.message);
          }

          // นับจำนวนบั๊กค้างจาก Firestore bug_reports (ลดการพึ่ง legacy get_dashboard)
          try {
            const bugSnap = await (typeof window.withTimeout === 'function'
              ? window.withTimeout(window.firestoreDb.collection('bug_reports').get(), 2000)
              : window.firestoreDb.collection('bug_reports').get());
            if (bugSnap && !bugSnap.empty) {
              let openBugs = 0;
              bugSnap.forEach(doc => {
                const b = doc.data() || {};
                if (!/แก้ไขเรียบร้อย/.test(String(b.status || ''))) openBugs++;
              });
              firestoreBugCount = openBugs;
            }
          } catch (_) { }
        }
        
        if (!ticketsLoaded) {
           d = await ResourceHubCore.dashboard.legacy({ month: monthFilter });
           bTotal = Number(d?.building?.total) || 0; bPending = Number(d?.building?.pending) || 0; bProgress = Number(d?.building?.inProgress) || 0; bCompleted = Number(d?.building?.completed) || 0;
           avTotal = Number(d?.av?.total) || 0; avPending = Number(d?.av?.pending) || 0; avActive = Number(d?.av?.active) || 0; avCompleted = Number(d?.av?.completed) || 0;
           itTotal = Number(d?.it?.total) || 0; itPending = Number(d?.it?.pending) || 0; itProgress = Number(d?.it?.inProgress) || 0; itCompleted = Number(d?.it?.completed) || 0;
           projTotal = Number(d?.proj?.total) || 0; projPending = Number(d?.proj?.pending) || 0; projProgress = Number(d?.proj?.inProgress) || 0; projCompleted = Number(d?.proj?.completed) || 0;
        }

        const totalAll = bTotal + avTotal + itTotal + projTotal;
        const pendingAll = bPending + avPending + itPending + projPending;
        const progressAll = bProgress + avActive + itProgress + projProgress;
        const completedAll = bCompleted + avCompleted + itCompleted + projCompleted;

        // ยอดรวมระบบทั้งหมด
        if ($('dash-total-all')) $('dash-total-all').textContent = totalAll;
        if ($('dash-pending-all')) $('dash-pending-all').textContent = pendingAll;
        if ($('dash-progress-all')) $('dash-progress-all').textContent = progressAll;
        if ($('dash-completed-all')) $('dash-completed-all').textContent = completedAll;

        // อัปเดตแจ้งเตือนที่กระดิ่ง Header ผ่าน NotificationHub (ไม่เขียนทับรายการแจ้งเตือนรายชิ้น)
        const unclearedAll = pendingAll + progressAll;
        const dropdownCount = $('dropdown-overdue-count');
        if (dropdownCount) dropdownCount.textContent = unclearedAll;

        if (window.NotificationHub) {
          if (typeof window.NotificationHub.updateBadge === 'function') window.NotificationHub.updateBadge();
          if (typeof window.NotificationHub.renderList === 'function') window.NotificationHub.renderList();
        }

        // งานซ่อมบำรุงอาคาร
        if ($('b-total')) $('b-total').textContent = bTotal;
        if ($('b-pending')) $('b-pending').textContent = bPending;
        if ($('b-progress')) $('b-progress').textContent = bProgress;
        if ($('b-completed')) $('b-completed').textContent = bCompleted;
        const bAvg = bRatingCount > 0 ? (bRatingSum / bRatingCount).toFixed(1) : (d?.building?.rating?.avg || '0.0');
        if ($('b-rating')) $('b-rating').textContent = bAvg;
        if ($('b-rating-count')) $('b-rating-count').textContent = bRatingCount || d?.building?.rating?.count || '0';

        // งานยืม-คืนโสตฯ
        if ($('av-total')) $('av-total').textContent = avTotal;
        if ($('av-pending')) $('av-pending').textContent = avPending;
        if ($('av-active')) $('av-active').textContent = avActive;
        if ($('av-completed')) $('av-completed').textContent = avCompleted;
        const avAvg = avRatingCount > 0 ? (avRatingSum / avRatingCount).toFixed(1) : (d?.av?.rating?.avg || '0.0');
        if ($('av-rating')) $('av-rating').textContent = avAvg;
        if ($('av-rating-count')) $('av-rating-count').textContent = avRatingCount || d?.av?.rating?.count || '0';

        // งานซ่อมไอที
        if ($('it-total')) $('it-total').textContent = itTotal;
        if ($('it-pending')) $('it-pending').textContent = itPending;
        if ($('it-progress')) $('it-progress').textContent = itProgress;
        if ($('it-completed')) $('it-completed').textContent = itCompleted;
        const itAvg = itRatingCount > 0 ? (itRatingSum / itRatingCount).toFixed(1) : (d?.it?.rating?.avg || '0.0');
        if ($('it-rating')) $('it-rating').textContent = itAvg;
        if ($('it-rating-count')) $('it-rating-count').textContent = itRatingCount || d?.it?.rating?.count || '0';

        // เสนอโครงการ
        if ($('proj-total')) $('proj-total').textContent = projTotal;
        if ($('proj-pending')) $('proj-pending').textContent = projPending;
        if ($('proj-progress')) $('proj-progress').textContent = projProgress;
        if ($('proj-completed')) $('proj-completed').textContent = projCompleted;
        const projAvg = projRatingCount > 0 ? (projRatingSum / projRatingCount).toFixed(1) : (d?.proj?.rating?.avg || '0.0');
        if ($('proj-rating')) $('proj-rating').textContent = projAvg;
        if ($('proj-rating-count')) $('proj-rating-count').textContent = projRatingCount || d?.proj?.rating?.count || '0';

        // สถิติรายงานบั๊ก
        if ($('bug-count')) $('bug-count').textContent = (firestoreBugCount !== null ? firestoreBugCount : (d?.bugs || 0));

        // สัดส่วนกราฟและอัตราความสำเร็จ
        if ($('ratio-building-count')) $('ratio-building-count').textContent = `${bTotal} รายการ`;
        if ($('ratio-av-count')) $('ratio-av-count').textContent = `${avTotal} รายการ`;
        if ($('ratio-it-count')) $('ratio-it-count').textContent = `${itTotal} รายการ`;
        if ($('ratio-project-count')) $('ratio-project-count').textContent = `${projTotal} รายการ`;

        const bPct = totalAll > 0 ? Math.round((bTotal / totalAll) * 100) : 0;
        const avPct = totalAll > 0 ? Math.round((avTotal / totalAll) * 100) : 0;
        const itPct = totalAll > 0 ? Math.round((itTotal / totalAll) * 100) : 0;
        const projPct = totalAll > 0 ? Math.round((projTotal / totalAll) * 100) : 0;

        if ($('ratio-building-bar')) $('ratio-building-bar').style.width = `${bPct}%`;
        if ($('ratio-av-bar')) $('ratio-av-bar').style.width = `${avPct}%`;
        if ($('ratio-it-bar')) $('ratio-it-bar').style.width = `${itPct}%`;
        if ($('ratio-project-bar')) $('ratio-project-bar').style.width = `${projPct}%`;

        if ($('ratio-building-pct')) $('ratio-building-pct').textContent = `${bPct}%`;
        if ($('ratio-av-pct')) $('ratio-av-pct').textContent = `${avPct}%`;
        if ($('ratio-it-pct')) $('ratio-it-pct').textContent = `${itPct}%`;
        if ($('ratio-project-pct')) $('ratio-project-pct').textContent = `${projPct}%`;

        const completedPct = totalAll > 0 ? Math.round((completedAll / totalAll) * 100) : 0;
        if ($('overall-progress-bar')) $('overall-progress-bar').style.width = `${completedPct}%`;
        if ($('overall-progress-text')) $('overall-progress-text').textContent = `${completedPct}%`;

        // กราฟวงกลม (Doughnut Chart)
        const ctx = document.getElementById('dashboardChart');
        if (ctx && typeof Chart !== 'undefined') {
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
                legend: { position: 'bottom', labels: { font: { family: 'Prompt' }, usePointStyle: true, padding: 15 } }
              }
            }
          });
        }

      } catch (e) { console.error('Error loading dashboard stats:', e); }
    }
  }
};

// ==========================================
// 👑 ระบบสนับสนุนแดชบอร์ดผู้บริหาร (Executive Dashboard Helpers)
// ==========================================
window.loadExecutivePendingProjects = async function() {
  const container = document.getElementById('exec-pending-projects-list');
  const badge = document.getElementById('exec-pending-proj-badge');
  if (!container) return;

  try {
    let pendingList = [];
    if (window.firestoreDb) {
      const snap = await window.firestoreDb.collection('tickets')
        .where('type', '==', 'project')
        .get();
      snap.forEach(doc => {
        const d = doc.data();
        const tid = d.ticketId || doc.id;
        const status = d.status || '';
        // รายการที่ยังไม่ได้รับการอนุมัติ / รอพิจารณา (แยก 'รอพิจารณาอนุมัติ' ออกจาก 'อนุมัติแล้ว')
        const s = String(status || '').trim();
        const isApproved = /อนุมัติ/.test(s) && !/^รอ/.test(s);
        const isClosed = /เสร็จ|ปิดงาน|ยกเลิก|ไม่อนุมัติ|ปฏิเสธ/.test(s);
        if (!isApproved && !isClosed) {
          pendingList.push({ id: tid, ...d });
        }
      });
    }

    if (badge) badge.textContent = `${pendingList.length} รายการ`;

    if (pendingList.length === 0) {
      container.innerHTML = `
        <div class="bg-white/10 backdrop-blur-md rounded-2xl p-6 text-center border border-white/15">
          <div class="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-xl mx-auto mb-2 shadow-inner">
            <i class="fa-solid fa-circle-check"></i>
          </div>
          <h4 class="text-sm font-bold text-white">ไม่มีโครงการรอการอนุมัติในขณะนี้</h4>
          <p class="text-xs text-purple-200/80 mt-1">ทุกโครงการได้รับการพิจารณาและลงนามเรียบร้อยแล้ว</p>
        </div>
      `;
      return;
    }

    container.innerHTML = pendingList.map(proj => {
      const subject = proj.subject || proj.title || 'โครงการปรับปรุงและจัดซื้อ';
      const budget = proj.budget || proj.allocatedBudget || proj.cost || proj.estimatedBudget || '-';
      const budgetNum = Number(budget);
      const budgetText = (budget && budget !== '-' && !isNaN(budgetNum)) ? `${budgetNum.toLocaleString()} บาท` : 'ตามเสนอ';
      const reporter = proj.reporterName || proj.reporter || proj.proposer || 'ไม่ระบุ';
      const location = proj.location || 'สถานที่ตามเอกสารแนบ';
      const safeTid = sanitizeHtml(proj.id || '');

      return `
        <div class="bg-white text-slate-800 rounded-2xl p-4 md:p-5 shadow-sm border border-purple-200/60 hover:shadow-md transition flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div class="flex items-start gap-3.5">
            <div class="w-10 h-10 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center text-lg shrink-0 mt-0.5 shadow-inner">
              <i class="fa-solid fa-file-signature"></i>
            </div>
            <div>
              <div class="flex items-center gap-2 flex-wrap mb-1">
                <span class="text-xs font-black text-violet-700 bg-violet-100 px-2 py-0.5 rounded-lg tracking-wide">${safeTid}</span>
                <span class="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                  <span class="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block mr-1"></span>รอพิจารณาอนุมัติ
                </span>
                <span class="text-xs text-slate-500 font-normal">งบประมาณ: <strong class="text-slate-800 font-bold">${sanitizeHtml(budgetText)}</strong></span>
              </div>
              <h4 class="text-sm md:text-base font-bold text-slate-900">${sanitizeHtml(subject)}</h4>
              <p class="text-xs text-slate-500 mt-1 flex items-center gap-2 flex-wrap">
                <span><i class="fa-solid fa-user-pen text-slate-400 mr-1"></i>ผู้เสนอ: <strong>${sanitizeHtml(reporter)}</strong></span>
                <span>•</span>
                <span><i class="fa-solid fa-location-dot text-slate-400 mr-1"></i>${sanitizeHtml(location)}</span>
              </p>
            </div>
          </div>

          <div class="flex items-center gap-2 shrink-0">
            <button type="button" data-tid="${safeTid}" onclick="if(window.TrackUI) window.TrackUI.open(this.dataset.tid)" class="bg-violet-600 hover:bg-violet-700 active:scale-95 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-1.5">
              <i class="fa-solid fa-magnifying-glass text-xs"></i> <span>ตรวจสอบและลงนาม</span>
            </button>
          </div>
        </div>
      `;
    }).join('');

  } catch (err) {
    console.error('Error loading pending projects for executive:', err);
    container.innerHTML = `
      <div class="text-center py-4 text-purple-200 text-xs">
        <i class="fa-solid fa-triangle-exclamation text-amber-300 mr-1"></i>ไม่สามารถโหลดรายการโครงการได้ในขณะนี้
      </div>
    `;
  }
};

window.refreshExecutiveDashboard = async function() {
  const icon = document.getElementById('exec-refresh-icon');
  if (icon) icon.classList.add('fa-spin');
  try {
    await ResourceHubCore.ui.loadDashboard();
    await window.loadExecutivePendingProjects();
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: 'อัปเดตข้อมูลภาพรวมเรียบร้อย',
      showConfirmButton: false,
      timer: 1500
    });
  } catch(e) {
    console.error(e);
  } finally {
    if (icon) icon.classList.remove('fa-spin');
  }
};

window.toggleExecutiveHomeView = function(viewMode) {
  if (viewMode === 'form') {
    document.getElementById('home-executive-view')?.classList.add('hidden');
    document.getElementById('home-regular-view')?.classList.remove('hidden');
  } else {
    document.getElementById('home-regular-view')?.classList.add('hidden');
    document.getElementById('home-executive-view')?.classList.remove('hidden');
    ResourceHubCore.ui.loadDashboard();
    window.loadExecutivePendingProjects();
  }
};

const post = data => ResourceHubCore.api.post(data);
const get = (action, params = {}) => ResourceHubCore.api.get(action, params);
// =========================================================
// prefetchAllData: ดึงข้อมูลสำคัญทั้งหมดพร้อมกันในครั้งเดียว (parallel)
// เรียกใช้หลัง login สำเร็จ เพื่อให้ข้อมูลอยู่ใน cache
// พอเปิดหน้า Dashboard จะได้เร็วทันที ไม่ต้องรอโหลดซ้ำ
// =========================================================
function prefetchAllData() {
  // ยกเลิกการดึงข้อมูลพร้อมกันตอนล็อกอิน (Lazy Loading) 
  // เพื่อแก้ปัญหา Google Sheets ค้าง 34 วินาที
  console.log('%c⚡ Lazy Loading Enabled: ข้อมูลจะถูกดึงเมื่อเปิดหน้านั้นๆ', 'color:#3b82f6;font-weight:bold');
}

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
    const type = params.get('type') || '';
    const row = params.get('row') || '';
    const surveyTicketId = params.get('ticketId') || '';
    if (surveyTicketId || (type && row)) {
      setTimeout(() => openSurveyModal(type, row, surveyTicketId), 1500); // Wait for initialization
    }
  }

  // Check for ticketId parameter (Direct Link from LINE Flex Message)
  const ticketIdParam = params.get('ticketId');
  if (ticketIdParam) {
    const tryOpenTicket = (retry = 0) => {
      if (window.TrackUI && typeof window.TrackUI.open === 'function') {
        if (typeof window.TrackUI.load === 'function' && typeof window.TrackUI.isLoaded === 'function' && !window.TrackUI.isLoaded()) {
          window.TrackUI.load();
        }
        window.TrackUI.open(ticketIdParam);
      } else if (retry < 25) {
        setTimeout(() => tryOpenTicket(retry + 1), 200);
      }
    };
    setTimeout(tryOpenTicket, 200);
  }

  // Check for page parameter (Direct Link to a specific page e.g. page=track)
  const pageParam = params.get('page');
  if (pageParam && !ticketIdParam) {
    const tryOpenPage = (retry = 0) => {
      if (typeof nav === 'function') {
        nav('page-' + pageParam.replace(/^page-/, ''));
      } else if (retry < 25) {
        setTimeout(() => tryOpenPage(retry + 1), 200);
      }
    };
    setTimeout(tryOpenPage, 200);
  }

  if (LIFF_ID && LIFF_ID !== "ใส่_LIFF_ID_ที่นี่") {
    liff.init({ liffId: LIFF_ID }).then(() => {
      if (liff.isLoggedIn()) {
        if (!localStorage.getItem('logged_teacher')) {
          handleLiffLogin();
        } else {
          // ถ้ามี ticketId ใน URL ไม่ต้องเด้งหนี ให้เปิดดูงานนั้นตรงๆ
          const urlParams = new URLSearchParams(window.location.search);
          if (!urlParams.get('ticketId')) {
            // ไม่ว่าจะแอดมินหรือครู ให้ไปหน้าแรก (Home) เสมอ
            nav('page-home');
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
        isAdminLoggedIn = (res.role === 'Admin' || res.role === 'Supervisor');

        window.currentTeacher = currentTeacher;
        window.currentRole = currentRole;
        window.currentEmail = currentEmail;

        localStorage.setItem('logged_teacher', currentTeacher);
        localStorage.setItem('logged_role', currentRole);
        localStorage.setItem('logged_email', currentEmail);
        if (isAdminLoggedIn) localStorage.setItem('logged_admin', 'true');
        else localStorage.removeItem('logged_admin');
        localStorage.setItem('session_login_time', Date.now().toString());

        updateSessionUI();
        if (typeof NotificationHub !== 'undefined') {
          if (typeof NotificationHub.refreshTokenProfile === 'function') NotificationHub.refreshTokenProfile();
          if (typeof NotificationHub.updatePermissionUI === 'function') NotificationHub.updatePermissionUI();
        }
        // ดึงข้อมูลหลักใน background ทันที เพื่อให้ Dashboard โหลดเร็วขึ้น
        if (isAdminLoggedIn) prefetchAllData();
        alertBox('success', 'เข้าสู่ระบบสำเร็จ', `เชื่อมโยง LINE ID เรียบร้อย ยินดีต้อนรับ คุณ ${currentTeacher}`, { timer: 1500, showConfirmButton: false })
          .then(() => {
            const urlParams = new URLSearchParams(window.location.search);
            const tid = urlParams.get('ticketId');
            if (tid) {
              if (window.TrackUI && typeof window.TrackUI.open === 'function') {
                window.TrackUI.open(tid);
              }
            } else {
              // ให้ไปหน้าแรก (Home) เสมอ
              nav('page-home');
            }
          });
      })
      .catch((e) => {
        alertBox('error', 'เข้าสู่ระบบไม่สำเร็จ', e.message || 'ไม่พบอีเมลในระบบ');
        if (typeof liff !== 'undefined' && typeof liff.isLoggedIn === 'function' && liff.isLoggedIn()) {
          try { liff.logout(); } catch (_) {}
        }
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

// ฟังก์ชันถอดรหัส Google JWT Token ฝั่ง Client
function parseGoogleJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const parsed = JSON.parse(jsonPayload);

    // 🔒 SEC-07: ตรวจสอบความถูกต้องของ JWT Payload
    const expectedAudience = '309538362014-2mn08g13ht4rnjj9e8j52r5c7204lsqu.apps.googleusercontent.com';
    if (parsed.aud && parsed.aud !== expectedAudience) {
      console.warn('Google JWT Audience mismatch:', parsed.aud);
      return null;
    }
    if (parsed.iss && !parsed.iss.includes('accounts.google.com')) {
      console.warn('Google JWT Issuer mismatch:', parsed.iss);
      return null;
    }
    if (parsed.exp && parsed.exp * 1000 < Date.now()) {
      console.warn('Google JWT has expired');
      return null;
    }
    return parsed;
  } catch (e) {
    console.error('Failed to parse Google JWT:', e);
    return null;
  }
}

// ตัวช่วย Timeout ป้องกัน Network Hang
function withTimeout(promise, ms = 4000) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('Network_Timeout')), ms))
  ]);
}


// ฟังก์ชันโหลดและแคชผู้ใช้จาก Firebase โดยตรง (100% Firebase First)
async function ensureCachedUsers() {
  if (window.cachedUsers && Array.isArray(window.cachedUsers) && window.cachedUsers.length > 0) {
    return window.cachedUsers;
  }
  try {
    const raw = localStorage.getItem('cached_system_users');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        window.cachedUsers = parsed;
        return window.cachedUsers;
      }
    }
  } catch (_) {}

  if (window.firestoreDb) {
    try {
      const snap = await withTimeout(window.firestoreDb.collection('users').get(), 3500);
      if (snap && !snap.empty) {
        const users = [];
        snap.forEach(doc => {
          const d = doc.data() || {};
          users.push([
            (d.email || doc.id || '').trim(),
            (d.name || '').trim(),
            (d.role || 'Teacher').trim(),
            (d.status || 'approved').trim(),
            (d.picture || '').trim(),
            d.lastLogin || ''
          ]);
        });
        window.cachedUsers = users;
        try { localStorage.setItem('cached_system_users', JSON.stringify(users)); } catch (_) {}
        return window.cachedUsers;
      }
    } catch (e) {
      console.warn('ensureCachedUsers Firestore error:', e);
    }
  }
  window.cachedUsers = window.cachedUsers || [];
  return window.cachedUsers;
}
window.ensureCachedUsers = ensureCachedUsers;

async function handleCredentialResponse(response) {
  Swal.fire({
    title: 'กำลังเข้าสู่ระบบ...',
    text: 'กรุณารอสักครู่ กำลังตรวจสอบสิทธิ์และบันทึกข้อมูล',
    allowOutsideClick: false,
    didOpen: () => Swal.showLoading()
  });

  try {
    if (!response || !response.credential) {
      throw new Error('ไม่พบข้อมูลการเข้าสู่ระบบจาก Google');
    }

    // 1. ถอดรหัส Google ID Token เพื่อได้ email, name, picture
    const googleUser = parseGoogleJwt(response.credential);
    if (!googleUser || !googleUser.email) {
      throw new Error('ไม่สามารถอ่านข้อมูลบัญชี Google ได้');
    }

    window.currentGoogleIdToken = response.credential;
    try { sessionStorage.setItem('facility_google_id_token', response.credential); } catch (_) {}

    // 1.5 เชื่อมต่อ Firebase Authentication (signInWithCredential) เพื่อใช้สิทธิ์ firestore.rules
    if (!window.firestoreDb && typeof initFirebase === 'function') initFirebase();
    if (typeof firebase !== 'undefined' && firebase.auth && firebase.auth.GoogleAuthProvider) {
      try {
        const authInst = window.firebaseAuth || (typeof firebaseAuth !== 'undefined' ? firebaseAuth : firebase.auth());
        if (authInst && typeof authInst.signInWithCredential === 'function') {
          const firebaseCred = firebase.auth.GoogleAuthProvider.credential(response.credential);
          await withTimeout(authInst.signInWithCredential(firebaseCred), 5000);
        }
      } catch (authErr) {
        console.warn('Firebase signInWithCredential note:', authErr && authErr.code ? authErr.code : authErr);
        if (authErr && authErr.code === 'auth/user-disabled') {
          throw new Error('บัญชีของคุณถูกระงับการใช้งาน กรุณาติดต่อผู้ดูแลระบบ');
        }
      }
    }

    const email = googleUser.email.toLowerCase().trim();
    let name = googleUser.name || email.split('@')[0];
    let picture = googleUser.picture || '';
    let role = 'Teacher';
    let status = 'approved';

    // 2. ตรวจสอบสิทธิ์โดยตรงจาก Firebase Firestore (Single Source of Truth 100% ไม่พึ่งพา Sheet)
    if (window.firestoreDb) {
      try {
        const userDoc = await withTimeout(
          window.firestoreDb.collection('users').doc(email).get(),
          4000
        );

        if (userDoc && userDoc.exists) {
          const uData = userDoc.data() || {};
          name = uData.name || name;
          role = uData.role || 'Teacher';
          status = uData.status || 'approved';
          picture = uData.picture || picture;

          // อัปเดตเฉพาะ lastLogin (ห้ามเขียนทับ role หรือ status ใน Firestore เด็ดขาด)
          window.firestoreDb.collection('users').doc(email).update({
            lastLogin: (typeof firebase !== 'undefined' && firebase.firestore && firebase.firestore.FieldValue)
              ? firebase.firestore.FieldValue.serverTimestamp()
              : new Date()
          }).catch(e => console.warn('Update lastLogin error:', e));

        } else {
          // ผู้ใช้เข้าใช้งานครั้งแรก: บันทึกลง Firestore ทันที เริ่มต้นที่บทบาท Teacher และสถานะ approved
          role = 'Teacher';
          status = 'approved';
          const newUser = {
            email: email,
            name: name,
            role: role,
            status: status,
            picture: picture,
            createdAt: (typeof firebase !== 'undefined' && firebase.firestore && firebase.firestore.FieldValue)
              ? firebase.firestore.FieldValue.serverTimestamp()
              : new Date(),
            lastLogin: (typeof firebase !== 'undefined' && firebase.firestore && firebase.firestore.FieldValue)
              ? firebase.firestore.FieldValue.serverTimestamp()
              : new Date()
          };
          await withTimeout(
            window.firestoreDb.collection('users').doc(email).set(newUser),
            4000
          );
        }
      } catch (fsErr) {
        console.warn('Firestore user auth warning:', fsErr);
      }
    }

    // 3. ตรวจสอบสถานะการระงับบัญชี (ตามข้อมูลจาก Firestore)
    if (status === 'banned') {
      throw new Error('บัญชีของคุณถูกระงับการใช้งาน กรุณาติดต่อผู้ดูแลระบบ');
    }
    if (status !== 'approved' && status !== 'success') {
      throw new Error('บัญชีของคุณกำลังรอการอนุมัติสิทธิ์เข้าใช้งาน');
    }

    // 4. ส่งข้อมูลไปสำรองที่ Google Sheets ในเบื้องหลัง (Fire-and-forget ทางเดียว ไม่รอ และไม่นำข้อมูลจาก Sheet มาทับ Firebase)
    try {
      ResourceHubCore.api.post({ action: 'google_login', credential: response.credential })
        .catch(e => console.warn('Background Sheets backup note:', e));
    } catch (_) {}

    // 5. อัปเดตแคชผู้ใช้ในเครื่องทันที
    if (window.cachedUsers && Array.isArray(window.cachedUsers)) {
      const existingIdx = window.cachedUsers.findIndex(u => (u[0] || '').toLowerCase() === email);
      if (existingIdx >= 0) {
        window.cachedUsers[existingIdx][1] = name;
        window.cachedUsers[existingIdx][2] = role;
        window.cachedUsers[existingIdx][3] = status;
        window.cachedUsers[existingIdx][4] = picture;
        window.cachedUsers[existingIdx][5] = new Date().toISOString();
      } else {
        window.cachedUsers.push([email, name, role, status, picture, new Date().toISOString()]);
      }
      try { localStorage.setItem('cached_system_users', JSON.stringify(window.cachedUsers)); } catch(e) {}
    }

    // 6. เข้าสู่ระบบสำเร็จทันที! (เร็วระดับเสี้ยววินาที)
    finalizeLogin(name, role, email);

  } catch (error) {
    console.error('Login error:', error);
    alertBox('error', 'เข้าสู่ระบบไม่สำเร็จ', error.message || 'เกิดข้อผิดพลาดในการตรวจสอบสิทธิ์');
  }
}

function finalizeLogin(name, role, email) {
  currentTeacher = name;
  currentRole = role;
  currentEmail = email || '';
  isAdminLoggedIn = (role === 'Admin' || role === 'Supervisor');

  window.currentTeacher = currentTeacher;
  window.currentRole = currentRole;
  window.currentEmail = currentEmail;

  localStorage.setItem('logged_teacher', currentTeacher);
  localStorage.setItem('logged_role', currentRole);
  localStorage.setItem('logged_email', currentEmail);
  if (isAdminLoggedIn) localStorage.setItem('logged_admin', 'true');
  else localStorage.removeItem('logged_admin');
  localStorage.setItem('session_login_time', Date.now().toString());

  updateSessionUI();
  // ดึงข้อมูลหลักใน background ทันที เพื่อให้ Dashboard โหลดเร็วขึ้น
  if (isAdminLoggedIn) prefetchAllData();

  if (window.NotificationHub) {
    if (typeof window.NotificationHub.init === 'function') {
      window.NotificationHub.init();
    }
    if (typeof window.NotificationHub.refreshTokenProfile === 'function') {
      window.NotificationHub.refreshTokenProfile();
    }
    if (typeof window.NotificationHub.renderList === 'function') {
      window.NotificationHub.renderList();
      window.NotificationHub.updateBadge();
    }
  }
  
  alertBox('success', 'เข้าสู่ระบบสำเร็จ', `ยินดีต้อนรับ คุณ ${currentTeacher}`, { timer: 1500, showConfirmButton: false })
    .then(() => {
      const urlParams = new URLSearchParams(window.location.search);
      const tid = urlParams.get('ticketId');
      if (tid) {
        if (window.TrackUI && typeof window.TrackUI.open === 'function') {
          window.TrackUI.open(tid);
        }
      } else {
        nav('page-home');
      }
    });
}

function handleGlobalLogout() {
  localStorage.removeItem('logged_teacher');
  localStorage.removeItem('logged_admin');
  localStorage.removeItem('logged_email');
  localStorage.removeItem('logged_role');
  localStorage.removeItem('session_login_time');
  localStorage.removeItem('local_dev_bypass');
  try { sessionStorage.removeItem('facility_google_id_token'); } catch (_) {}
  window.currentGoogleIdToken = '';
  try {
    const authInst = window.firebaseAuth || (typeof firebase !== 'undefined' && typeof firebase.auth === 'function' ? firebase.auth() : null);
    if (authInst && typeof authInst.signOut === 'function') {
      authInst.signOut().catch(() => {});
    }
  } catch (_) {}
  const silent = Boolean(arguments[0] && arguments[0].silent);
  currentTeacher = null;
  currentEmail = '';
  currentRole = '';
  isAdminLoggedIn = false;
  window.currentTeacher = null;
  window.currentEmail = '';
  window.currentRole = '';
  if (window.NotificationHub) {
    if (typeof window.NotificationHub.unregisterFCMProfile === 'function') {
      window.NotificationHub.unregisterFCMProfile();
    }
    if (typeof window.NotificationHub.stopListeners === 'function') {
      window.NotificationHub.stopListeners();
    }
  }
  if (window.TrackUI && typeof window.TrackUI.stopListeners === 'function') {
    window.TrackUI.stopListeners();
  }
  if ($('home-regular-view')) $('home-regular-view').classList.remove('hidden');
  if ($('home-executive-view')) $('home-executive-view').classList.add('hidden');
  updateSessionUI();
  if (!silent) {
    alertBox('info', 'ออกจากระบบเรียบร้อย', '', { timer: 1000, showConfirmButton: false });
  }
  nav('page-auth');
}

// โหลดบทบาท (role) และสถานะ (status) สดจาก Firestore users/{email} ทุกครั้งที่เปิดหน้าเว็บ
async function syncSessionUserFromFirestore() {
  try {
    const savedEmail = String(currentEmail || localStorage.getItem('logged_email') || '').trim().toLowerCase();
    if (!savedEmail) return null;

    const authInst = window.firebaseAuth || (typeof firebase !== 'undefined' && typeof firebase.auth === 'function' ? firebase.auth() : null);
    const isLocalHost = ['localhost', '127.0.0.1'].includes(window.location.hostname);
    const isLocalBypass = isLocalHost && localStorage.getItem('local_dev_bypass') === '1' && !(authInst && authInst.currentUser);
    if (isLocalBypass) {
      return { email: savedEmail, role: currentRole, status: 'approved', localBypass: true };
    }

    if (!window.firestoreDb && typeof initFirebase === 'function') initFirebase();
    if (!window.firestoreDb) return null;

    const userDoc = await withTimeout(window.firestoreDb.collection('users').doc(savedEmail).get(), 4500);
    if (!userDoc || !userDoc.exists) return null;

    const uData = userDoc.data() || {};
    const freshRole = String(uData.role || 'Teacher').trim() || 'Teacher';
    const freshStatus = String(uData.status || 'approved').trim();
    const freshName = String(uData.name || currentTeacher || '').trim() || currentTeacher;

    if (freshStatus === 'banned' || (freshStatus !== 'approved' && freshStatus !== 'success')) {
      handleGlobalLogout({ silent: true });
      alertBox('error', 'ไม่สามารถใช้งานต่อได้', freshStatus === 'banned' ? 'บัญชีของคุณถูกระงับการใช้งาน กรุณาติดต่อผู้ดูแลระบบ' : 'บัญชีของคุณกำลังรอการอนุมัติสิทธิ์เข้าใช้งาน');
      return { email: savedEmail, role: freshRole, status: freshStatus };
    }

    const changed = (freshRole !== currentRole || freshName !== currentTeacher);
    currentTeacher = freshName;
    currentRole = freshRole;
    currentEmail = savedEmail;
    isAdminLoggedIn = (freshRole === 'Admin' || freshRole === 'Supervisor');

    window.currentTeacher = currentTeacher;
    window.currentRole = currentRole;
    window.currentEmail = currentEmail;

    localStorage.setItem('logged_teacher', currentTeacher);
    localStorage.setItem('logged_role', currentRole);
    localStorage.setItem('logged_email', currentEmail);
    if (isAdminLoggedIn) localStorage.setItem('logged_admin', 'true');
    else localStorage.removeItem('logged_admin');

    if (changed) {
      updateSessionUI();
    } else if (window.NotificationHub && typeof window.NotificationHub.updatePermissionUI === 'function') {
      window.NotificationHub.updatePermissionUI();
    }
    return { email: savedEmail, role: freshRole, status: freshStatus };
  } catch (err) {
    const code = err && err.code ? String(err.code) : '';
    const authInst = window.firebaseAuth || null;
    if ((code === 'permission-denied' || code.includes('permission')) && authInst && !authInst.currentUser) {
      handleGlobalLogout({ silent: true });
      alertBox('info', 'อัปเดตระบบความปลอดภัย', 'กรุณาเข้าสู่ระบบด้วย Google ใหม่อีกครั้งเพื่อเชื่อมต่อสิทธิ์ Firebase Auth ครับ');
    } else {
      console.warn('syncSessionUserFromFirestore note:', err && err.message ? err.message : err);
    }
    return null;
  }
}
window.syncSessionUserFromFirestore = syncSessionUserFromFirestore;

// ==========================================
// 9. ระบบนำทางและการสลับหน้าจอ (Navigation & Routing)
// ==========================================
// ฟังก์ชันสำหรับเปลี่ยนหน้า (โดยการซ่อน-แสดง div ตาม ID)
function nav(pageId) {
  if (!currentTeacher && !isAdminLoggedIn && pageId !== 'page-auth' && pageId !== 'page-track-detail' && pageId !== 'page-track') {
    alertBox('warning', 'ต้องเข้าสู่ระบบก่อน', 'กรุณาเข้าสู่ระบบก่อนใช้งานเมนูนี้ครับ');
    return nav('page-auth');
  }

  // ป้องกันหน้าขาว: ถ้าเข้าหน้าจัดการงานเดิมหรือส่วนจัดการรวม ให้เปิดระบบติดตามงาน TrackUI ตรงหมวดทันที
  const legacyTrackMap = {
    'page-fb-admin': { type: 'all' },
    'page-technician': { type: 'building' },
    'page-av-manage': { type: 'av' },
    'page-it-manage': { type: 'it' },
    'page-av-repair-manage': { type: 'av' },
    'page-project-manage': { type: 'project' }
  };
  if (legacyTrackMap[pageId] && window.TrackUI && typeof window.TrackUI.show === 'function') {
    return window.TrackUI.show(legacyTrackMap[pageId]);
  }

  $$('.page-section').forEach(e => e.classList.remove('active'));
  if ($(pageId)) $(pageId).classList.add('active');
  window.scrollTo(0, 0);

  if (pageId === 'page-auth') {
    if (typeof checkLineOrWebView === 'function') checkLineOrWebView();
    if (typeof checkLocalhostDev === 'function') checkLocalhostDev();
    if (typeof renderGoogleSignInButton === 'function') renderGoogleSignInButton();
  }

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
  if (pageId === 'page-user-manage') {
    if (typeof fetchUsers === 'function') fetchUsers();
  }

  if (pageId === 'page-home') {
    if (currentRole === 'Executive') {
      if ($('home-regular-view')) $('home-regular-view').classList.add('hidden');
      if ($('home-executive-view')) $('home-executive-view').classList.remove('hidden');
      if ($('exec-user-name')) $('exec-user-name').textContent = currentTeacher || 'ผู้บริหาร (Executive)';
      if ($('exec-live-clock')) {
        const now = new Date();
        $('exec-live-clock').textContent = now.toLocaleDateString('th-TH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      }
      ResourceHubCore.ui.loadDashboard();
      if (typeof window.loadExecutivePendingProjects === 'function') {
        window.loadExecutivePendingProjects();
      }
    } else {
      if ($('home-regular-view')) $('home-regular-view').classList.remove('hidden');
      if ($('home-executive-view')) $('home-executive-view').classList.add('hidden');
    }
  } else if (pageId === 'page-dashboard') {
    // ซ่อนหน้านี้ไว้ชั่วคราวตามที่แจ้ง (ยังไม่ลบ) ให้กลับไปหน้าแรกแทน
    nav('page-home');
    return;
  } else if (pageId === 'page-teacher-profile') {
    ResourceHubCore.ui.loadTeacherHistory('repair');
  } else if (pageId === 'page-teacher-av-profile') {
    ResourceHubCore.ui.loadTeacherHistory('av');
  } else if (pageId === 'page-master-data') {
    loadMasterData();
  } else if (pageId === 'page-document') {
    loadDocuments();
  } else if (pageId === 'page-bug-manage') {
    loadBugAdmin();
  }

  if (currentTeacher) {
    if ($('reporter')) $('reporter').value = currentTeacher;
    if ($('borrower')) $('borrower').value = currentTeacher;
    if ($('signerName')) $('signerName').value = currentTeacher;
    if ($('itReporter')) $('itReporter').value = currentTeacher;
    if ($('avRepReporter')) $('avRepReporter').value = currentTeacher;
    if ($('projReporter')) $('projReporter').value = currentTeacher;
  }

  // เรียกผูกตัวเลือก Master Data Dropdown และซิงก์ข้อมูลล่าสุดเมื่อเปิดหน้าแบบฟอร์ม
  const formPages = ['page-repair-form', 'page-it-repair', 'page-av-repair', 'page-av-form', 'page-project-form'];
  if (formPages.includes(pageId) && window.MasterData) {
    if (typeof window.MasterData.initFormDropdowns === 'function') {
      window.MasterData.initFormDropdowns();
    }
    if (typeof window.MasterData.load === 'function') {
      window.MasterData.load(false);
    }
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

  if (currentRole === 'Executive') {
    // ผู้บริหาร: เข้ามาดูภาพรวมทั้งหมด และอนุมัติเฉพาะโครงการใหญ่ (ซ่อนเมนูช่างและเมนูตั้งค่าระบบหลังบ้าน)
    if (dashNav) { dashNav.classList.add('hidden'); dashNav.classList.remove('flex'); }
    if (techNav) { techNav.classList.add('hidden'); techNav.classList.remove('flex'); }
    if (avManageNav) { avManageNav.classList.add('hidden'); avManageNav.classList.remove('flex'); }
    if (masterDataNav) { masterDataNav.classList.add('hidden'); masterDataNav.classList.remove('flex'); }
    if ($('gnav-bug-manage')) { $('gnav-bug-manage').classList.add('hidden'); $('gnav-bug-manage').classList.remove('flex'); }
    if ($('gnav-user-manage')) { $('gnav-user-manage').classList.add('hidden'); $('gnav-user-manage').classList.remove('flex'); }
    if ($('gnav-it-manage')) { $('gnav-it-manage').classList.add('hidden'); $('gnav-it-manage').classList.remove('flex'); }
    if ($('gnav-av-repair-manage')) { $('gnav-av-repair-manage').classList.add('hidden'); $('gnav-av-repair-manage').classList.remove('flex'); }
    if ($('gnav-project-manage')) { $('gnav-project-manage').classList.add('hidden'); $('gnav-project-manage').classList.remove('flex'); }

    if (docNav) { docNav.classList.remove('hidden'); docNav.classList.add('flex'); }
    if (homeCardDocument) { homeCardDocument.classList.remove('hidden'); homeCardDocument.classList.add('flex'); }
    if (teacherProfileNav) { teacherProfileNav.classList.remove('hidden'); teacherProfileNav.classList.add('flex'); }
    if (teacherAVProfileNav) { teacherAVProfileNav.classList.remove('hidden'); teacherAVProfileNav.classList.add('flex'); }
    if (homeCardDash) { homeCardDash.classList.add('hidden'); homeCardDash.classList.remove('flex'); }
    if (homeCardTeacherProfile) { homeCardTeacherProfile.classList.remove('hidden'); homeCardTeacherProfile.classList.add('flex'); }
    if (homeCardTeacherAVProfile) { homeCardTeacherAVProfile.classList.remove('hidden'); homeCardTeacherAVProfile.classList.add('flex'); }

    if ($('home-card-it-repair')) { $('home-card-it-repair').classList.remove('hidden'); $('home-card-it-repair').classList.add('flex'); }
    if ($('home-card-av-repair')) { $('home-card-av-repair').classList.remove('hidden'); $('home-card-av-repair').classList.add('flex'); }
    if ($('home-card-project')) { $('home-card-project').classList.remove('hidden'); $('home-card-project').classList.add('flex'); }

    // หน้าแรกของผู้บริหาร: แสดง Executive Dashboard
    if ($('home-regular-view')) $('home-regular-view').classList.add('hidden');
    if ($('home-executive-view')) $('home-executive-view').classList.remove('hidden');

    if ($('exec-user-name')) {
      $('exec-user-name').textContent = currentTeacher || 'ผู้บริหาร (Executive)';
    }
    if ($('exec-live-clock')) {
      const now = new Date();
      $('exec-live-clock').textContent = now.toLocaleDateString('th-TH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    }

    // โหลดข้อมูล Dashboard และโครงการรออนุมัติทันที
    ResourceHubCore.ui.loadDashboard();
    if (typeof window.loadExecutivePendingProjects === 'function') {
      window.loadExecutivePendingProjects();
    }

    // เมนูหลักที่เปิดให้ผู้บริหารเข้าดู
    if (basicNavHome) { basicNavHome.classList.remove('hidden'); basicNavHome.classList.add('flex'); }
    if (basicNavRepair) { basicNavRepair.classList.remove('hidden'); basicNavRepair.classList.add('flex'); }
    if (basicNavAV) { basicNavAV.classList.remove('hidden'); basicNavAV.classList.add('flex'); }
    if (basicNavItRepair) { basicNavItRepair.classList.remove('hidden'); basicNavItRepair.classList.add('flex'); }
    if (basicNavAvRepair) { basicNavAvRepair.classList.remove('hidden'); basicNavAvRepair.classList.add('flex'); }
    if (basicNavProject) { basicNavProject.classList.remove('hidden'); basicNavProject.classList.add('flex'); }
    if (basicNavCreateBtn) { basicNavCreateBtn.classList.remove('hidden'); }

    if ($('dropdown-user-name')) {
      $('dropdown-user-name').textContent = 'ผู้บริหาร (Executive)';
    }
    if ($('dropdown-user-role')) {
      $('dropdown-user-role').innerHTML = `สถานะ: ผู้บริหาร${currentEmail ? `<br><span class="text-[10px] text-slate-400 font-normal mt-0.5 block break-all"><i class="fa-regular fa-envelope mr-1"></i>${sanitizeHtml(currentEmail)}</span>` : ''}`;
    }

    if ($('page-auth').classList.contains('active')) {
      const urlParams = new URLSearchParams(window.location.search);
      if (!urlParams.get('ticketId')) nav('page-home');
    }

  } else if (isAdminLoggedIn) {
    if ($('home-regular-view')) $('home-regular-view').classList.remove('hidden');
    if ($('home-executive-view')) $('home-executive-view').classList.add('hidden');
    // ซ่อนหน้ามอนิเตอร์ภาพรวมไว้ชั่วคราว (ยังไม่ลบโค้ด)
    if (dashNav) { dashNav.classList.add('hidden'); dashNav.classList.remove('flex'); }
    if (techNav) { techNav.classList.remove('hidden'); techNav.classList.add('flex'); }
    if (avManageNav) { avManageNav.classList.remove('hidden'); avManageNav.classList.add('flex'); }
    if (masterDataNav) { masterDataNav.classList.remove('hidden'); masterDataNav.classList.add('flex'); }
    if ($('gnav-bug-manage')) { $('gnav-bug-manage').classList.remove('hidden'); $('gnav-bug-manage').classList.add('flex'); }
    if ($('gnav-user-manage')) { $('gnav-user-manage').classList.remove('hidden'); $('gnav-user-manage').classList.add('flex'); }
    if (docNav) { docNav.classList.remove('hidden'); docNav.classList.add('flex'); }
    if (homeCardDocument) { homeCardDocument.classList.remove('hidden'); homeCardDocument.classList.add('flex'); }
    if (teacherProfileNav) { teacherProfileNav.classList.remove('hidden'); teacherProfileNav.classList.add('flex'); }
    if (teacherAVProfileNav) { teacherAVProfileNav.classList.remove('hidden'); teacherAVProfileNav.classList.add('flex'); }
    if (homeCardDash) { homeCardDash.classList.add('hidden'); homeCardDash.classList.remove('flex'); }
    if (homeCardTeacherProfile) { homeCardTeacherProfile.classList.remove('hidden'); homeCardTeacherProfile.classList.add('flex'); }
    if (homeCardTeacherAVProfile) { homeCardTeacherAVProfile.classList.remove('hidden'); homeCardTeacherAVProfile.classList.add('flex'); }

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

    if ($('dropdown-user-name')) {
      if (currentRole === 'Supervisor') $('dropdown-user-name').textContent = 'หัวหน้างาน (Supervisor)';
      else $('dropdown-user-name').textContent = 'ผู้ดูแลระบบ (Admin)';
    }
    if ($('dropdown-user-role')) {
      let textRole = 'เจ้าหน้าที่ / Admin';
      if (currentRole === 'Supervisor') textRole = 'หัวหน้างาน';
      $('dropdown-user-role').innerHTML = `สถานะ: ${textRole}${currentEmail ? `<br><span class="text-[10px] text-slate-400 font-normal mt-0.5 block break-all"><i class="fa-regular fa-envelope mr-1"></i>${sanitizeHtml(currentEmail)}</span>` : ''}`;
    }

    if ($('page-auth').classList.contains('active')) {
      const urlParams = new URLSearchParams(window.location.search);
      if (!urlParams.get('ticketId')) nav('page-home');
    }

  } else if (currentTeacher) {
    if ($('home-regular-view')) $('home-regular-view').classList.remove('hidden');
    if ($('home-executive-view')) $('home-executive-view').classList.add('hidden');
    if (dashNav) dashNav.classList.add('hidden');
    if (techNav) techNav.classList.add('hidden');
    if (avManageNav) avManageNav.classList.add('hidden');
    if (masterDataNav) masterDataNav.classList.add('hidden');
    if ($('gnav-bug-manage')) $('gnav-bug-manage').classList.add('hidden');
    if ($('gnav-user-manage')) $('gnav-user-manage').classList.add('hidden');
    if (docNav) docNav.classList.add('hidden');
    if (homeCardDocument) homeCardDocument.classList.add('hidden');
    if (teacherProfileNav) { teacherProfileNav.classList.remove('hidden'); teacherProfileNav.classList.add('flex'); }
    if (teacherAVProfileNav) { teacherAVProfileNav.classList.remove('hidden'); teacherAVProfileNav.classList.add('flex'); }
    if (homeCardDash) homeCardDash.classList.add('hidden');
    if (homeCardTeacherProfile) { homeCardTeacherProfile.classList.remove('hidden'); homeCardTeacherProfile.classList.add('flex'); }
    if (homeCardTeacherAVProfile) { homeCardTeacherAVProfile.classList.remove('hidden'); homeCardTeacherAVProfile.classList.add('flex'); }

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
      if (techNav) { techNav.classList.remove('hidden'); techNav.classList.add('flex'); }
      
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
      if (techNav) { techNav.classList.remove('hidden'); techNav.classList.add('flex'); }
      if (avManageNav) { avManageNav.classList.remove('hidden'); avManageNav.classList.add('flex'); }
      if (masterDataNav) { masterDataNav.classList.remove('hidden'); masterDataNav.classList.add('flex'); }
      if ($('gnav-user-manage')) { $('gnav-user-manage').classList.remove('hidden'); $('gnav-user-manage').classList.add('flex'); }
  
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
      if (techNav) { techNav.classList.remove('hidden'); techNav.classList.add('flex'); }
      if (avManageNav) { avManageNav.classList.remove('hidden'); avManageNav.classList.add('flex'); }
      if (masterDataNav) { masterDataNav.classList.remove('hidden'); masterDataNav.classList.add('flex'); }
      if ($('gnav-user-manage')) { $('gnav-user-manage').classList.remove('hidden'); $('gnav-user-manage').classList.add('flex'); }

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

    if ($('page-auth').classList.contains('active')) {
      const urlParams = new URLSearchParams(window.location.search);
      if (!urlParams.get('ticketId')) {
        nav('page-home');
      }
    }

  } else {
    // Guest
    if ($('home-regular-view')) $('home-regular-view').classList.remove('hidden');
    if ($('home-executive-view')) $('home-executive-view').classList.add('hidden');
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

  // ── อัปเดตสถานะปุ่มเข้าสู่ระบบ / โปรไฟล์ ทั้งบน Header, Mobile Nav และ Dropdown ──
  const isUserLoggedIn = !!(currentTeacher || isAdminLoggedIn);
  const headerLoginBtn = $('header-login-btn');
  const headerProfileBtn = $('header-user-btn');
  const mbAuthIcon = $('mbnav-auth-icon');
  const mbAuthText = $('mbnav-auth-text');
  const dropdownLoginItem = $('dropdown-login-item');
  const dropdownLogoutItem = $('dropdown-logout-item');

  if (isUserLoggedIn) {
    if (headerLoginBtn) { headerLoginBtn.classList.add('hidden'); headerLoginBtn.classList.remove('flex'); }
    if (headerProfileBtn) { headerProfileBtn.classList.remove('hidden'); }
    if (mbAuthIcon) mbAuthIcon.className = 'fa-solid fa-user text-lg text-slate-500';
    if (mbAuthText) {
      mbAuthText.textContent = 'ฉัน';
      mbAuthText.className = 'text-[10px] font-medium text-slate-500';
    }
    if (dropdownLoginItem) dropdownLoginItem.classList.add('hidden');
    if (dropdownLogoutItem) dropdownLogoutItem.classList.remove('hidden');
  } else {
    if (headerLoginBtn) { headerLoginBtn.classList.remove('hidden'); headerLoginBtn.classList.add('flex'); }
    if (mbAuthIcon) mbAuthIcon.className = 'fa-solid fa-right-to-bracket text-lg text-emerald-600';
    if (mbAuthText) {
      mbAuthText.textContent = 'เข้าสู่ระบบ';
      mbAuthText.className = 'text-[10px] font-bold text-emerald-600';
    }
    if (dropdownLoginItem) dropdownLoginItem.classList.remove('hidden');
    if (dropdownLogoutItem) dropdownLogoutItem.classList.add('hidden');
  }

  updateNotificationBadges();
  if (window.NotificationHub && typeof window.NotificationHub.updatePermissionUI === 'function') {
    window.NotificationHub.updatePermissionUI();
  }
}

// ฟังก์ชันระบบค้นหาข้อมูล (นำทางไปยังหน้าต่างๆ จากคำค้น)
function handleGlobalSearch(keyword) {
  const term = keyword.toLowerCase().trim();
  if (!term) return;
  if (term.includes('ติดตาม')) {
    if (window.TrackUI && typeof window.TrackUI.show === 'function') window.TrackUI.show({ type: 'all' });
  } else if (term.includes('เอกสาร')) {
    nav('page-document');
  } else if (term.includes('ซ่อม')) {
    nav('page-repair-form');
  } else if (term.includes('โสต') || term.includes('ยืม')) {
    nav('page-av-form');
  } else if (term.includes('มอนิเตอร์') || term.includes('กราฟ') || term.includes('dashboard')) {
    nav('page-home');
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
  if (dropdown) {
    dropdown.classList.toggle('hidden');
    if (!dropdown.classList.contains('hidden')) {
      if (window.innerWidth < 640) {
        dropdown.style.setProperty('position', 'fixed', 'important');
        dropdown.style.setProperty('top', '68px', 'important');
        dropdown.style.setProperty('left', '50%', 'important');
        dropdown.style.setProperty('right', 'auto', 'important');
        dropdown.style.setProperty('transform', 'translateX(-50%)', 'important');
        dropdown.style.setProperty('width', 'calc(100vw - 24px)', 'important');
        dropdown.style.setProperty('max-width', '440px', 'important');
        dropdown.style.setProperty('margin', '0', 'important');
      } else {
        dropdown.style.position = '';
        dropdown.style.top = '';
        dropdown.style.left = '';
        dropdown.style.right = '';
        dropdown.style.transform = '';
        dropdown.style.width = '';
        dropdown.style.maxWidth = '';
        dropdown.style.margin = '';
      }

      if (window.NotificationHub) {
        if (typeof window.NotificationHub.unlockAudioContext === 'function') {
          window.NotificationHub.unlockAudioContext();
        }
        if (typeof window.NotificationHub.updatePermissionUI === 'function') {
          window.NotificationHub.updatePermissionUI();
        }
        if (typeof window.NotificationHub.renderList === 'function') {
          window.NotificationHub.renderList();
        }
      }
    }
  }
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
  const defaultRep = sanitizeHtml(currentTeacher || (isAdminLoggedIn ? 'Admin' : ''));
  const defaultPage = sanitizeHtml(page || '');
  const { value: v } = await Swal.fire({
    title: '⚠️ แจ้งปัญหาโปรแกรม',
    html: `<div style="text-align:left;gap:12px;display:flex;flex-direction:column;margin-top:10px">
          <input id="bug-reporter" class="w-full p-3 border rounded-xl text-slate-900" placeholder="ชื่อผู้แจ้ง" value="${defaultRep}">
          <input id="bug-page" class="w-full p-3 border rounded-xl text-slate-900" placeholder="หน้าที่มีปัญหา เช่น หน้าแรก, ยืมของ" value="${defaultPage}">
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

  try {
    if (!window.firestoreDb && typeof initFirebase === 'function') initFirebase();
    const bugId = 'bug_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
    if (window.firestoreDb) {
      const bugDoc = {
        bugId,
        reporter: v.reporter,
        reporterEmail: currentEmail || localStorage.getItem('logged_email') || '',
        page: v.page,
        issue: v.issue,
        status: 'รอดำเนินการ',
        createdAtMs: Date.now(),
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      const writePromise = window.firestoreDb.collection('bug_reports').doc(bugId).set(bugDoc);
      await (typeof window.withTimeout === 'function' ? window.withTimeout(writePromise, 8000) : writePromise);
      try { localStorage.setItem('bugs_migrated_v2', '1'); } catch (_) { }
      post({ action: 'report_bug', bugId, ...v }).catch(e => console.warn('Background GAS bug notify error:', e));
    } else {
      await post({ action: 'report_bug', bugId, ...v });
    }
    alertBox('success', 'ขอบคุณครับ', 'ระบบได้รับแจ้งปัญหาของท่านแล้ว', { timer: 1500, showConfirmButton: false });
  } catch (e) {
    console.error('Report bug error:', e);
    alertBox('error', 'เกิดข้อผิดพลาด', 'ไม่สามารถส่งรายงานได้: ' + (e.message || ''));
  }
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

function fmtTimestampDisplay(val) {
  if (!val) return '-';
  try {
    if (typeof val.toDate === 'function') return val.toDate().toLocaleString('th-TH');
    if (typeof val.seconds === 'number') return new Date(val.seconds * 1000).toLocaleString('th-TH');
    const d = new Date(val);
    return isNaN(d.getTime()) ? String(val) : d.toLocaleString('th-TH');
  } catch (_) {
    return String(val);
  }
}

function renderBugTable(data, tbodyId = ($('bug-manage-tbody') ? 'bug-manage-tbody' : 'bug-tbody')) {
  renderTableData(data || [], tbodyId, (row, index) => {
    const time = Array.isArray(row) ? row[0] : (row.timeStr || fmtTimestampDisplay(row.createdAt || row.createdAtMs));
    const rep = Array.isArray(row) ? row[1] : (row.reporter || '-');
    const issue = Array.isArray(row) ? row[2] : (row.issue || '-');
    const page = Array.isArray(row) ? row[3] : (row.page || '-');
    const status = Array.isArray(row) ? (row[4] || 'รอดำเนินการ') : (row.status || 'รอดำเนินการ');
    const docId = Array.isArray(row) ? (row[5] || '') : (row.docId || row.bugId || '');
    const rowIdx = Array.isArray(row) ? index : (row.rowIndex ?? index);

    let badge = '<span class="inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold bg-rose-100 text-rose-700">รอดำเนินการ</span>';
    if (status === 'กำลังแก้ไข') badge = '<span class="inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold bg-amber-100 text-amber-700">กำลังแก้ไข</span>';
    if (status === 'แก้ไขเรียบร้อย') badge = '<span class="inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold bg-emerald-100 text-emerald-700">แก้ไขเรียบร้อย</span>';

    return `
        <td class="p-4 whitespace-nowrap">${sanitizeHtml(time) || '-'}</td>
        <td class="p-4 whitespace-nowrap font-medium text-slate-800">${sanitizeHtml(rep) || '-'}</td>
        <td class="p-4 whitespace-nowrap text-sky-600 font-semibold">${sanitizeHtml(page) || '-'}</td>
        <td class="p-4 min-w-[200px] whitespace-normal text-slate-600">${sanitizeHtml(issue) || '-'}</td>
        <td class="p-4 text-center">${badge}</td>
        <td class="p-4 text-center">
          <button type="button" data-doc-id="${sanitizeHtml(docId)}" data-index="${rowIdx}" data-status="${sanitizeHtml(status)}" onclick="updateBugStatus(this.dataset.docId, Number(this.dataset.index), this.dataset.status)" class="text-sky-600 hover:text-sky-800 hover:bg-sky-50 p-2 rounded-lg transition-colors" title="อัปเดตสถานะ">
            <i class="fa-solid fa-pen-to-square"></i>
          </button>
        </td>
      `;
  }, 6, 'ไม่มีรายการแจ้งปัญหา');
}

async function loadBugAdmin() {
  const tbodyId = $('bug-manage-tbody') ? 'bug-manage-tbody' : 'bug-tbody';
  const tbodyEl = $(tbodyId);
  try {
    if (!window.firestoreDb && typeof initFirebase === 'function') initFirebase();
    let rows = [];
    if (window.firestoreDb) {
      const snap = await window.firestoreDb.collection('bug_reports').get();
      if (snap && !snap.empty) {
        try { localStorage.setItem('bugs_migrated_v2', '1'); } catch (_) { }
        snap.forEach(doc => {
          const d = doc.data() || {};
          rows.push({
            docId: doc.id,
            bugId: d.bugId || doc.id,
            timeStr: d.timeStr || fmtTimestampDisplay(d.createdAt || d.createdAtMs),
            reporter: d.reporter || '-',
            issue: d.issue || '-',
            page: d.page || '-',
            status: d.status || 'รอดำเนินการ',
            createdAtMs: Number(d.createdAtMs) || (d.createdAt && typeof d.createdAt.toMillis === 'function' ? d.createdAt.toMillis() : 0),
            rowIndex: d.rowIndex ?? 0
          });
        });
        rows.sort((a, b) => b.createdAtMs - a.createdAtMs);
      } else if (!localStorage.getItem('bugs_migrated_v2')) {
        try {
          const legacy = await get('get_bug_reports');
          if (Array.isArray(legacy) && legacy.length > 0) {
            rows = await Promise.all(legacy.map(async (r, i) => {
              const docId = 'bug_legacy_' + i + '_' + Date.now();
              const item = {
                bugId: docId,
                timeStr: String(r[0] || '-'),
                reporter: String(r[1] || '-'),
                issue: String(r[2] || '-'),
                page: String(r[3] || '-'),
                status: String(r[4] || 'รอดำเนินการ'),
                rowIndex: i,
                createdAtMs: Date.now() - i * 1000,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
              };
              await window.firestoreDb.collection('bug_reports').doc(docId).set(item).catch(() => {});
              return { ...item, docId };
            }));
          }
          localStorage.setItem('bugs_migrated_v2', '1');
        } catch (_) { }
      }
    } else {
      rows = await get('get_bug_reports');
    }
    renderBugTable(rows, tbodyId);
  } catch (e) {
    if (tbodyEl) tbodyEl.innerHTML = `<tr><td colspan="6" class="text-center py-10 text-rose-500">❌ โหลดข้อมูลล้มเหลว</td></tr>`;
  }
}

async function updateBugStatus(docIdOrIndex, indexOrOldStatus, maybeOldStatus) {
  let docId = '';
  let rowIndex = 0;
  let oldStatus = '';
  if (typeof maybeOldStatus === 'string' || typeof docIdOrIndex === 'string') {
    docId = String(docIdOrIndex || '');
    rowIndex = Number(indexOrOldStatus) || 0;
    oldStatus = String(maybeOldStatus || '');
  } else {
    rowIndex = Number(docIdOrIndex) || 0;
    oldStatus = String(indexOrOldStatus || '');
  }

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

  Swal.fire({ title: 'กำลังอัปเดต...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
  try {
    if (window.firestoreDb && docId) {
      await window.firestoreDb.collection('bug_reports').doc(docId).set({
        status,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      post({ action: 'update_bug_status', bugId: docId, rowIndex, status }).catch(() => {});
    } else {
      await post({ action: 'update_bug_status', rowIndex, status });
    }
    alertBox('success', 'บันทึกสำเร็จ', '', { timer: 1000, showConfirmButton: false });
    loadBugAdmin();
  } catch (e) {
    console.error('Update bug status error:', e);
    alertBox('error', 'เกิดข้อผิดพลาด', 'ไม่สามารถอัปเดตข้อมูลได้');
  }
}

// Master Data global handlers (loadMasterData, addMaster, deleteMaster, clearMaster) are provided by master-data.js

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

// ฟังก์ชันสร้างรหัสคิวงานแยกตามปี พ.ศ. (BLD69-001, IT69-001, AV69-001, PRJ69-001 ไม่วนทับของเดิม)
async function getNextTicketSequence(typeForFirebase) {
  const typeKey = (typeForFirebase === 'building' || typeForFirebase === 'it' || typeForFirebase === 'av' || typeForFirebase === 'project')
    ? typeForFirebase : 'building';
  const prefix = typeForFirebase === 'building' ? 'BLD'
               : typeForFirebase === 'av'       ? 'AV'
               : typeForFirebase === 'it'       ? 'IT'
               : typeForFirebase === 'project'  ? 'PRJ'
               : 'TKT';
  const thaiYear2 = String((new Date().getFullYear() + 543) % 100).padStart(2, '0');
  const counterKey = `${typeKey}_${thaiYear2}`;

  if (!window.firestoreDb && typeof initFirebase === 'function') {
    initFirebase();
  }

  if (window.firestoreDb) {
    try {
      const counterRef = window.firestoreDb.collection('system_counters').doc('tickets');
      const nextNum = await window.firestoreDb.runTransaction(async (transaction) => {
        const doc = await transaction.get(counterRef);
        const data = doc.exists ? (doc.data() || {}) : {};
        const current = Number(data[counterKey]) || 0;
        const next = current + 1;
        transaction.set(counterRef, { [counterKey]: next }, { merge: true });
        return next;
      });

      const numStr = String(nextNum).padStart(3, '0');
      return `${prefix}${thaiYear2}-${numStr}`;
    } catch (err) {
      console.warn('Counter transaction failed, using collision-safe fallback:', err);
    }
  }

  // Fallback กรณี Counter ขัดข้อง ใช้ Timestamp ป้องกันการทับเอกสารเดิม
  const fallbackSuffix = Date.now().toString(36).toUpperCase().slice(-5);
  return `${prefix}${thaiYear2}-TMP${fallbackSuffix}`;
}

// ==========================================
// 12. ระบบส่งแบบฟอร์มกลาง (Generic Form Submission)
// ==========================================
async function backgroundSubmitAndSync(payload, typeForFirebase, subject, detail, reporter, dept, loc, contact, incidentDate) {
  if (!window.firestoreDb && typeof initFirebase === 'function') {
    initFirebase();
  }
  if (!window.firestoreDb) {
    throw new Error('ไม่สามารถเชื่อมต่อฐานข้อมูลหลัก (Firestore) ได้ กรุณารีเฟรชหน้าเว็บแล้วลองใหม่');
  }

  let ticketId = await getNextTicketSequence(typeForFirebase);
  const ticketsCol = window.firestoreDb.collection('tickets');

  // 🛡️ Collision guard: ป้องกันการเขียนทับเอกสารเดิมหากรหัสชน
  try {
    const existingDoc = await ticketsCol.doc(ticketId).get();
    if (existingDoc && existingDoc.exists) {
      ticketId = `${ticketId}-${Date.now().toString(36).toUpperCase().slice(-4)}`;
    }
  } catch (checkErr) {
    console.warn('Ticket collision check note:', checkErr);
  }

  const initialStatus = (typeForFirebase === 'av' && payload.action === 'submit_av')
    ? 'จัดเตรียมแล้ว'
    : (typeForFirebase === 'project' ? 'รอพิจารณาอนุมัติ' : 'รอดำเนินการ');

  let parsedIncidentDate = null;
  if (incidentDate) {
    const dObj = new Date(incidentDate);
    if (!isNaN(dObj.getTime())) parsedIncidentDate = dObj;
  }

  const reporterEmailVal = currentEmail || localStorage.getItem('logged_email') || '';
  const docData = {
    ticketId,
    chatId: `${ticketId}_${Date.now()}`,
    type: typeForFirebase,
    subject:       subject  || '',
    detail:        detail   || '',
    reporterName:  reporter || '',
    reporterEmail: reporterEmailVal,
    dept:          dept     || '',
    location:      loc      || '',
    contact:       contact  || '',
    incidentDate:  parsedIncidentDate,
    urgency:       payload.urgency || '',
    status:        initialStatus,
    createdAt:     firebase.firestore.FieldValue.serverTimestamp(),
    updatedAt:     firebase.firestore.FieldValue.serverTimestamp()
  };

  // 1. บันทึกเข้า Firebase และรอคำยืนยันก่อนแจ้งผู้ใช้งานสำเร็จ
  const writePromise = ticketsCol.doc(ticketId).set(docData);
  await (typeof window.withTimeout === 'function'
    ? window.withTimeout(writePromise, 10000)
    : writePromise);
  console.log('🔥 Instant Firebase save success for ticket:', ticketId);

  if (window.TrackUI && typeof window.TrackUI.load === 'function') {
    window.TrackUI.load(true);
  }

  // ยิงแจ้งเตือนเข้า NotificationHub + FCM Web Push ทันทีตามบทบาท
  if (typeof NotificationHub !== 'undefined' && typeof NotificationHub.publish === 'function') {
    const isProject = typeForFirebase === 'project';
    const isAV = typeForFirebase === 'av';
    const isIT = typeForFirebase === 'it';
    const notifTitle = isProject
      ? `📋 เสนอโครงการใหม่ #${ticketId}`
      : (isAV ? `🎤 งานโสตทัศนูปกรณ์ใหม่ #${ticketId}` : (isIT ? `💻 แจ้งซ่อมไอทีใหม่ #${ticketId}` : `🛠️ มีงานแจ้งซ่อมใหม่ #${ticketId}`));
    NotificationHub.publish({
      ticketId: ticketId,
      taskType: typeForFirebase,
      category: isProject ? 'โครงการ' : (isAV ? 'งานโสตฯ' : (isIT ? 'งานไอที' : 'งานซ่อม')),
      title: notifTitle,
      body: `${subject || 'รายการใหม่'}${loc ? ` (${loc})` : ''} — โดย ${reporter || 'ผู้แจ้ง'}`,
      reporterName: reporter || '',
      reporterEmail: reporterEmailVal,
      location: loc || ''
    }).catch(() => { });
  }

  // 2. อัปโหลดไฟล์เข้า Drive และสำรองลง Google Sheets (GAS) ใน background
  payload.ticketId = ticketId;
  ResourceHubCore.api.post(payload)
    .then(async (res) => {
      if (res && res.fileUrl && window.firestoreDb) {
        try {
          const driveId = res.fileId || (typeof window.extractDriveFileId === 'function' ? window.extractDriveFileId(res.fileUrl) : '');
          await window.firestoreDb.collection('tickets').doc(ticketId).update({
            fileUrl: res.fileUrl,
            driveFileId: driveId,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
          });
        } catch (e) {
          console.warn('Update fileUrl in Firebase:', e);
        }
      }
    })
    .catch((e) => {
      console.error('Background Submit error to GAS:', e);
    });

  return ticketId;
}


async function submitGenericForm(config) {
  const subject = $(config.prefix + 'Subject')?.value.trim();
  const detail = $(config.prefix + 'Detail')?.value.trim();
  const reporter = $(config.prefix + 'Reporter')?.value.trim();
  let dept = $(config.prefix + 'Department')?.value.trim() || '';
  if (dept === '__OTHER__') dept = $(config.prefix + 'Department_other')?.value.trim() || '';
  let rawLoc = $(config.prefix + 'Location')?.value.trim() || '';
  if (rawLoc === '__OTHER__') rawLoc = $(config.prefix + 'Location_other')?.value.trim() || '';
  const inst = $(config.prefix + '_inst')?.value || '';
  const loc = (inst ? `[${inst}] ` : '') + rawLoc;
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

    let typeForFirebase = 'it';
    if (config.action === 'submit_project') typeForFirebase = 'project';
    if (config.action === 'submit_av_repair') typeForFirebase = 'av';
    
    await backgroundSubmitAndSync(payload, typeForFirebase, subject, detail, reporter, dept, loc, contact, incidentDate || targetDate);

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
// 13. แดชบอร์ดขั้นสูง (Dashboard)
// ==========================================
async function loadDashboard() { return ResourceHubCore.ui.loadDashboard(); }

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
    if (!window.firestoreDb && typeof initFirebase === 'function') initFirebase();
    let rows = [];
    if (window.firestoreDb) {
      const snap = await window.firestoreDb.collection('documents').get();
      if (snap && !snap.empty) {
        try { localStorage.setItem('docs_migrated_v2', '1'); } catch (_) { }
        const docs = [];
        snap.forEach(doc => {
          const d = doc.data() || {};
          const docId = d.docId || doc.id;
          const dateVal = d.uploadDate || fmtTimestampDisplay(d.createdAt || d.createdAtMs);
          docs.push({
            createdAtMs: Number(d.createdAtMs) || (d.createdAt && typeof d.createdAt.toMillis === 'function' ? d.createdAt.toMillis() : (Date.parse(d.uploadDate || '') || 0)),
            row: [
              docId,
              d.category || 'ทั่วไป',
              dateVal,
              d.docName || 'ไม่มีชื่อ',
              d.uploader || '-',
              d.fileUrl || '',
              d.ext || '',
              d.description || '',
              d.driveFileId || ''
            ]
          });
        });
        docs.sort((a, b) => b.createdAtMs - a.createdAtMs);
        rows = docs.map(x => x.row);
      } else if (!localStorage.getItem('docs_migrated_v2')) {
        try {
          const legacy = await ResourceHubCore.docs.list();
          if (Array.isArray(legacy) && legacy.length > 0) {
            rows = legacy;
            await Promise.all(legacy.map(async (r, i) => {
              const docId = String(r[0] || ('doc_legacy_' + i + '_' + Date.now()));
              const fileUrl = String(r[5] || '').trim();
              await window.firestoreDb.collection('documents').doc(docId).set({
                docId,
                category: String(r[1] || 'ทั่วไป'),
                uploadDate: String(r[2] || '-'),
                docName: String(r[3] || 'ไม่มีชื่อ'),
                uploader: String(r[4] || '-'),
                fileUrl,
                driveFileId: typeof window.extractDriveFileId === 'function' ? window.extractDriveFileId(fileUrl) : '',
                ext: String(r[6] || ''),
                description: String(r[7] || ''),
                createdAtMs: Date.now() - i * 1000,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
              }).catch(() => {});
            }));
          }
          localStorage.setItem('docs_migrated_v2', '1');
        } catch (_) { }
      }
    } else {
      const data = await ResourceHubCore.docs.list();
      rows = Array.isArray(data) ? data : [];
    }
    _docAllRows = rows;
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
    const docId = sanitizeHtml(r[0] || '');
    const catRaw = r[1] || 'ทั่วไป';
    const cat = sanitizeHtml(catRaw);
    const date = sanitizeHtml(r[2] || '-');
    const name = sanitizeHtml(r[3] || 'ไม่มีชื่อ');
    const uploaderRaw = String(r[4] || '-');
    const uploader = sanitizeHtml(uploaderRaw);
    const rawFileUrl = String(r[5] || '').trim();
    const safeFileUrl = /^https?:\/\//i.test(rawFileUrl) ? sanitizeHtml(rawFileUrl) : '';
    const ext = sanitizeHtml(r[6] || '');
    const catClass = DOC_CATEGORY_COLORS[catRaw] || DOC_CATEGORY_COLORS['ทั่วไป'];
    const fileLink = safeFileUrl
      ? `<a href="${safeFileUrl}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"><i class="fa-solid fa-cloud-arrow-down"></i> ดาวน์โหลด</a>`
      : '<span class="text-slate-300 text-xs">ไม่มีไฟล์</span>';
    return `<tr class="hover:bg-indigo-50/30 transition-colors group">
          <td class="p-4 text-slate-400 text-xs">${i + 1}</td>
          <td class="p-4">
            <div class="flex items-center gap-2">
              <span class="text-lg">${FILE_ICON(r[6] || '')}</span>
              <span class="font-semibold text-slate-800">${name}</span>
            </div>
          </td>
          <td class="p-4">
            <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${catClass}">${cat}</span>
          </td>
          <td class="p-4 text-slate-500 text-xs">${date}</td>
          <td class="p-4">
            <div class="flex items-center gap-1.5 text-xs">
              <span class="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-[10px]">${sanitizeHtml((uploaderRaw || '?')[0].toUpperCase())}</span>
              <span class="text-slate-600 font-medium">${uploader}</span>
            </div>
          </td>
          <td class="p-4">
            <span class="text-xs text-slate-500 uppercase font-mono bg-slate-100 px-2 py-0.5 rounded">${ext || '-'}</span>
          </td>
          <td class="p-4 text-center">
            <div class="flex items-center justify-center gap-2">
              ${fileLink}
              <button type="button" data-id="${docId}" data-name="${name}" onclick="deleteDocument(this.dataset.id, this.dataset.name)" class="text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100" title="ลบเอกสาร">
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

  Swal.fire({ title: 'กำลังอัปโหลดเอกสาร...', html: '<p style="font-size:0.85rem;color:#64748b">กำลังอัปโหลดไฟล์ไปยัง Google Drive และบันทึกข้อมูล</p>', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
  try {
    if (!window.firestoreDb && typeof initFirebase === 'function') initFirebase();
    const uploader = (typeof currentTeacher === 'string' && currentTeacher) ? currentTeacher : (isAdminLoggedIn ? 'Admin' : 'Unknown');
    const uploaderEmail = currentEmail || localStorage.getItem('logged_email') || '';
    const fileData = await readFile(v.file);
    if (fileData) fileData.folderId = DOC_DRIVE_FOLDER_ID;
    const ext = v.file.name.split('.').pop();
    let docId = 'doc_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);

    // 1. อัปโหลดไฟล์จริงขึ้น Google Drive ผ่าน GAS
    const uploadRes = await ResourceHubCore.docs.add({
      docId,
      docName: v.docName,
      category: v.cat,
      description: v.desc,
      uploader,
      ext,
      file: fileData,
      folderId: DOC_DRIVE_FOLDER_ID
    });

    let fileUrl = (uploadRes && uploadRes.fileUrl) ? String(uploadRes.fileUrl).trim() : '';
    if (uploadRes && uploadRes.docId) docId = String(uploadRes.docId);

    // Fallback กรณี GAS รุ่นเดิมไม่ได้คืน fileUrl กลับมาโดยตรง -> อ่านแถวที่เพิ่งบันทึกจาก get_documents 1 ครั้ง
    if (!fileUrl) {
      try {
        const list = await ResourceHubCore.docs.list();
        if (Array.isArray(list)) {
          const matched = [...list].reverse().find(r => String(r[3] || '').trim() === v.docName.trim() && String(r[5] || '').startsWith('http'));
          if (matched) {
            fileUrl = String(matched[5] || '').trim();
            if (matched[0]) docId = String(matched[0]);
          }
        }
      } catch (_) { }
    }

    const driveFileId = (uploadRes && uploadRes.fileId) || (typeof window.extractDriveFileId === 'function' ? window.extractDriveFileId(fileUrl) : '');

    // 2. บันทึก Metadata ลง Firestore documents เป็นแหล่งหลัก
    if (window.firestoreDb) {
      await window.firestoreDb.collection('documents').doc(docId).set({
        docId,
        category: v.cat || 'ทั่วไป',
        uploadDate: new Date().toLocaleDateString('th-TH'),
        createdAtMs: Date.now(),
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        docName: v.docName,
        uploader,
        uploaderEmail,
        fileUrl,
        driveFileId,
        ext: ext || '',
        description: v.desc || ''
      });
      try { localStorage.setItem('docs_migrated_v2', '1'); } catch (_) { }
    }

    await Swal.fire({ icon: 'success', title: 'อัปโหลดสำเร็จ!', text: `"${v.docName}" ถูกเพิ่มเข้าระบบเรียบร้อยแล้ว`, timer: 2000, showConfirmButton: false });
    loadDocuments();
  } catch (e) {
    console.error(e);
    alertBox('error', 'อัปโหลดไม่สำเร็จ', e.message || 'กรุณาลองใหม่อีกครั้ง');
  }
}

async function deleteDocument(docId, docName) {
  const safeName = sanitizeHtml(docName || '');
  const confirm = await Swal.fire({
    title: 'ยืนยันการลบเอกสาร?',
    html: `<p class="text-slate-600 text-sm">คุณต้องการลบเอกสาร <strong class="text-rose-600">"${safeName}"</strong> ออกจากระบบ?<br><span class="text-xs text-slate-400">การดำเนินการนี้ไม่สามารถยกเลิกได้</span></p>`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: '<i class="fa-solid fa-trash"></i> ลบเอกสาร',
    cancelButtonText: 'ยกเลิก',
    confirmButtonColor: '#e11d48'
  });
  if (!confirm.isConfirmed) return;
  try { localStorage.setItem('docs_migrated_v2', '1'); } catch (_) { }
  return submitAction(
    async () => {
      if (window.firestoreDb && docId) {
        await window.firestoreDb.collection('documents').doc(docId).delete();
        ResourceHubCore.docs.remove({ docId }).catch(() => {});
        return { status: 'success' };
      }
      return ResourceHubCore.docs.remove({ docId });
    },
    `ลบเอกสาร "${docName}" เรียบร้อยแล้ว`,
    () => loadDocuments()
  );
}

// ==========================================
// 16. ระบบจัดการผู้ใช้งาน (User Management - Admin Only)
// ==========================================
// ============================================================
let allUsersList = [];

async function fetchUsers() {
  const tbody = $('user-manage-tbody');
  if (tbody) {
    tbody.innerHTML = '<tr><td colspan="5" class="px-4 py-8 text-center text-slate-500"><i class="fa-solid fa-spinner fa-spin text-[#265D5A] text-2xl mb-2"></i><br>กำลังโหลดข้อมูลผู้ใช้จาก Firebase...</td></tr>';
  }

  // ดึงข้อมูลผู้ใช้จาก Firestore โดยตรง 100% (Single Source of Truth)
  if (window.firestoreDb) {
    try {
      const snap = await withTimeout(window.firestoreDb.collection('users').get(), 4000);
      const users = [];
      if (snap && !snap.empty) {
        snap.forEach(doc => {
          const d = doc.data() || {};
          const email = (d.email || doc.id || '').trim();
          const name = (d.name || '').trim();
          const role = (d.role || 'Teacher').trim();
          const status = (d.status || 'approved').trim();
          const picture = (d.picture || '').trim();
          let lastLogin = '';
          if (d.lastLogin) {
            if (d.lastLogin.toDate) lastLogin = d.lastLogin.toDate().toISOString();
            else lastLogin = d.lastLogin;
          }
          users.push([email, name, role, status, picture, lastLogin]);
        });

        // เรียงลำดับชื่อ ก-ฮ
        users.sort((a, b) => (a[1] || '').localeCompare(b[1] || '', 'th'));
      }
      allUsersList = users;
      window.cachedUsers = users;
      try { localStorage.setItem('cached_system_users', JSON.stringify(users)); } catch(e) {}
      renderUserTable();
      return;
    } catch (fbErr) {
      console.warn("Fetch users from Firestore error:", fbErr.message);
    }
  }

  // Fallback: หากเชื่อมต่อ Firebase ขัดข้อง ให้แสดงข้อมูลแคชล่าสุดในเครื่อง
  let cached = null;
  try {
    const raw = localStorage.getItem('cached_system_users');
    if (raw) cached = JSON.parse(raw);
  } catch(err) {}

  if (Array.isArray(cached) && cached.length > 0) {
    allUsersList = cached;
    renderUserTable();
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'info',
      title: 'แสดงข้อมูลจากแคชในเครื่อง',
      showConfirmButton: false,
      timer: 3000
    });
    return;
  }

  if (tbody) {
    tbody.innerHTML = '<tr><td colspan="5" class="px-4 py-8 text-center text-rose-500">' +
      '<i class="fa-solid fa-triangle-exclamation text-xl mb-1"></i><br>' +
      'ไม่สามารถเชื่อมต่อฐานข้อมูล Firebase ได้ในขณะนี้<br>' +
      '<div class="mt-3 flex items-center justify-center gap-2">' +
        '<button onclick="fetchUsers()" class="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium">ลองใหม่อีกครั้ง</button>' +
      '</div>' +
    '</td></tr>';
  }
}

// นำเข้าข้อมูลผู้ใช้จาก Google Sheet (ยกเลิกแล้ว - ระบบทำงานบน Firebase 100%)
async function migrateUsersFromSheets() {
  Swal.fire({
    icon: 'info',
    title: 'ระบบใช้ Firebase 100%',
    text: 'ปัจจุบันระบบจัดการสิทธิ์และผู้ใช้งานทำงานบน Firebase Firestore เป็นหลัก ไม่จำเป็นต้องดึงข้อมูลจาก Google Sheet อีกต่อไป',
    confirmButtonColor: '#265D5A'
  });
}

function renderUserTable() {
  const tbody = $('user-manage-tbody');
  if (!tbody) return;
  tbody.innerHTML = '';
  if (!allUsersList || allUsersList.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="px-4 py-8 text-center text-slate-500">ไม่พบข้อมูลผู้ใช้</td></tr>';
    return;
  }

  allUsersList.forEach(user => {
    const email = sanitizeHtml(user[0] || '');
    const name = sanitizeHtml(user[1] || 'ไม่ระบุชื่อ');
    const role = sanitizeHtml(user[2] || 'Teacher');
    const status = sanitizeHtml(user[3] || 'approved');
    const picture = sanitizeHtml(user[4] || '');
    const lastLoginRaw = user[5];

    let lastLoginText = '-';
    if (lastLoginRaw) {
      const d = new Date(lastLoginRaw);
      if (!isNaN(d.getTime())) {
        lastLoginText = d.toLocaleString('th-TH');
      } else {
        lastLoginText = sanitizeHtml(String(lastLoginRaw));
      }
    }

    const safeEmailId = (user[0] || '').replace(/[^a-zA-Z0-9]/g, '');

    const safePicUrl = /^https?:\/\//i.test(String(user[4] || '').trim()) ? sanitizeHtml(String(user[4]).trim()) : '';

    const tr = document.createElement('tr');
    tr.className = 'hover:bg-slate-50 transition-colors';
    tr.innerHTML = `
    <td class="px-4 py-3">
      <div class="flex items-center gap-3">
        ${safePicUrl ? `<img src="${safePicUrl}" class="w-8 h-8 rounded-full shadow-sm object-cover" alt="profile" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(String(user[1] || 'U'))}&background=265D5A&color=fff'">` : `<div class="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500"><i class="fa-solid fa-user"></i></div>`}
        <div>
          <span class="font-medium text-slate-800">${name}</span>
        </div>
      </div>
    </td>
    <td class="px-4 py-3 text-slate-600 font-mono text-xs">${email}</td>
    <td class="px-4 py-3">
      <select id="role-select-${safeEmailId}" data-email="${email}" data-safe-id="${safeEmailId}" class="border border-slate-300 rounded-lg text-sm px-2.5 py-1.5 bg-white text-slate-700 focus:ring-2 focus:ring-[#265D5A] outline-none" onchange="handleUserChange(this.dataset.email, this.dataset.safeId)">
        <option value="Teacher" ${role === 'Teacher' ? 'selected' : ''}>Teacher (ครู)</option>
        <option value="Tech" ${role === 'Tech' ? 'selected' : ''}>Tech (ช่าง)</option>
        <option value="AV" ${role === 'AV' ? 'selected' : ''}>AV (โสตฯ)</option>
        <option value="Supervisor" ${role === 'Supervisor' ? 'selected' : ''}>Supervisor (หัวหน้างาน)</option>
        <option value="Admin" ${role === 'Admin' ? 'selected' : ''}>Admin (แอดมิน)</option>
        <option value="Executive" ${role === 'Executive' ? 'selected' : ''}>Executive (ผู้บริหาร)</option>
      </select>
    </td>
    <td class="px-4 py-3">
      <select id="status-select-${safeEmailId}" data-email="${email}" data-safe-id="${safeEmailId}" class="border border-slate-300 rounded-lg text-sm px-2.5 py-1.5 bg-white text-slate-700 focus:ring-2 focus:ring-[#265D5A] outline-none font-medium" onchange="handleUserChange(this.dataset.email, this.dataset.safeId)">
        <option value="approved" ${status === 'approved' ? 'selected' : ''}>🟢 ใช้งานปกติ (Approved)</option>
        <option value="pending" ${status === 'pending' ? 'selected' : ''}>🟡 รออนุมัติ (Pending)</option>
        <option value="banned" ${status === 'banned' ? 'selected' : ''}>🔴 ระงับการใช้งาน (Banned)</option>
      </select>
    </td>
    <td class="px-4 py-3 text-xs text-slate-500">${lastLoginText}</td>
    <td class="px-4 py-3 text-center">
      <div class="flex items-center justify-center gap-2">
        <span class="text-slate-400 text-xs inline-flex items-center gap-1" title="บันทึกอัตโนมัติเมื่อเลือกสิทธิ์หรือสถานะ">
          <i class="fa-solid fa-check text-emerald-500 hidden" id="check-${safeEmailId}"></i>
          <span class="text-slate-400 hidden sm:inline">ออโต้</span>
        </span>
        <button type="button" data-email="${email}" data-name="${name}" onclick="deleteUser(this.dataset.email, this.dataset.name)" class="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors" title="ลบผู้ใช้คนนี้">
          <i class="fa-regular fa-trash-can text-sm"></i>
        </button>
      </div>
    </td>
  `;
    tbody.appendChild(tr);
  });
}

function handleUserChange(email, safeEmailId) {
  const roleEl = document.getElementById('role-select-' + safeEmailId);
  const statusEl = document.getElementById('status-select-' + safeEmailId);
  const role = roleEl ? roleEl.value : 'Teacher';
  const status = statusEl ? statusEl.value : 'approved';
  saveUserChanges(email, role, status);
}

function updateUserRole(email, newRole, currentStatus) {
  const safeEmailId = (email || '').replace(/[^a-zA-Z0-9]/g, '');
  handleUserChange(email, safeEmailId);
}

function updateUserStatus(email, currentRole, newStatus) {
  const safeEmailId = (email || '').replace(/[^a-zA-Z0-9]/g, '');
  handleUserChange(email, safeEmailId);
}

function saveUserChanges(email, role, status) {
  const normEmail = (email || '').trim().toLowerCase();
  const safeEmailId = (email || '').replace(/[^a-zA-Z0-9]/g, '');

  // 1. อัปเดต Firestore ทันที (Real-time 0.1 วิ)
  if (window.firestoreDb && normEmail) {
    window.firestoreDb.collection('users').doc(normEmail).set({
      role: role,
      status: status,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true }).catch(err => console.warn('Firestore user update warning:', err));
  }

  // 2. อัปเดตในแคชและรายการในหน่วยความจำ
  if (Array.isArray(allUsersList)) {
    const u = allUsersList.find(x => (x[0] || '').toLowerCase() === normEmail);
    if (u) {
      u[2] = role;
      u[3] = status;
    }
    try { localStorage.setItem('cached_system_users', JSON.stringify(allUsersList)); } catch(e) {}
  }

  // 3. ส่งข้อมูลไปอัปเดต Google Sheets เป็นสำรอง
  post({ action: 'update_user', email: email, role: role, status: status })
    .then(() => {
      const icon = document.getElementById('check-' + safeEmailId);
      if (icon) {
        icon.classList.remove('hidden');
        setTimeout(() => icon.classList.add('hidden'), 2000);
      }
    })
    .catch(e => {
      console.warn('Sync user update to Sheets error:', e);
      // ถ้า Firebase บันทึกแล้ว ให้แสดงไอคอนบันทึกสำเร็จได้
      const icon = document.getElementById('check-' + safeEmailId);
      if (icon) {
        icon.classList.remove('hidden');
        setTimeout(() => icon.classList.add('hidden'), 2000);
      }
    });
}

// ลบผู้ใช้ออกจากระบบ (ทั้ง Firebase และ Google Sheets)
async function deleteUser(email, name) {
  if (!email) return;
  const myEmail = ((typeof currentEmail === 'string' ? currentEmail : '') || (localStorage.getItem('logged_email') || '')).trim().toLowerCase();
  if (myEmail && myEmail === email.trim().toLowerCase()) {
    return Swal.fire({
      icon: 'warning',
      title: 'ไม่สามารถลบบัญชีตนเองได้',
      text: 'คุณกำลังเข้าสู่ระบบด้วยบัญชีนี้ จึงไม่สามารถลบบัญชีของตนเองได้ครับ'
    });
  }

  const result = await Swal.fire({
    title: 'ยืนยันการลบผู้ใช้?',
    html: `คุณต้องการลบผู้ใช้ <b>${sanitizeHtml(name)}</b><br><span class="text-xs text-slate-500 font-mono">(${sanitizeHtml(email)})</span> ออกจากระบบหรือไม่?<br><span class="text-xs text-rose-500 mt-2 block">ข้อมูลจะถูกลบออกจาก Firebase และ Google Sheets ทันที</span>`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#ef4444',
    cancelButtonColor: '#64748b',
    confirmButtonText: '<i class="fa-solid fa-trash-can mr-1"></i> ใช่, ลบผู้ใช้',
    cancelButtonText: 'ยกเลิก'
  });

  if (!result.isConfirmed) return;

  Swal.fire({
    title: 'กำลังลบผู้ใช้...',
    allowOutsideClick: false,
    didOpen: () => Swal.showLoading()
  });

  const normEmail = email.trim().toLowerCase();

  try {
    // 1. ลบจาก Firebase Firestore ทันที
    if (window.firestoreDb) {
      await window.firestoreDb.collection('users').doc(normEmail).delete();
    }

    // 2. ส่งคำขอลบจาก Google Sheets ในเบื้องหลัง
    post({ action: 'delete_user', email: email }).catch(e => console.warn('Delete user in Sheets warning:', e));

    // 3. นำออกจาก Local List & Cache
    allUsersList = allUsersList.filter(u => (u[0] || '').trim().toLowerCase() !== normEmail);
    window.cachedUsers = allUsersList;
    try { localStorage.setItem('cached_system_users', JSON.stringify(allUsersList)); } catch(e) {}

    // 4. Render ตารางใหม่
    renderUserTable();

    Swal.fire({
      icon: 'success',
      title: 'ลบผู้ใช้สำเร็จ',
      text: `ลบบัญชี ${name} (${email}) เรียบร้อยแล้ว`,
      timer: 2000,
      showConfirmButton: false
    });
  } catch (err) {
    console.error('Delete user error:', err);
    Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถลบผู้ใช้ได้: ' + err.message, 'error');
  }
}

window.fetchUsers = fetchUsers;
window.migrateUsersFromSheets = migrateUsersFromSheets;
window.deleteUser = deleteUser;

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
window.openSurveyModal = function (type, row, ticketId = '', docId = '') {
  $('survey-type').value = type || '';
  $('survey-row').value = row || '';
  window.__surveyTarget = {
    type: String(type || '').trim(),
    row: row ? String(row) : '',
    ticketId: String(ticketId || '').trim(),
    docId: String(docId || '').trim()
  };
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
  const rating = parseInt($('survey-rating').value, 10);
  if (rating === 0 || isNaN(rating)) {
    alertBox('warning', 'กรุณาให้คะแนน', 'กรุณากดเลือกดาวเพื่อประเมินความพึงพอใจก่อนกดส่งครับ');
    return;
  }

  const target = window.__surveyTarget || {};
  const type = target.type || $('survey-type').value;
  const row = target.row || $('survey-row').value;
  const ticketId = target.ticketId || '';
  const docId = target.docId || '';
  const comment = $('survey-comment').value.trim();

  return submitAction(
    async () => {
      if (!window.firestoreDb && typeof initFirebase === 'function') initFirebase();
      let savedFirestore = false;
      let resolvedTicketId = ticketId;

      if (window.firestoreDb) {
        const ticketsCol = window.firestoreDb.collection('tickets');
        let targetRef = null;

        if (docId) {
          targetRef = ticketsCol.doc(docId);
        } else if (ticketId) {
          const directSnap = await ticketsCol.doc(ticketId).get();
          if (directSnap && directSnap.exists) {
            targetRef = ticketsCol.doc(ticketId);
          } else if (typeof ticketsCol.where === 'function') {
            const qSnap = await ticketsCol.where('ticketId', '==', ticketId).limit(1).get();
            if (qSnap && !qSnap.empty) targetRef = qSnap.docs[0].ref;
          }
        } else if (row && !isNaN(Number(row)) && typeof ticketsCol.where === 'function') {
          const typeMap = { repair: 'building', building: 'building', it_repair: 'it', it: 'it', av: 'av', av_repair: 'av', project: 'project' };
          const normType = typeMap[type] || type;
          const origIdx = Number(row) - 2;
          const qSnap = await ticketsCol.where('originalIndex', '==', origIdx).get();
          if (qSnap && !qSnap.empty) {
            qSnap.forEach(doc => {
              const d = doc.data() || {};
              if (!targetRef && (!normType || d.type === normType)) {
                targetRef = doc.ref;
                if (!resolvedTicketId && d.ticketId) resolvedTicketId = d.ticketId;
              }
            });
          }
        }

        if (targetRef) {
          await targetRef.set({
            rating,
            ratingComment: comment,
            ratedBy: currentEmail || currentTeacher || 'ผู้ใช้งาน',
            ratedAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
          }, { merge: true });
          savedFirestore = true;
        }
      }

      if (savedFirestore) {
        ResourceHubCore.api.post({ action: 'submit_survey', type, row, ticketId: resolvedTicketId, rating, comment })
          .catch(e => console.warn('Background GAS survey sync warning:', e));
        return { status: 'success' };
      }

      return ResourceHubCore.api.post({ action: 'submit_survey', type, row, ticketId: resolvedTicketId, rating, comment });
    },
    'ขอบคุณที่ร่วมประเมินความพึงพอใจครับ',
    () => {
      closeSurveyModal();
      const refreshId = docId || ticketId;
      if (refreshId && window.TrackUI && typeof window.TrackUI.open === 'function' && $('page-track-detail')?.classList.contains('active')) {
        window.TrackUI.open(refreshId, true);
      }
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
  const element = document.getElementById('home-executive-view') || document.getElementById('page-dashboard');
  if (!element) return;

  // เตรียมส่วนหัวที่มีปุ่ม จะซ่อนปุ่มและตัวเลือกเดือนชั่วคราว
  const buttons = element.querySelectorAll('button, input[type="month"]');
  buttons.forEach(btn => btn.style.display = 'none');

  Swal.fire({ title: 'กำลังสร้างไฟล์ PDF...', text: 'กรุณารอสักครู่', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

  const opt = {
    margin: [8, 8, 8, 8],
    filename: `Executive_Dashboard_${new Date().toISOString().split('T')[0]}.pdf`,
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



// ============================================================================
// 🔐 ระบบจัดการการล็อกอินบนอุปกรณ์เคลื่อนที่และเบราว์เซอร์ภายนอก (Mobile Auth Helpers)
// ============================================================================
const GOOGLE_CLIENT_ID = '309538362014-2mn08g13ht4rnjj9e8j52r5c7204lsqu.apps.googleusercontent.com';
let isGisInitialized = false;

function checkLocalhostDev() {
  const isLocal = ['localhost', '127.0.0.1'].includes(window.location.hostname) || window.location.protocol === 'file:';
  const devEl = $('localhost-dev-login');
  if (devEl) {
    if (isLocal) {
      devEl.classList.remove('hidden');
    } else {
      devEl.classList.add('hidden');
    }
  }
}

function localDevLogin(name, role, email) {
  if (!['localhost', '127.0.0.1'].includes(window.location.hostname) && window.location.protocol !== 'file:') return;
  localStorage.setItem('local_dev_bypass', '1');
  currentTeacher = name;
  currentRole = role;
  currentEmail = email || '';
  isAdminLoggedIn = (role === 'Admin' || role === 'Supervisor');

  window.currentTeacher = currentTeacher;
  window.currentRole = currentRole;
  window.currentEmail = currentEmail;

  localStorage.setItem('logged_teacher', currentTeacher);
  localStorage.setItem('logged_role', currentRole);
  localStorage.setItem('logged_email', currentEmail);
  if (isAdminLoggedIn) localStorage.setItem('logged_admin', 'true');
  else localStorage.removeItem('logged_admin');
  localStorage.setItem('session_login_time', Date.now().toString());

  updateSessionUI();
  if (isAdminLoggedIn) prefetchAllData();

  if (window.NotificationHub) {
    if (typeof window.NotificationHub.init === 'function') {
      window.NotificationHub.init();
    }
    if (typeof window.NotificationHub.refreshTokenProfile === 'function') {
      window.NotificationHub.refreshTokenProfile();
    }
    if (typeof window.NotificationHub.renderList === 'function') {
      window.NotificationHub.renderList();
      window.NotificationHub.updateBadge();
    }
  }

  if (typeof Swal !== 'undefined') {
    Swal.fire({
      icon: 'success',
      title: 'เข้าสู่ระบบโหมดทดสอบสำเร็จ! ⚡',
      text: `ยินดีต้อนรับ คุณ ${currentTeacher} (${role})`,
      timer: 1200,
      showConfirmButton: false
    }).then(() => {
      nav('page-home');
    });
  } else {
    nav('page-home');
  }
}

function checkLineOrWebView() {
  const isLine = /Line/i.test(navigator.userAgent) || /FBAV/i.test(navigator.userAgent) || /Instagram/i.test(navigator.userAgent);
  const alertEl = $('line-browser-alert');
  const googleContainer = $('google-signin-btn-container');
  const fallbackWrapper = $('fallback-google-btn-wrapper');

  if (isLine) {
    if (alertEl) alertEl.classList.remove('hidden');
    if (googleContainer) googleContainer.classList.add('hidden');
    if (fallbackWrapper) {
      fallbackWrapper.classList.remove('hidden');
      fallbackWrapper.classList.add('flex');
    }
  } else {
    if (alertEl) alertEl.classList.add('hidden');
    if (googleContainer) googleContainer.classList.remove('hidden');
    if (fallbackWrapper) {
      fallbackWrapper.classList.add('hidden');
      fallbackWrapper.classList.remove('flex');
    }
  }
}

function openInExternalBrowser() {
  let url = window.location.href;
  if (!url.includes('openExternalBrowser=1')) {
    url += (url.includes('?') ? '&' : '?') + 'openExternalBrowser=1';
  }
  window.location.href = url;
}

function renderGoogleSignInButton() {
  const isLine = /Line/i.test(navigator.userAgent) || /FBAV/i.test(navigator.userAgent) || /Instagram/i.test(navigator.userAgent);
  if (isLine) {
    checkLineOrWebView();
    return;
  }

  // ปิดปุ่ม fallback เสมอสำหรับเบราว์เซอร์ปกติ ไม่ให้แสดงซ้อน 2 ปุ่ม
  const fallback = $('fallback-google-btn-wrapper');
  if (fallback) {
    fallback.classList.add('hidden');
    fallback.classList.remove('flex');
  }

  if (typeof google !== 'undefined' && google.accounts && google.accounts.id) {
    try {
      if (!isGisInitialized) {
        google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleCredentialResponse,
          auto_select: false
        });
        isGisInitialized = true;
      }
      const container = $('google-signin-btn-container');
      if (container) {
        container.innerHTML = ''; // ป้องกันการเรนเดอร์ปุ่มซ้ำซ้อน
        container.classList.remove('hidden');
        google.accounts.id.renderButton(container, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'signin_with',
          shape: 'rectangular',
          width: 300
        });
      }
    } catch (e) {
      console.warn('[Google Auth] renderButton error:', e);
    }
  } else {
    setTimeout(renderGoogleSignInButton, 600);
  }
}

function handleManualGoogleSignIn() {
  const isLine = /Line/i.test(navigator.userAgent) || /FBAV/i.test(navigator.userAgent);
  if (isLine) {
    openInExternalBrowser();
    return;
  }
  if (typeof google !== 'undefined' && google.accounts && google.accounts.id) {
    try {
      if (!isGisInitialized) {
        google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleCredentialResponse,
          auto_select: false
        });
        isGisInitialized = true;
      }
      google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          console.warn('Google One Tap suppressed:', notification.getNotDisplayedReason());
        }
      });
    } catch (e) {
      console.warn('Manual Google Sign In error:', e);
    }
  } else {
    Swal.fire({
      icon: 'info',
      title: 'กำลังเชื่อมต่อ Google...',
      text: 'ระบบกำลังโหลดบริการ Google Identity กรุณารอสักครู่แล้วลองกดใหม่อีกครั้งครับ',
      timer: 3000
    });
  }
}

function handleMobileAuthClick() {
  if (currentTeacher || isAdminLoggedIn) {
    toggleProfileDropdown();
  } else {
    nav('page-auth');
  }
}

// Handle conditional Google One Tap prompt
function checkAndPromptOneTap() {
  // If already logged in, do nothing
  if (localStorage.getItem('logged_teacher') || localStorage.getItem('logged_admin')) return;
  
  // If in LINE app, don't prompt Google One Tap
  if (typeof liff !== 'undefined' && liff.isInClient && liff.isInClient()) return;

  checkLineOrWebView();
  checkLocalhostDev();
  renderGoogleSignInButton();

  if (typeof google !== 'undefined' && google.accounts && google.accounts.id) {
    google.accounts.id.prompt();
  } else {
    setTimeout(checkAndPromptOneTap, 1000); // Try again in 1s if Google script is still loading
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (typeof initFirebase === 'function') initFirebase();
  const authInst = window.firebaseAuth;
  if (authInst && typeof authInst.onAuthStateChanged === 'function') {
    let didInitialSync = false;
    authInst.onAuthStateChanged(() => {
      if (didInitialSync) return;
      didInitialSync = true;
      syncSessionUserFromFirestore();
    });
  } else {
    syncSessionUserFromFirestore();
  }
  checkLocalhostDev();
  checkAndPromptOneTap();
});
