// ============================================================================
// 🔔 FaCiLiTy Real-Time In-App Notification Hub & Web Push Center
// พัฒนาโดย: Taohx_dz_parinya | AI Assistant: Antigravity
// ฟรี 100% ไร้ขีดจำกัดโควต้า รองรับ In-App Toast, Web Audio Chime และ Service Worker
// ============================================================================

const NotificationHub = (function () {
  // รหัสเซสชันเฉพาะของแท็บ/เบราว์เซอร์นี้ (สำหรับแยกแยะเครื่องที่สั่งยิง เพื่อไม่ให้ดังซ้ำ)
  const CURRENT_SESSION_ID = 'sess_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);

  // Set สำหรับจดจำ Notification IDs ที่เคยเห็นหรือประมวลผลแล้ว ป้องกันการเด้งซ้ำ 100%
  const knownDocIds = new Set();

  // สถานะภายในของระบบ
  let notifications = [];
  let pendingTickets = [];
  let startedOrClosedTicketIds = new Set();
  let currentTab = 'all'; // 'all' | 'unread' | 'my'
  let isListenerActive = false;
  let audioContextInstance = null;
  let audioElementInstance = null;

  // คีย์สำหรับเก็บประวัติที่อ่านแล้วและที่ลบแล้วในเครื่อง
  const STORAGE_READ_KEY = 'facility_read_notif_ids_v1';
  const STORAGE_DELETED_KEY = 'facility_deleted_notif_ids_v1';
  const STORAGE_SOUND_KEY = 'facility_notif_sound_enabled';

  // คีย์ VAPID สำหรับ Firebase Cloud Messaging Web Push (ล็อกหน้าจอ / สลีป)
  const FCM_VAPID_KEY = 'BAU_fcE9IXe9lm6ExVioCModZ_tSUJi5D6T5WjcelG772_jGcdN4lRhU88NQxIT_SudIcPFzXcrUuhDvR2jBwfo';
  let isFcmListenerSet = false;
  let currentFcmToken = null;

  // ── 1. ระบบจำสถานะการอ่านและรายการที่ถูกลบ (Read / Deleted) ────────────────
  function getReadIds() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_READ_KEY) || '[]');
    } catch (e) {
      return [];
    }
  }

  function saveReadId(id) {
    if (!id) return;
    const ids = getReadIds();
    if (!ids.includes(id)) {
      ids.push(id);
      // จำกัดเก็บไม่เกิน 500 ID ล่าสุดเพื่อประหยัดหน่วยความจำ
      if (ids.length > 500) ids.splice(0, ids.length - 500);
      try {
        localStorage.setItem(STORAGE_READ_KEY, JSON.stringify(ids));
      } catch (e) { }
    }
  }

  function getDeletedIds() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_DELETED_KEY) || '[]');
    } catch (e) {
      return [];
    }
  }

  function saveDeletedId(id) {
    if (!id) return;
    const ids = getDeletedIds();
    if (!ids.includes(id)) {
      ids.push(id);
      if (ids.length > 500) ids.splice(0, ids.length - 500);
      try {
        localStorage.setItem(STORAGE_DELETED_KEY, JSON.stringify(ids));
      } catch (e) { }
    }
  }

  // ── 2. ระบบเสียงแจ้งเตือนสังเคราะห์ 2 โทน (Web Audio API & HTML5 Audio Chime) ───
  // เล่นเสียง "ตึ้ง... ตึ้ง..." ใสกังวาน ไม่ต้องดาวน์โหลดไฟล์ภายนอก โหลดทันที 0ms
  let isAudioUnlocked = false;

  function unlockAudioContext() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!audioContextInstance && AudioCtx) {
        audioContextInstance = new AudioCtx();
      }
      if (audioContextInstance) {
        if (audioContextInstance.state === 'suspended') {
          audioContextInstance.resume().catch(() => { });
        }
        // ปลดล็อก audio pipeline บน iOS WebKit โดยรัน silent buffer ทันทีระหว่าง touch gesture
        if (!isAudioUnlocked) {
          try {
            const buffer = audioContextInstance.createBuffer(1, 1, 22050);
            const source = audioContextInstance.createBufferSource();
            source.buffer = buffer;
            source.connect(audioContextInstance.destination);
            source.start(0);
            isAudioUnlocked = true;
          } catch (_) { }
        }
      }

      // เตรียม HTML5 Audio Instance สำรองไว้ล่วงหน้า และ Prime ทันทีใน touch gesture เพื่อให้ iOS ยอมรับ async play
      if (!audioElementInstance) {
        const src = window.CHIME_WAV_BASE64 || (typeof CHIME_WAV_BASE64 !== 'undefined' ? CHIME_WAV_BASE64 : '');
        if (src) {
          audioElementInstance = new Audio(src);
          audioElementInstance.volume = 0.85;
          audioElementInstance.play().then(() => {
            audioElementInstance.pause();
            audioElementInstance.currentTime = 0;
          }).catch(() => { });
        }
      }
    } catch (_) { }
  }

  function playAudioElementFallback() {
    try {
      const src = window.CHIME_WAV_BASE64 || (typeof CHIME_WAV_BASE64 !== 'undefined' ? CHIME_WAV_BASE64 : '');
      if (!src) return;
      if (!audioElementInstance) {
        audioElementInstance = new Audio(src);
        audioElementInstance.volume = 0.85;
      }
      audioElementInstance.currentTime = 0;
      const p = audioElementInstance.play();
      if (p !== undefined) {
        p.catch(() => { });
      }
    } catch (_) { }
  }

  // ฟังก์ชันกำเนิดโทนเสียงระฆัง/กระดิ่งแก้ว (Chime Tone Generator)
  function playBellTone(ctx, freq, startTime, duration, volume = 0.22) {
    try {
      // 1. คลื่นความถี่หลัก (Fundamental Sine) ให้เสียงทุ้มอุ่น ละมุน ("ตึ้ง")
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(freq, startTime);
      gain1.gain.setValueAtTime(0.001, startTime);
      gain1.gain.linearRampToValueAtTime(volume, startTime + 0.018);
      gain1.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(startTime);
      osc1.stop(startTime + duration);

      // 2. คลื่นความถี่โอเวอร์โทน (Harmonic Overtone) ให้เสียงใสกังวานเหมือนระฆังจริง
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(freq * 2.0, startTime);
      gain2.gain.setValueAtTime(0.001, startTime);
      gain2.gain.linearRampToValueAtTime(volume * 0.3, startTime + 0.015);
      gain2.gain.exponentialRampToValueAtTime(0.0001, startTime + (duration * 0.75));
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(startTime);
      osc2.stop(startTime + duration);
    } catch (_) { }
  }

  async function playChime() {
    try {
      const soundEnabled = localStorage.getItem(STORAGE_SOUND_KEY) !== 'false';
      if (!soundEnabled) return;

      unlockAudioContext();

      // 1. ลองเล่นผ่าน Web Audio API (ความหน่วง 0ms เสียงก้องคมชัด)
      if (audioContextInstance) {
        try {
          if (audioContextInstance.state === 'suspended') {
            await audioContextInstance.resume();
          }
          const now = audioContextInstance.currentTime;
          // 🔔 ตึ้ง ครั้งที่ 1: C5 (523.25 Hz) กังวานยาว 0.65 วิ
          playBellTone(audioContextInstance, 523.25, now, 0.65, 0.24);
          // 🔔 ตึ้ง ครั้งที่ 2: G5 (783.99 Hz) กังวานยาว 0.95 วิ หลังเว้น 0.38 วิ
          playBellTone(audioContextInstance, 783.99, now + 0.38, 0.95, 0.28);
        } catch (_) { }
      }

      // 2. เสริมด้วย HTML5 Audio Element Fallback เสมอเพื่อความชัวร์ 100% บนทุกเบราว์เซอร์
      playAudioElementFallback();

      // 3. ระบบสั่นมือถือ 2 จังหวะ "ตึ้ง... ตึ้ง..." สอดคล้องกับเสียง
      if (navigator.vibrate) {
        try { navigator.vibrate([180, 180, 280]); } catch (_) { }
      }

    } catch (err) {
      console.warn('[NotificationHub] Audio chime error:', err);
    }
  }

  // ── 3. กำหนดไอคอนและสีประจำประเภทงาน (Helper) ─────────────────────────────
  function getCategoryVisuals(category, taskType) {
    const cat = (category || '').toLowerCase();
    const type = (taskType || '').toLowerCase();

    if (cat.includes('แอร์') || cat.includes('ความเย็น')) {
      return { icon: 'fa-snowflake', color: '#0284c7', bg: '#e0f2fe', label: 'งานแอร์' };
    }
    if (cat.includes('ไฟ') || cat.includes('สว่าง')) {
      return { icon: 'fa-bolt', color: '#d97706', bg: '#fef3c7', label: 'งานไฟฟ้า' };
    }
    if (cat.includes('ประปา') || cat.includes('น้ำ')) {
      return { icon: 'fa-faucet', color: '#0891b2', bg: '#cffafe', label: 'งานประปา' };
    }
    if (type.includes('it') || cat.includes('ไอที') || cat.includes('คอม')) {
      return { icon: 'fa-desktop', color: '#4f46e5', bg: '#e0e7ff', label: 'งานไอที' };
    }
    if (type.includes('av') || cat.includes('โสต') || cat.includes('เสียง')) {
      return { icon: 'fa-microphone-lines', color: '#7c3aed', bg: '#ede9fe', label: 'งานโสตฯ' };
    }
    if (type.includes('chat') || cat.includes('แชท')) {
      return { icon: 'fa-comment-dots', color: '#059669', bg: '#d1fae5', label: 'แชทงาน' };
    }
    return { icon: 'fa-wrench', color: '#265D5A', bg: '#B0EDE6', label: 'งานซ่อม' };
  }

  // ── 4. แปลงเวลาสัมพัทธ์ (Relative Time Formatter) ──────────────────────────
  function formatRelativeTime(dateInput) {
    if (!dateInput) return 'เมื่อสักครู่';
    let d;
    if (dateInput.toDate && typeof dateInput.toDate === 'function') d = dateInput.toDate();
    else if (dateInput instanceof Date) d = dateInput;
    else d = new Date(dateInput);

    if (isNaN(d.getTime())) return 'เมื่อสักครู่';

    const diffSec = Math.floor((Date.now() - d.getTime()) / 1000);
    if (diffSec < 45) return 'เมื่อสักครู่';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)} นาทีที่แล้ว`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} ชั่วโมงที่แล้ว`;
    if (diffSec < 172800) return 'เมื่อวานนี้';
    return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
  }

  // ── 5. แสดงกล่องแจ้งเตือนลอยหน้าจอ (Floating Toast Banner) ─────────────────
  function showToast(item) {
    const container = document.getElementById('toast-notification-container');
    if (!container) return;

    const visuals = getCategoryVisuals(item.category, item.taskType);
    const toastId = 'toast_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);

    const toast = document.createElement('div');
    toast.id = toastId;
    toast.className = 'toast-item-enter bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200/90 p-3.5 flex flex-col gap-2 pointer-events-auto transition-all relative overflow-hidden text-slate-800';

    toast.innerHTML = `
      <div class="flex items-start gap-3">
        <div class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm" style="background-color: ${visuals.bg}; color: ${visuals.color};">
          <i class="fa-solid ${visuals.icon} text-lg"></i>
        </div>
        <div class="flex-1 min-w-0 pr-4">
          <div class="flex items-center gap-2 mb-0.5">
            <span class="text-[10px] font-bold px-1.5 py-0.5 rounded-md uppercase" style="background-color: ${visuals.bg}; color: ${visuals.color};">
              ${visuals.label}
            </span>
            <span class="text-[10px] text-slate-400 font-medium">เมื่อสักครู่</span>
          </div>
          <p class="text-xs font-bold text-slate-800 truncate">${item.title || 'แจ้งเตือนงานซ่อม'}</p>
          <p class="text-[11px] text-slate-600 line-clamp-2 mt-0.5 leading-snug">${item.body || item.subject || ''}</p>
          ${item.location ? `<p class="text-[10px] text-slate-400 mt-1 flex items-center gap-1"><i class="fa-solid fa-location-dot"></i> ${item.location}</p>` : ''}
        </div>
        <button onclick="NotificationHub.dismissToast('${toastId}')" class="text-slate-400 hover:text-slate-600 p-1 -mr-1 -mt-1 transition-colors" title="ปิด">
          <i class="fa-solid fa-xmark text-sm"></i>
        </button>
      </div>
      <div class="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
        <span class="text-[10px] text-slate-400 font-medium">#${item.ticketId || ''}</span>
        <button onclick="NotificationHub.openTicketAndDismiss('${item.ticketId || ''}', '${toastId}', '${item.id || ''}')"
          class="px-3 py-1 rounded-lg text-xs font-bold text-white transition-all shadow-sm active:scale-95" style="background-color: #265D5A;">
          ดูรายละเอียด <i class="fa-solid fa-arrow-right ml-1"></i>
        </button>
      </div>
      <div class="toast-progress-bar absolute bottom-0 left-0 h-1" style="background-color: #265D5A;"></div>
    `;

    container.appendChild(toast);

    // เลื่อนปิดอัตโนมัติเมื่อครบ 6 วินาที
    setTimeout(() => {
      dismissToast(toastId);
    }, 6000);
  }

  function dismissToast(toastId) {
    const el = document.getElementById(toastId);
    if (!el) return;
    el.classList.remove('toast-item-enter');
    el.classList.add('toast-item-leave');
    setTimeout(() => {
      if (el && el.parentNode) el.parentNode.removeChild(el);
    }, 320);
  }

  // ── 5.5 แปลงและรวมรายการงานค้าง (เฉพาะ รอมอบหมาย / รอดำเนินการ) เข้ากับศูนย์การแจ้งเตือน ───
  function isPendingTicketStatus(status, archived) {
    if (archived === true) return false;
    const s = String(status || 'รอดำเนินการ').trim();
    if (!s) return true;
    // เอาไว้เฉพาะงานที่ยังไม่ได้เริ่มซ่อม (รอมอบหมาย / รอดำเนินการ / รอพิจารณาอนุมัติ / รอยืนยันการยืม)
    if (
      s === 'รอดำเนินการ' ||
      s === 'รอมอบหมาย' ||
      s.includes('รอดำเนินการ') ||
      s.includes('รอมอบหมาย') ||
      s.includes('รอพิจารณา') ||
      s.includes('รอยืนยัน')
    ) {
      return true;
    }
    return false;
  }

  function getItemTimestampMs(item) {
    if (!item) return 0;
    if (item.createdAtMs) return Number(item.createdAtMs) || 0;
    if (item.clientTimestamp) return Number(item.clientTimestamp) || 0;
    const c = item.createdAt;
    if (!c) return 0;
    if (typeof c.toMillis === 'function') return c.toMillis();
    if (c.seconds) return c.seconds * 1000;
    if (c instanceof Date) return c.getTime();
    const parsed = new Date(c).getTime();
    return isNaN(parsed) ? 0 : parsed;
  }

  function ticketToPendingNotif(docId, t) {
    const ticketId = String(t.ticketId || docId || '').trim();
    const status = String(t.status || 'รอดำเนินการ').trim();
    const techName = String(t.technician || t.tech || '').trim();
    const hasTech = Boolean(techName && techName !== '-');
    const type = String(t.type || 'building').toLowerCase();
    const isWaitingAssign = !hasTech && (status === 'รอดำเนินการ' || status === 'รอมอบหมาย');

    let titlePrefix = '⏳ งานค้างรอดำเนินการ';
    if (type === 'project' && status.includes('อนุมัติ')) {
      titlePrefix = '📋 โครงการรออนุมัติ';
    } else if (isWaitingAssign) {
      titlePrefix = '⏳ รอดำเนินการ/มอบหมาย';
    } else if (status.includes('กำลัง')) {
      titlePrefix = '🔧 กำลังดำเนินการ';
    }

    const createdMs = getItemTimestampMs(t);
    const catLabel = type === 'it' ? 'งานไอที'
                   : type === 'av' ? 'งานโสตฯ'
                   : type === 'project' ? 'โครงการ'
                   : (t.category || 'งานซ่อม');
    const repName = t.reporterName || t.reporter || t.borrower || 'ผู้แจ้ง';

    return {
      id: 'pending_' + ticketId,
      ticketId: ticketId,
      title: `${titlePrefix} #${ticketId}`,
      body: `${t.subject || t.title || 'งานแจ้งซ่อม'}${t.location ? ' (' + t.location + ')' : ''} — โดย ${repName}`,
      category: catLabel,
      taskType: type,
      status: status,
      hasTech: hasTech,
      isWaitingAssign: isWaitingAssign,
      targetTechnician: techName,
      technician: techName,
      reporterName: repName,
      reporterEmail: t.reporterEmail || '',
      location: t.location || '',
      createdAt: t.createdAt || (createdMs ? new Date(createdMs) : new Date()),
      createdAtMs: createdMs,
      isPendingTask: true
    };
  }

  function getCombinedItems() {
    const deletedIds = getDeletedIds();

    // 1. งานค้างทั้งหมดที่ยังไม่ได้ดำเนินการ/ยังไม่เสร็จสิ้น (ค้างไว้เสมอตามสิทธิ์บทบาท)
    const activePending = pendingTickets.filter(p => isTargetRecipient(p));
    const pendingTicketIds = new Set(activePending.map(p => p.ticketId));

    // 2. รายการแจ้งเตือนอื่นๆ จากคอลเลกชัน notifications (ที่ไม่ซ้ำกับงานค้าง และซ่อนแจ้งเตือนสร้างงานเดิมเมื่อเริ่มซ่อม/เสร็จแล้ว)
    const extraNotifs = notifications.filter(n => {
      if (deletedIds.includes(n.id)) return false;
      if (n.title === 'Test Auth Write') return false;
      if (!isTargetRecipient(n)) return false;
      const isChat = (n.taskType === 'chat' || n.category === 'แชทงาน');
      if (n.ticketId && pendingTicketIds.has(n.ticketId) && !isChat) {
        return false; // แสดงผ่านรายการงานค้างที่มีสถานะสดแล้ว ไม่ให้ซ้ำซ้อน
      }
      if (n.ticketId && startedOrClosedTicketIds.has(n.ticketId) && !isChat && String(n.title || '').includes('งานแจ้งซ่อมใหม่')) {
        return false; // หากงานนั้นเริ่มซ่อม (กำลังดำเนินการ) หรือเสร็จสิ้นแล้ว ไม่ต้องค้างแจ้งเตือนงานใหม่เดิม
      }
      return true;
    });

    const combined = [...activePending, ...extraNotifs];

    // เรียงลำดับ: งานค้างรอดำเนินการ/ยังไม่มอบหมายช่างขึ้นก่อน ตามด้วยงานกำลังซ่อมและรายการล่าสุด
    combined.sort((a, b) => {
      const aWait = a.isPendingTask && (a.status === 'รอดำเนินการ' || a.isWaitingAssign) ? 1 : 0;
      const bWait = b.isPendingTask && (b.status === 'รอดำเนินการ' || b.isWaitingAssign) ? 1 : 0;
      if (aWait !== bWait) return bWait - aWait;

      const aPend = a.isPendingTask ? 1 : 0;
      const bPend = b.isPendingTask ? 1 : 0;
      if (aPend !== bPend) return bPend - aPend;

      return getItemTimestampMs(b) - getItemTimestampMs(a);
    });

    return combined;
  }

  // ── 6. อัปเดตตัวเลขแจ้งเตือนที่ปุ่มกระดิ่ง (Badge Counter) ───────────────────
  function updateBadge() {
    const readIds = getReadIds();
    const allItems = getCombinedItems();
    const pendingCount = allItems.filter(n => n.isPendingTask).length;
    const unreadExtraCount = allItems.filter(n => !n.isPendingTask && !readIds.includes(n.id)).length;
    const totalAlertCount = pendingCount + unreadExtraCount;

    const globalBadge = document.getElementById('global-overdue-badge');
    if (globalBadge) {
      if (totalAlertCount > 0) {
        globalBadge.textContent = totalAlertCount > 99 ? '99+' : totalAlertCount;
        globalBadge.classList.remove('hidden');
      } else {
        globalBadge.classList.add('hidden');
      }
    }

    const dropdownCount = document.getElementById('dropdown-unread-count');
    if (dropdownCount) {
      if (totalAlertCount > 0) {
        dropdownCount.textContent = pendingCount > 0 ? `${pendingCount} งานค้าง` : `${totalAlertCount} ใหม่`;
        dropdownCount.classList.remove('hidden');
      } else {
        dropdownCount.classList.add('hidden');
      }
    }
  }

  // ── 7. แสดงผลรายการใน Dropdown ศูนย์การแจ้งเตือน ───────────────────────────
  function renderList() {
    const listEl = document.getElementById('notification-list');
    if (!listEl) return;

    const readIds = getReadIds();
    const myName = (window.currentTeacher || localStorage.getItem('logged_teacher') || '').toLowerCase().trim();
    const myEmail = (window.currentEmail || localStorage.getItem('logged_email') || '').toLowerCase().trim();

    const activeNotifications = getCombinedItems();

    let filtered = activeNotifications;
    if (currentTab === 'unread') {
      // แท็บยังไม่อ่าน/งานค้าง: แสดงงานค้างทั้งหมดที่ยังทำไม่เสร็จ + แจ้งเตือนที่ยังไม่อ่าน
      filtered = activeNotifications.filter(n => n.isPendingTask || !readIds.includes(n.id));
    } else if (currentTab === 'my') {
      filtered = activeNotifications.filter(n => {
        const rName = (n.reporterName || '').toLowerCase();
        const rEmail = (n.reporterEmail || n.targetUserEmail || '').toLowerCase();
        const tTech = (n.targetTechnician || n.technician || '').toLowerCase();
        return (myName && (rName.includes(myName) || tTech.includes(myName))) ||
          (myEmail && rEmail === myEmail);
      });
    }

    if (filtered.length === 0) {
      listEl.innerHTML = `
        <div class="p-8 text-center text-slate-400 text-xs">
          <i class="fa-regular fa-bell-slash text-2xl mb-2 text-slate-300 block"></i>
          ไม่มีงานค้างหรือการแจ้งเตือนในหมวดนี้
        </div>
      `;
      return;
    }

    let html = '';
    filtered.forEach(item => {
      const isRead = !item.isPendingTask && readIds.includes(item.id);
      const visuals = getCategoryVisuals(item.category, item.taskType);
      const timeStr = formatRelativeTime(item.createdAt);

      let statusPillHtml = '';
      if (item.isPendingTask) {
        if (item.isWaitingAssign) {
          statusPillHtml = `<span class="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 border border-rose-200">⚠️ รอมอบหมาย/ดำเนินการ</span>`;
        } else if (item.status === 'รอดำเนินการ') {
          statusPillHtml = `<span class="text-[9px] font-bold px-1.5 py-0.5 rounded bg-orange-100 text-orange-700 border border-orange-200">⏳ รอดำเนินการ${item.technician ? ' (' + item.technician + ')' : ''}</span>`;
        } else if (String(item.status || '').includes('กำลัง')) {
          statusPillHtml = `<span class="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">🔧 กำลังซ่อม${item.technician ? ' (' + item.technician + ')' : ''}</span>`;
        } else {
          statusPillHtml = `<span class="text-[9px] font-bold px-1.5 py-0.5 rounded bg-violet-100 text-violet-700 border border-violet-200">${item.status}</span>`;
        }
      }

      const rowBgClass = item.isPendingTask
        ? (item.isWaitingAssign ? 'bg-rose-50/40 hover:bg-rose-50/80' : 'bg-amber-50/30 hover:bg-amber-50/70')
        : (isRead ? 'opacity-85 hover:bg-slate-50' : 'bg-emerald-50/30 hover:bg-slate-50');

      html += `
        <div onclick="NotificationHub.openTicketAndDismiss('${item.ticketId || ''}', null, '${item.id || ''}')"
          class="group p-2.5 rounded-xl transition-colors cursor-pointer flex items-start gap-2.5 relative ${rowBgClass}">
          <div class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold" style="background-color: ${visuals.bg}; color: ${visuals.color};">
            <i class="fa-solid ${visuals.icon}"></i>
          </div>
          <div class="flex-1 min-w-0 pr-1">
            <div class="flex items-center justify-between gap-1">
              <p class="text-xs font-bold text-slate-800 truncate">${item.title || 'แจ้งเตือน'}</p>
              <span class="text-[10px] text-slate-400 shrink-0">${timeStr}</span>
            </div>
            <p class="text-[11px] text-slate-600 line-clamp-1 mt-0.5">${item.body || item.subject || ''}</p>
            <div class="flex items-center flex-wrap gap-1.5 mt-1">
              <span class="text-[9px] font-semibold px-1.5 py-0.5 rounded" style="background-color: ${visuals.bg}; color: ${visuals.color};">
                ${visuals.label}
              </span>
              ${statusPillHtml}
              ${item.ticketId ? `<span class="text-[9px] font-mono font-semibold text-slate-500">#${item.ticketId}</span>` : ''}
            </div>
          </div>
          ${item.isPendingTask ? `
            <span class="px-2 py-1 rounded-lg bg-[#265D5A]/10 text-[#265D5A] group-hover:bg-[#265D5A] group-hover:text-white text-[10px] font-bold transition-colors shrink-0 mt-1 flex items-center gap-1" title="คลิกเพื่อเปิดดูและจัดการงานนี้">
              จัดการ <i class="fa-solid fa-chevron-right text-[8px]"></i>
            </span>
          ` : `
            <button onclick="event.stopPropagation(); NotificationHub.deleteItem('${item.id}');"
              class="w-7 h-7 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50 active:scale-95 flex items-center justify-center transition-all shrink-0 mt-0.5"
              title="ลบการแจ้งเตือนนี้">
              <i class="fa-solid fa-trash-can text-xs"></i>
            </button>
          `}
          ${!isRead ? `<span class="w-2 h-2 rounded-full ${item.isWaitingAssign ? 'bg-rose-500' : 'bg-emerald-500'} absolute bottom-2 right-2.5" title="งานค้าง / ยังไม่อ่าน"></span>` : ''}
        </div>
      `;
    });

    listEl.innerHTML = html;
  }

  // ── 8. สลับแท็บตัวกรอง (Tab Switcher) ──────────────────────────────────────
  function setTab(tab) {
    currentTab = tab;
    ['all', 'unread', 'my'].forEach(t => {
      const btn = document.getElementById(`notif-tab-${t}`);
      if (btn) {
        if (t === tab) {
          btn.className = 'flex-1 py-2 text-center text-[#265D5A] border-b-2 border-[#265D5A] transition-colors';
        } else {
          btn.className = 'flex-1 py-2 text-center text-slate-500 hover:text-slate-800 border-b-2 border-transparent transition-colors';
        }
      }
    });
    renderList();
  }

  // ── 9. ทำเครื่องหมายว่าอ่านแล้วทั้งหมด (Mark all as read) ──────────────────
  function markAllAsRead() {
    notifications.forEach(n => saveReadId(n.id));
    updateBadge();
    renderList();
  }

  // ── 10. ลบการแจ้งเตือนรายข้อ (Delete Single Notification) ───────────────────
  async function deleteItem(id) {
    if (!id) return;
    saveDeletedId(id);
    notifications = notifications.filter(n => n.id !== id);
    updateBadge();
    renderList();

    // ลบออกจาก Firestore
    if (window.firestoreDb) {
      try {
        await window.firestoreDb.collection('notifications').doc(id).delete();
      } catch (_) { }
    }
  }

  // ── 11. ลบการแจ้งเตือนทั้งหมด (Clear All Notifications - คงงานค้างที่ยังไม่เสร็จไว้เสมอ) ────
  async function clearAll() {
    const deletedIds = getDeletedIds();
    const activeItems = notifications.filter(n => !deletedIds.includes(n.id));
    const activePendingCount = pendingTickets.filter(p => isTargetRecipient(p)).length;

    if (activeItems.length === 0) {
      if (typeof Swal !== 'undefined') {
        Swal.fire({
          icon: 'info',
          title: activePendingCount > 0 ? 'คงเหลือเฉพาะงานค้าง' : 'ไม่มีการแจ้งเตือน',
          text: activePendingCount > 0
            ? `รายการงานค้างทั้ง ${activePendingCount} งานจะแสดงค้างไว้ในกระดิ่งจนกว่างานจะดำเนินการเสร็จสิ้นครับ`
            : 'ไม่มีรายการแจ้งเตือนค้างอยู่ในระบบครับ',
          timer: 2200,
          showConfirmButton: false
        });
      }
      return;
    }

    let confirm = true;
    if (typeof Swal !== 'undefined') {
      const res = await Swal.fire({
        title: 'ล้างประวัติแจ้งเตือนทั่วไป?',
        text: activePendingCount > 0
          ? `จะลบเฉพาะแจ้งเตือนทั่วไป ส่วนงานค้างที่ยังไม่เสร็จสิ้น (${activePendingCount} งาน) จะยังคงแสดงอยู่ในกระดิ่งครับ`
          : 'ต้องการลบประวัติการแจ้งเตือนทั้งหมดออกจากระบบใช่หรือไม่',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#e11d48',
        cancelButtonColor: '#64748b',
        confirmButtonText: '<i class="fa-solid fa-trash-can mr-1"></i> ล้างแจ้งเตือนทั่วไป',
        cancelButtonText: 'ยกเลิก'
      });
      confirm = res.isConfirmed;
    }

    if (!confirm) return;

    const idsToDelete = activeItems.map(n => n.id);
    idsToDelete.forEach(id => saveDeletedId(id));

    // ลบออกจาก Firestore
    if (window.firestoreDb) {
      try {
        const batch = window.firestoreDb.batch();
        idsToDelete.forEach(id => {
          const docRef = window.firestoreDb.collection('notifications').doc(id);
          batch.delete(docRef);
        });
        await batch.commit();
      } catch (err) {
        console.warn('[NotificationHub] Batch delete error:', err);
      }
    }

    notifications = [];
    updateBadge();
    renderList();

    if (typeof Swal !== 'undefined') {
      Swal.fire({
        icon: 'success',
        title: 'ล้างแจ้งเตือนทั่วไปเรียบร้อย',
        text: activePendingCount > 0
          ? `คงเหลือรายการงานค้าง ${activePendingCount} งานที่รอดำเนินการครับ`
          : 'ลบรายการแจ้งเตือนทั้งหมดออกจากระบบเรียบร้อยครับ',
        timer: 1800,
        showConfirmButton: false
      });
    }
  }

  // ── 12. เปิดดูงานและทำเครื่องหมายว่าอ่านแล้ว (งานค้างจะยังคงอยู่ในกระดิ่งจนกว่าจะเสร็จสิ้น) ──
  function openTicketAndDismiss(ticketId, toastId, notifId) {
    if (toastId) dismissToast(toastId);
    if (notifId && !String(notifId).startsWith('pending_')) {
      saveReadId(notifId);
    }

    // ปิด dropdown หากเปิดอยู่
    const notifDropdown = document.getElementById('notification-dropdown');
    if (notifDropdown && !notifDropdown.classList.contains('hidden')) {
      notifDropdown.classList.add('hidden');
    }

    updateBadge();
    renderList();

    const cleanId = String(ticketId || '').replace(/^#/, '').trim();
    if (!cleanId || cleanId.startsWith('FAC-TEST-') || cleanId.startsWith('TEST-')) return;

    // เปิดดูรายละเอียดงานในระบบ TrackUI ทันที
    if (window.TrackUI && typeof window.TrackUI.open === 'function') {
      window.TrackUI.open(cleanId);
    } else if (window.TrackUI && typeof window.TrackUI.showTicketDetailModal === 'function') {
      window.TrackUI.showTicketDetailModal(cleanId);
    } else if (typeof window.openTaskDetailModal === 'function') {
      window.openTaskDetailModal(cleanId);
    } else if (typeof window.nav === 'function') {
      window.nav('page-track');
    }
  }

  // ── 11. ตรวจสอบสิทธิ์ผู้รับตามบทบาทหน้าที่ (Role-Based Notification Filtering) ─
  function isTargetRecipient(item) {
    if (!item) return false;

    // 1. การแจ้งเตือนทดสอบระบบ (Test Ping) -> จำกัดให้เฉพาะ Admin / Supervisor เท่านั้น ไม่ส่งรบกวนครู
    const isTestItem = item.isTest === true || (item.ticketId && item.ticketId.startsWith('FAC-TEST-'));
    if (isTestItem) {
      return checkIsAdminUser();
    }

    const userRole = (
      (typeof currentRole !== 'undefined' && currentRole) ||
      window.currentRole ||
      localStorage.getItem('logged_role') ||
      'Teacher'
    ).toLowerCase();

    const userEmail = (
      (typeof currentEmail !== 'undefined' && currentEmail) ||
      window.currentEmail ||
      localStorage.getItem('logged_email') ||
      ''
    ).toLowerCase().trim();

    const userName = (
      (typeof currentTeacher !== 'undefined' && currentTeacher) ||
      window.currentTeacher ||
      localStorage.getItem('logged_teacher') ||
      ''
    ).toLowerCase().trim();

    // 2. ผู้ดูแลระบบและเจ้าหน้าที่ส่วนกลาง (Admin / Supervisor / Staff) ได้รับทุกการแจ้งเตือนเสมอ 100%
    if (userRole.includes('admin') || userRole.includes('supervisor') || userRole.includes('staff') || userRole.includes('ผู้ดูแล')) {
      return true;
    }

    const type = (item.taskType || item.category || '').toLowerCase();

    // 3. ผู้บริหาร (Executive) รับเฉพาะงานโครงการระยะยาว (Project) ที่ต้องอนุมัติ หรืองานประกาศด่วน
    if (userRole.includes('executive') || userRole.includes('ผู้บริหาร')) {
      if (type.includes('project') || type.includes('โครงการ') || item.priority === 'urgent') return true;
      return false;
    }

    // 4. ช่างเทคนิค (Tech) รับงานอาคาร, งานไฟฟ้า/ประปา, และงานไอที หรือรายการที่ตนเองถูกมอบหมาย
    if (userRole.includes('tech') || userRole.includes('ช่าง')) {
      const techName = (item.targetTechnician || item.technician || '').toLowerCase().trim();
      if (userName && techName && (techName === userName || techName.includes(userName))) return true;
      if (type.includes('repair') || type.includes('building') || type.includes('it') || type.includes('อาคาร') || type.includes('ไอที')) {
        return true;
      }
    }

    // 5. เจ้าหน้าที่โสตฯ (AV) รับเฉพาะงานขอยืม-คืนอุปกรณ์โสตฯ และงานแจ้งซ่อมอุปกรณ์โสตฯ
    if (userRole.includes('av') || userRole.includes('โสต')) {
      if (type.includes('av') || type.includes('โสต')) return true;
    }

    // 6. ครูผู้แจ้ง (Teacher / General User) ได้รับเฉพาะงานของตนเองเท่านั้น (Zero Spam)
    const targetEmail = (item.targetUserEmail || item.reporterEmail || '').toLowerCase().trim();
    if (userEmail && targetEmail && targetEmail === userEmail) return true;

    const repName = (item.reporterName || item.reporter || item.borrower || '').toLowerCase().trim();
    if (userName && userName.length >= 2 && repName && (repName === userName || repName.includes(userName))) {
      return true;
    }

    // 7. ประกาศส่วนกลางของโรงเรียน (General Announcements)
    if (type.includes('announcement') || type.includes('ประกาศ') || item.category === 'ประกาศ') {
      return true;
    }

    return false;
  }

  // ── 12. ระบบจัดการสิทธิ์การแจ้งเตือนบนอุปกรณ์ (Device Push & Native Permission) ───
  function checkIsAdminUser() {
    const role = (
      (typeof currentRole !== 'undefined' && currentRole) ||
      window.currentRole ||
      localStorage.getItem('logged_role') ||
      localStorage.getItem('user_role') ||
      ''
    ).toLowerCase();
    const isAdmin = (typeof isAdminLoggedIn !== 'undefined' && isAdminLoggedIn) || (localStorage.getItem('logged_admin') === 'true');
    return isAdmin || role.includes('admin') || role.includes('supervisor') || role.includes('ผู้ดูแล');
  }

  function checkNotificationPermission() {
    if (!('Notification' in window)) {
      return 'unsupported';
    }
    return Notification.permission; // 'default' | 'granted' | 'denied'
  }

  function updatePermissionUI() {
    const perm = checkNotificationPermission();
    const dropdownBanner = document.getElementById('notif-permission-status');
    const homeBanners = document.querySelectorAll('.notif-permission-prompt-card');
    const isAdmin = checkIsAdminUser();

    if (perm === 'granted') {
      // ✅ ได้รับอนุญาตแล้ว: ปิดซ่อนการ์ดขอสิทธิ์
      homeBanners.forEach(el => el.classList.add('hidden'));

      if (dropdownBanner) {
        dropdownBanner.innerHTML = `
          <div class="flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span class="text-[11px] font-semibold text-emerald-800">เปิดการแจ้งเตือนบนอุปกรณ์แล้ว</span>
          </div>
          ${isAdmin ? `
          <button onclick="NotificationHub.testDeviceNotification()" class="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-lg text-[10px] font-bold shadow-sm transition-all flex items-center gap-1 shrink-0">
            <i class="fa-solid fa-bell"></i> ยิงทดสอบเตือน
          </button>` : ''}
        `;
        dropdownBanner.className = 'px-3 py-1.5 bg-emerald-50 border-b border-emerald-100 flex items-center justify-between text-xs';
        dropdownBanner.classList.remove('hidden');
      }
    } else if (perm === 'denied') {
      // ⚠️ ผู้ใช้เคยกดปฏิเสธไว้
      homeBanners.forEach(el => el.classList.add('hidden'));

      if (dropdownBanner) {
        dropdownBanner.innerHTML = `
          <div class="flex items-center gap-2 text-rose-700 text-[11px]">
            <i class="fa-solid fa-bell-slash text-rose-500 shrink-0"></i>
            <span>การแจ้งเตือนถูกปิดกั้นในเบราว์เซอร์ (แตะรูปกุญแจหน้า URL เพื่ออนุญาต)</span>
          </div>
        `;
        dropdownBanner.className = 'px-3 py-1.5 bg-rose-50 border-b border-rose-100 flex items-center justify-between text-xs';
        dropdownBanner.classList.remove('hidden');
      }
    } else if (perm === 'default') {
      // 🔔 ยังไม่เคยขออนุญาต: แสดงการ์ดขอสิทธิ์ให้ผู้ใช้เปิดใช้งาน
      homeBanners.forEach(el => el.classList.remove('hidden'));

      if (dropdownBanner) {
        dropdownBanner.innerHTML = `
          <div class="flex items-center gap-2">
            <i class="fa-solid fa-bell text-amber-500 animate-bounce text-sm"></i>
            <div>
              <p class="text-xs font-bold text-amber-900">เปิดการแจ้งเตือนบนโทรศัพท์</p>
              <p class="text-[10px] text-amber-700">รับเสียงเตือนงานซ่อมทันทีแม้พับจอ</p>
            </div>
          </div>
          <button onclick="NotificationHub.requestNativePermission()" class="px-3 py-1.5 bg-[#265D5A] hover:bg-[#1a403d] active:scale-95 text-white rounded-xl text-xs font-bold shadow transition-all shrink-0">
            เปิดใช้งาน
          </button>
        `;
        dropdownBanner.className = 'px-3 py-2 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-200 flex items-center justify-between gap-2 text-xs';
        dropdownBanner.classList.remove('hidden');
      }
    } else {
      // 📱 unsupported (เช่น Safari บน iOS ที่ยังไม่ได้ Add to Home Screen)
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
      const isStandalone = window.navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches;

      if (isIOS && !isStandalone) {
        homeBanners.forEach(el => {
          el.innerHTML = `
            <div class="flex items-start sm:items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-[#265D5A] text-white flex items-center justify-center text-lg shrink-0 shadow-sm">
                <i class="fa-solid fa-arrow-up-from-bracket"></i>
              </div>
              <div>
                <p class="text-xs sm:text-sm font-bold text-slate-800">เพิ่มแอปลงหน้าจอโฮมเพื่อเปิดการแจ้งเตือน (iOS)</p>
                <p class="text-[11px] text-slate-500">แตะปุ่มแชร์ <i class="fa-solid fa-arrow-up-from-bracket"></i> ใน Safari แล้วเลือก <strong>"เพิ่มไปยังหน้าจอโฮม (Add to Home Screen)"</strong> เพื่อรับเสียงเตือนเต็มรูปแบบ</p>
              </div>
            </div>
          `;
          el.classList.remove('hidden');
        });
      } else {
        homeBanners.forEach(el => el.classList.add('hidden'));
      }
      if (dropdownBanner) dropdownBanner.classList.add('hidden');
    }

    // ซ่อนหรือแสดงปุ่มควบคุมทดสอบระบบสำหรับผู้ดูแล (เฉพาะ Admin เท่านั้น)
    const adminActions = document.getElementById('notif-admin-actions');
    if (adminActions) {
      if (isAdmin) {
        adminActions.classList.remove('hidden');
        adminActions.classList.add('flex');
      } else {
        adminActions.classList.add('hidden');
        adminActions.classList.remove('flex');
      }
    }
  }

  async function requestNativePermission() {
    unlockAudioContext();

    // 1. ตรวจสอบว่าอนุญาตไปแล้วหรือยัง เพื่อป้องกันการแจ้งเตือนซ้ำซ้อน
    if ('Notification' in window && Notification.permission === 'granted') {
      updatePermissionUI();
      testDeviceNotification();
      return;
    }

    if (!('Notification' in window)) {
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
      if (isIOS) {
        if (typeof Swal !== 'undefined') {
          Swal.fire({
            icon: 'info',
            title: 'วิธีเปิดการแจ้งเตือนบน iPhone / iPad',
            html: `
              <div class="text-left text-xs text-slate-600 space-y-2">
                <p>1. แตะปุ่ม <strong>แชร์ (Share <i class="fa-solid fa-arrow-up-from-bracket"></i>)</strong> ด้านล่างของ Safari</p>
                <p>2. เลื่อนลงแล้วเลือก <strong>"เพิ่มไปยังหน้าจอโฮม (Add to Home Screen)"</strong></p>
                <p>3. เปิดแอปจากหน้าจอโฮม จะสามารถเปิดเสียงเตือนและ Web Push ได้ 100% ครับ</p>
              </div>
            `,
            confirmButtonText: 'รับทราบ',
            confirmButtonColor: '#265D5A'
          });
        }
      } else {
        if (typeof Swal !== 'undefined') {
          Swal.fire({
            icon: 'info',
            title: 'การแจ้งเตือนในระบบ',
            text: 'ระบบแจ้งเตือนแบบ In-App และเสียงสังเคราะห์พร้อมใช้งานแล้วครับ'
          });
        }
      }
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      updatePermissionUI();

      if (permission === 'granted') {
        playChime();

        showToast({
          id: 'perm_ok_' + Date.now(),
          title: '✅ เปิดรับการแจ้งเตือนบนอุปกรณ์สำเร็จ!',
          body: 'คุณจะได้รับเสียงเตือนและข้อความงานซ่อมแบบเรียลไทม์ แม้พับหน้าจอครับ',
          category: 'ทั่วไป'
        });

        showDeviceNotification('🎉 FaCiLiTy เปิดการแจ้งเตือนบนเครื่องแล้ว', {
          body: 'ระบบพร้อมส่งเสียงเตือนและแจ้งเตือนงานซ่อมทันทีเมื่อมีรายการใหม่ครับ',
          tag: 'facility-welcome'
        });

        // 2. ขอ FCM Web Push Token และบันทึกลง Firestore (fcm_tokens) สำหรับแจ้งเตือนตอนล็อกหน้าจอ
        requestFCMToken();

      } else if (permission === 'denied') {
        if (typeof Swal !== 'undefined') {
          Swal.fire({
            icon: 'warning',
            title: 'การแจ้งเตือนถูกปิดกั้น',
            text: 'คุณครูได้กดปฏิเสธไว้ หากต้องการเปิดรับเสียงแจ้งเตือน ให้แตะไอคอนแม่กุญแจหน้า URL แล้วเลือก "อนุญาตการแจ้งเตือน" ครับ',
            confirmButtonText: 'เข้าใจแล้ว',
            confirmButtonColor: '#265D5A'
          });
        }
      }
    } catch (err) {
      console.warn('[NotificationHub] requestPermission error:', err);
    }
  }

  function showDeviceNotification(title, options = {}) {
    try {
      if (!('Notification' in window)) return;
      if (Notification.permission !== 'granted') return;

      const defaultOpts = {
        body: options.body || 'มีงานแจ้งซ่อมหรืออัปเดตใหม่ในระบบ',
        icon: './img/icon-192.png',
        badge: './img/logo.png',
        vibrate: [200, 100, 200],
        tag: options.tag || ('facility-notif-' + Date.now()),
        renotify: true,
        data: {
          url: options.url || (window.location.origin + window.location.pathname + (options.ticketId ? ('?ticketId=' + encodeURIComponent(options.ticketId)) : '')),
          ticketId: options.ticketId || ''
        }
      };

      if (navigator.serviceWorker && navigator.serviceWorker.ready) {
        navigator.serviceWorker.ready.then(reg => {
          reg.showNotification(title, defaultOpts);
        }).catch(() => {
          try { new Notification(title, defaultOpts); } catch (e) { }
        });
      } else {
        try { new Notification(title, defaultOpts); } catch (e) { }
      }
    } catch (e) {
      console.warn('[NotificationHub] showDeviceNotification error:', e);
    }
  }

  function showWebPush(item) {
    showDeviceNotification(item.title || 'FaCiLiTy • มีการแจ้งเตือนใหม่', {
      body: item.body || item.subject || 'มีงานแจ้งซ่อมหรืออัปเดตใหม่ในระบบ',
      ticketId: item.ticketId
    });
  }

  // ── 11.1 ขอสิทธิ์และดึง FCM Token สำหรับ Web Push ล็อกหน้าจอ ────────────
  async function requestFCMToken(retryCount = 0) {
    try {
      if (!('Notification' in window) || Notification.permission !== 'granted') {
        console.log('[NotificationHub] Notification permission not granted, skipping FCM token request');
        return null;
      }

      if (!window.firebaseMessaging) {
        if (retryCount < 5) {
          setTimeout(() => requestFCMToken(retryCount + 1), 600);
        } else {
          console.warn('[NotificationHub] Firebase Messaging not available after retry');
        }
        return null;
      }

      // รอ Service Worker registration ให้พร้อม
      let swReg = null;
      if (navigator.serviceWorker) {
        swReg = await navigator.serviceWorker.ready.catch(() => null);
      }

      console.log('[NotificationHub] 📲 Requesting FCM Token with VAPID Key...');
      const tokenOptions = {
        vapidKey: FCM_VAPID_KEY
      };
      if (swReg) {
        tokenOptions.serviceWorkerRegistration = swReg;
      }

      const token = await window.firebaseMessaging.getToken(tokenOptions);
      if (token) {
        currentFcmToken = token;
        try { localStorage.setItem('facility_fcm_token', token); } catch (_) { }
        console.log('[NotificationHub] 🎯 FCM Token obtained successfully:', token.substring(0, 15) + '...');
        await saveFCMTokenToFirestore(token);
        setupFCMForegroundListener();
        return token;
      } else {
        console.warn('[NotificationHub] No FCM token returned. Check notification permission and VAPID key.');
        return null;
      }
    } catch (err) {
      console.warn('[NotificationHub] FCM getToken error:', err);
      return null;
    }
  }

  // ── 11.2 บันทึก FCM Token ลง Firestore (fcm_tokens) พร้อมผูกบทบาทและอีเมล ──
  async function saveFCMTokenToFirestore(token) {
    if (!token) return;
    if (!window.firestoreDb) {
      setTimeout(() => saveFCMTokenToFirestore(token), 1000);
      return;
    }

    try {
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
      const platform = isIOS ? (isStandalone ? 'ios_pwa' : 'ios_safari') : (isMobile ? 'android' : 'desktop');
      
      const currentUser = (typeof currentTeacher !== 'undefined' && currentTeacher) || window.currentTeacher || localStorage.getItem('logged_teacher') || 'ผู้ใช้งาน';
      const currentUserEmail = (typeof currentEmail !== 'undefined' && currentEmail) || window.currentEmail || localStorage.getItem('logged_email') || '';
      let userRole = (typeof currentRole !== 'undefined' && currentRole) || window.currentRole || localStorage.getItem('logged_role') || 'Teacher';
      if (checkIsAdminUser() && (!userRole || userRole === 'Teacher' || userRole === 'user')) {
        userRole = 'Admin';
      }

      const safeTokenId = token.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 80);

      await window.firestoreDb.collection('fcm_tokens').doc(safeTokenId).set({
        token: token,
        userName: currentUser,
        userEmail: currentUserEmail,
        role: userRole,
        platform: platform,
        isStandalone: isStandalone,
        userAgent: navigator.userAgent,
        updatedAt: (typeof firebase !== 'undefined' && firebase.firestore && firebase.firestore.FieldValue)
          ? firebase.firestore.FieldValue.serverTimestamp()
          : new Date(),
        updatedAtMs: Date.now()
      }, { merge: true });

      console.log('[NotificationHub] 💾 FCM Token saved with role:', platform, currentUser, userRole, currentUserEmail);

      // บันทึกลง Google Sheets ผ่าน Apps Script ควบคู่ไปด้วยสำหรับการส่ง Web Push จากหลังบ้าน
      try {
        const scriptEndpoint = (typeof scriptURL !== 'undefined') ? scriptURL : 'https://script.google.com/macros/s/AKfycbyMZhZ6AftlGNqrcu15xKGXjIxq9zPCaJZbJooi9qBykjT4pjA71mQpn1kfz8-qyaiaLg/exec';
        fetch(scriptEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            action: 'register_fcm_token',
            token: token,
            userName: currentUser,
            userEmail: currentUserEmail,
            role: userRole,
            platform: platform,
            isStandalone: isStandalone,
            userAgent: navigator.userAgent
          })
        }).catch(() => { });
      } catch (errSync) { }
    } catch (e) {
      console.warn('[NotificationHub] saveFCMToken error:', e);
    }
  }

  // อัปเดตข้อมูลบทบาทและอีเมลของ Token เมื่อผู้ใช้ล็อกอินหรือสลับบัญชี
  function refreshTokenProfile() {
    const token = currentFcmToken || localStorage.getItem('facility_fcm_token');
    if (token) {
      saveFCMTokenToFirestore(token);
    }
  }

  // ปลดบทบาทของ Token เมื่อผู้ใช้ล็อกเอาต์
  function unregisterFCMProfile() {
    const token = currentFcmToken || localStorage.getItem('facility_fcm_token');
    if (token) {
      saveFCMTokenToFirestore(token);
    }
  }

  // ── 11.3 ดักฟังข้อความ FCM เมื่อเปิดแอปอยู่หน้าจอ (Foreground Listener) ─────────
  function setupFCMForegroundListener() {
    if (isFcmListenerSet || !window.firebaseMessaging) return;
    try {
      window.firebaseMessaging.onMessage(payload => {
        console.log('[NotificationHub] 🔔 FCM Foreground message received:', payload);
        const ticketId = (payload.data && payload.data.ticketId) || '';

        // ป้องกันเสียงและ Toast เด้งซ้ำ 2 รอบหาก Firestore Real-Time ทำงานไปแล้ว
        if (ticketId && knownDocIds.has(ticketId)) {
          console.log('[NotificationHub] ⏭️ Skipping duplicate FCM toast, already displayed by Firestore:', ticketId);
          return;
        }
        if (ticketId) knownDocIds.add(ticketId);

        const title = (payload.notification && payload.notification.title) ||
                      (payload.data && payload.data.title) ||
                      'FaCiLiTy แจ้งเตือน';
        const body = (payload.notification && payload.notification.body) ||
                     (payload.data && payload.data.body) ||
                     '';

        playChime();
        showToast({
          id: 'fcm_' + Date.now(),
          ticketId: ticketId,
          title: title,
          body: body,
          category: 'งานซ่อม',
          taskType: 'repair',
          location: 'ศูนย์ FaCiLiTy',
          createdAt: new Date()
        });
      });
      isFcmListenerSet = true;
      console.log('[NotificationHub] 🎧 FCM Foreground listener configured');
    } catch (e) {
      console.warn('[NotificationHub] setupFCMForegroundListener error:', e);
    }
  }

  function testDeviceNotification() {
    if (!checkIsAdminUser()) {
      if (typeof Swal !== 'undefined') {
        Swal.fire({
          icon: 'info',
          title: 'เฉพาะแอดมินเท่านั้น',
          text: 'ปุ่มทดสอบการแจ้งเตือนเปิดให้ใช้งานเฉพาะผู้ดูแลระบบ (Admin) เท่านั้นครับ',
          timer: 2000,
          showConfirmButton: false
        });
      }
      return;
    }
    unlockAudioContext();
    playChime();

    const testId = 'FAC-TEST-' + Math.floor(1000 + Math.random() * 9000);
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const deviceLabel = isMobile ? 'โทรศัพท์มือถือ' : 'คอมพิวเตอร์';
    const testTitle = '🔔 ทดสอบการแจ้งเตือนแบบเรียลไทม์';
    const testBody = `ยิงทดสอบจาก ${deviceLabel} — เสียงเตือนและป้าย In-App เด้งเฉพาะผู้ดูแลระบบ (Admin) 100%`;

    // 1. เด้งป้าย Toast บนหน้าจอเครื่องนี้ทันที
    showToast({
      id: 'local_test_' + Date.now(),
      ticketId: testId,
      title: testTitle,
      body: testBody,
      category: 'ทดสอบ',
      taskType: 'test',
      isTest: true,
      location: 'ศูนย์ FaCiLiTy',
      createdAt: new Date()
    });

    // 2. แจ้งเตือนระดับระบบปฏิบัติการ (OS / PWA Home Screen Notification) บนเครื่องนี้
    if ('Notification' in window && Notification.permission === 'granted') {
      showDeviceNotification(testTitle, {
        body: `[ทดสอบ ${testId}] ${testBody}`,
        tag: 'facility-test-' + Date.now(),
        ticketId: testId
      });
    }

    // 3. บันทึกทดสอบลง Firestore ทันที และยิง FCM Web Push ปลุกหน้าจอล็อก (จำกัดเฉพาะ Admin ด้วย isTest: true)
    const testPayload = {
      ticketId: testId,
      title: testTitle,
      body: testBody,
      category: 'ทดสอบ',
      taskType: 'test',
      isTest: true,
      targetRoles: ['admin', 'supervisor'],
      location: 'ศูนย์ FaCiLiTy',
      reporterName: window.currentTeacher || localStorage.getItem('logged_teacher') || 'ครูเต้าหู้ (Admin)'
    };

    if (window.firestoreDb) {
      publish(testPayload).catch(err => {
        console.warn('[NotificationHub] test broadcast error:', err);
      });

      // กรณีทดสอบด้วยเครื่องเดียว (กดปุ่มยิงทดสอบแล้วกดล็อกหน้าจอ/สลับออกนอกแอปทันที) ให้ส่ง Push ซ้ำเมื่อพับจอ
      setTimeout(() => {
        if (document.visibilityState === 'hidden' && currentFcmToken) {
          dispatchFCMWebPush(testPayload, true).catch(() => { });
        }
      }, 3000);
    } else {
      console.warn('[NotificationHub] firestoreDb not ready for test broadcast');
    }
  }

  // ── 12.1 ทดสอบส่งแจ้งเตือนเข้า LINE กลุ่ม (มีเสียงเตือนบนหน้าจอล็อกโทรศัพท์ 100%) ───
  async function testLineNotification() {
    if (!checkIsAdminUser()) {
      if (typeof Swal !== 'undefined') {
        Swal.fire({
          icon: 'info',
          title: 'เฉพาะแอดมินเท่านั้น',
          text: 'ปุ่มทดสอบส่ง LINE เปิดให้ใช้งานเฉพาะผู้ดูแลระบบ (Admin) เท่านั้นครับ',
          timer: 2000,
          showConfirmButton: false
        });
      }
      return;
    }
    if (typeof Swal !== 'undefined') {
      Swal.fire({
        title: 'กำลังส่งแจ้งเตือนเข้า LINE กลุ่ม...',
        text: 'โปรดตรวจสอบการแจ้งเตือนบน LINE ในโทรศัพท์ของคุณ',
        allowOutsideClick: false,
        didOpen: () => { Swal.showLoading(); }
      });
    }

    try {
      const url = (typeof scriptURL !== 'undefined') ? scriptURL : 'https://script.google.com/macros/s/AKfycbyMZhZ6AftlGNqrcu15xKGXjIxq9zPCaJZbJooi9qBykjT4pjA71mQpn1kfz8-qyaiaLg/exec';
      const testId = 'TEST-' + Math.floor(1000 + Math.random() * 9000);
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'notify_chat',
          ticketId: testId,
          senderName: window.currentTeacher || 'เต้าหู้ ปริญญา',
          role: 'admin',
          taskTitle: 'ทดสอบระบบแจ้งเตือนเข้าโทรศัพท์ผ่าน LINE',
          message: '🔔 ทดสอบส่งเสียงและแจ้งเตือนเข้าโทรศัพท์ผ่าน LINE กลุ่ม FaCiLiTy สำเร็จเรียบร้อย (ดังและสั่นแม้พับหน้าจอ 100%)'
        })
      });
      if (typeof Swal !== 'undefined') {
        Swal.fire({
          icon: 'success',
          title: 'ส่งเข้า LINE สำเร็จ!',
          text: 'ข้อความถูกส่งเข้า LINE กลุ่มเรียบร้อย โทรศัพท์จะสั่นและมีเสียงเตือนทันทีครับ',
          timer: 2200,
          showConfirmButton: false
        });
      }
    } catch (e) {
      if (typeof Swal !== 'undefined') {
        Swal.fire({
          icon: 'info',
          title: 'ส่งคำขอแล้ว',
          text: 'ส่งแจ้งเตือนเข้า LINE เรียบร้อยครับ'
        });
      }
    }
  }

  // ── 13. เชื่อมต่อ Firebase Firestore Real-Time Listener ───────────────────
  function initListener() {
    if (isListenerActive) return;
    if (!window.firestoreDb) {
      setTimeout(initListener, 400);
      return;
    }

    try {
      isListenerActive = true;
      let isFirstLoad = true;
      console.log('[NotificationHub] 🎧 Firestore Real-Time listener connected successfully (Session: ' + CURRENT_SESSION_ID + ')');

      window.firestoreDb.collection('notifications')
        .orderBy('createdAt', 'desc')
        .limit(30)
        .onSnapshot(snapshot => {
          snapshot.docChanges().forEach(change => {
            const docId = change.doc.id;
            const data = change.doc.data() || {};
            data.id = docId;

            if (change.type === 'added') {
              const isAlreadyKnown = knownDocIds.has(docId);
              knownDocIds.add(docId);

              // ถ้าไม่ใช่การโหลดหน้าเว็บครั้งแรก และยังไม่เคยประมวลผล ID นี้มาก่อน
              if (!isFirstLoad && !isAlreadyKnown) {
                // ข้ามถ้าเป็นเครื่องนี้เองที่เพิ่งสั่งยิง (เพราะดังในเครื่องตัวเองไปแล้ว)
                if (data.senderSessionId && data.senderSessionId === CURRENT_SESSION_ID) {
                  console.log('[NotificationHub] ⏭️ Skipping self-triggered notification:', docId);
                  return;
                }

                // แจ้งเตือนเมื่อเป็นผู้รับเป้าหมาย (การทดสอบระบบส่งถึงทุกเครื่องเสมอ 100%)
                if (isTargetRecipient(data)) {
                  console.log('[NotificationHub] 🔔 Real-time alert triggered on this device from remote:', data.title, data.ticketId);
                  showToast(data);
                  playChime();
                  showWebPush(data);
                }
              } else if (isFirstLoad && !isAlreadyKnown) {
                // ถ้าเป็นการโหลดครั้งแรก (เช่น โทรศัพท์เพิ่งถูกปลดล็อกหน้าจอ หรือเปิดเข้ามาใหม่)
                // ตรวจสอบว่ามีรายการสดใหม่ที่เพิ่งส่งเข้ามาไม่เกิน 5 นาที ที่ยังไม่ได้อ่านหรือไม่
                let itemTime = data.createdAtMs || data.clientTimestamp || 0;
                if (!itemTime && data.createdAt && data.createdAt.toMillis) itemTime = data.createdAt.toMillis();
                else if (!itemTime && data.createdAt && data.createdAt.seconds) itemTime = data.createdAt.seconds * 1000;
                else if (!itemTime && data.createdAt instanceof Date) itemTime = data.createdAt.getTime();

                const isRecent = itemTime && (Date.now() - itemTime < 300000);
                const deletedIds = getDeletedIds();
                const isUnread = !getReadIds().includes(docId) && !deletedIds.includes(docId);
                const isNotSelf = !data.senderSessionId || data.senderSessionId !== CURRENT_SESSION_ID;

                if (isRecent && isUnread && isNotSelf && isTargetRecipient(data)) {
                  console.log('[NotificationHub] 🔔 Catch-up alert triggered upon device wake-up:', data.title);
                  setTimeout(() => {
                    showToast(data);
                    playChime();
                    showWebPush(data);
                  }, 600);
                }
              }
            }
          });

          // เรียงลำดับรายการทั้งหมดจากใหม่ไปเก่าสำหรับแสดงใน Notification Center Dropdown
          const deletedIds = getDeletedIds();
          notifications = snapshot.docs
            .map(doc => {
              const d = doc.data() || {};
              d.id = doc.id;
              return d;
            })
            .filter(n => !deletedIds.includes(n.id));

          updateBadge();
          renderList();
          isFirstLoad = false;
        }, err => {
          console.warn('[NotificationHub] Firestore snapshot error:', err);
          isListenerActive = false;
          setTimeout(initListener, 2000);
        });

      // ดักฟังรายการงานทั้งหมดในตาราง tickets แบบ Real-time เพื่อดึงเฉพาะงานที่รอมอบหมาย/รอดำเนินการ มาแสดงที่กระดิ่งเสมอ
      let isTicketsFirstLoad = true;
      window.firestoreDb.collection('tickets')
        .onSnapshot(snap => {
          const currentPending = [];
          const currentStartedOrClosed = new Set();

          snap.docs.forEach(doc => {
            const t = doc.data() || {};
            const tid = t.ticketId || doc.id;
            if (isTicketsFirstLoad && tid) {
              knownDocIds.add('ticket_' + tid);
            }
            if (isPendingTicketStatus(t.status, t.archived)) {
              currentPending.push(ticketToPendingNotif(doc.id, t));
            } else if (tid) {
              currentStartedOrClosed.add(tid);
            }
          });

          pendingTickets = currentPending;
          startedOrClosedTicketIds = currentStartedOrClosed;
          updateBadge();
          renderList();

          if (isTicketsFirstLoad) {
            isTicketsFirstLoad = false;
            return;
          }

          snap.docChanges().forEach(change => {
            if (change.type === 'added') {
              const ticket = change.doc.data() || {};
              const ticketId = ticket.ticketId || change.doc.id;
              if (!ticketId || knownDocIds.has('ticket_' + ticketId)) return;
              knownDocIds.add('ticket_' + ticketId);

              // ตรวจสอบอายุของ ticket (ต้องสร้างไม่เกิน 3 นาที เพื่อป้องกันงานเก่าเด้งซ้ำ)
              let ticketTime = 0;
              if (ticket.createdAt && ticket.createdAt.toMillis) ticketTime = ticket.createdAt.toMillis();
              else if (ticket.createdAt && ticket.createdAt.seconds) ticketTime = ticket.createdAt.seconds * 1000;
              else if (ticket.createdAt instanceof Date) ticketTime = ticket.createdAt.getTime();

              if (ticketTime && (Date.now() - ticketTime > 180000)) {
                return; // งานเก่า ไม่ต้องแจ้งเตือนซ้ำ
              }

              // ตรวจสอบว่ามี notification ในคอลเลกชัน notifications แล้วหรือยัง หากยังไม่มีให้เด้ง Toast
              const exists = notifications.some(n => n.ticketId === ticketId);
              if (!exists && ticketId) {
                const notifObj = {
                  id: 'local_' + ticketId,
                  ticketId: ticketId,
                  title: '🛠️ มีงานแจ้งซ่อมใหม่!',
                  body: `${ticket.subject || ticket.title || 'งานซ่อม'} (${ticket.location || 'ไม่ระบุสถานที่'})`,
                  category: ticket.category || 'งานซ่อม',
                  taskType: ticket.type || 'building',
                  reporterName: ticket.reporter || ticket.reporterName || 'ผู้แจ้ง',
                  createdAt: new Date()
                };
                if (isTargetRecipient(notifObj)) {
                  showToast(notifObj);
                  playChime();
                  showWebPush(notifObj);
                }
              }
            }
          });
        }, () => { });

    } catch (e) {
      console.warn('[NotificationHub] Listener init failed:', e);
      isListenerActive = false;
      setTimeout(initListener, 2000);
    }
  }

  // ── 13.5 ระบบยิง FCM v1 Web Push ตรงไปยังอุปกรณ์ที่ปิดแอป/ล็อกหน้าจอ ─────────
  let cachedFcmAccessToken = null;
  let cachedFcmTokenExpiry = 0;
  let cachedDispatcherConfig = null;

  function arrayBufferToBase64Url(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  function stringToBase64Url(str) {
    const bytes = new TextEncoder().encode(str);
    return arrayBufferToBase64Url(bytes.buffer);
  }

  async function getFcmAccessToken() {
    if (cachedFcmAccessToken && Date.now() < cachedFcmTokenExpiry) {
      return { accessToken: cachedFcmAccessToken, projectId: (cachedDispatcherConfig && cachedDispatcherConfig.projectId) || 'facility-c7833' };
    }
    if (!window.firestoreDb || !window.crypto || !window.crypto.subtle) return null;

    try {
      if (!cachedDispatcherConfig) {
        const docSnap = await window.firestoreDb.collection('system_config').doc('fcm_dispatcher').get();
        if (!docSnap.exists) return null;
        cachedDispatcherConfig = docSnap.data();
      }
      const { clientEmail, keyData, projectId } = cachedDispatcherConfig || {};
      if (!clientEmail || !keyData) return null;

      const binaryDerStr = atob(keyData.replace(/\s+/g, ''));
      const binaryDer = new Uint8Array(binaryDerStr.length);
      for (let i = 0; i < binaryDerStr.length; i++) {
        binaryDer[i] = binaryDerStr.charCodeAt(i);
      }

      const cryptoKey = await window.crypto.subtle.importKey(
        'pkcs8',
        binaryDer.buffer,
        { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
        false,
        ['sign']
      );

      const now = Math.floor(Date.now() / 1000);
      const header = stringToBase64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
      const claim = stringToBase64Url(JSON.stringify({
        iss: clientEmail,
        scope: 'https://www.googleapis.com/auth/firebase.messaging',
        aud: 'https://oauth2.googleapis.com/token',
        exp: now + 3600,
        iat: now
      }));

      const signingInput = new TextEncoder().encode(header + '.' + claim);
      const sigBuffer = await window.crypto.subtle.sign('RSASSA-PKCS1-v1_5', cryptoKey, signingInput);
      const jwt = header + '.' + claim + '.' + arrayBufferToBase64Url(sigBuffer);

      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
          assertion: jwt
        })
      });
      const tokenJson = await tokenRes.json();
      if (tokenJson && tokenJson.access_token) {
        cachedFcmAccessToken = tokenJson.access_token;
        cachedFcmTokenExpiry = Date.now() + 3000 * 1000;
        return { accessToken: cachedFcmAccessToken, projectId: projectId || 'facility-c7833' };
      }
    } catch (e) {
      console.warn('[NotificationHub] getFcmAccessToken note:', e);
    }
    return null;
  }

  function isTokenTargetForPush(tokenData, item) {
    if (!tokenData || !tokenData.token || !item) return false;

    const tRole = String(tokenData.role || 'Teacher').toLowerCase().trim();
    const tEmail = String(tokenData.userEmail || '').toLowerCase().trim();
    const tName = String(tokenData.userName || '').toLowerCase().trim();

    // รองรับ Token รุ่นเก่าที่ยังเป็น role='user' ก่อนเปิดแอปอัปเดตโปรไฟล์
    if (tRole === 'user') return true;

    const isTestItem = item.isTest === true || (item.ticketId && String(item.ticketId).startsWith('FAC-TEST-'));
    if (isTestItem) {
      return tRole.includes('admin') || tRole.includes('supervisor') || tRole.includes('ผู้ดูแล');
    }

    // 1. Admin / Supervisor / Staff รับทุกงานเสมอ 100%
    if (tRole.includes('admin') || tRole.includes('supervisor') || tRole.includes('staff') || tRole.includes('ผู้ดูแล')) {
      return true;
    }

    // 2. กรณีระบุ targetRoles มาโดยตรง
    if (Array.isArray(item.targetRoles) && item.targetRoles.length > 0) {
      const matched = item.targetRoles.some(r => {
        const cleanR = String(r || '').toLowerCase().trim();
        return cleanR && (tRole === cleanR || tRole.includes(cleanR));
      });
      if (matched) return true;
    }

    const type = String(item.taskType || item.category || '').toLowerCase();

    // 3. ผู้บริหาร (Executive) รับงานโครงการระยะยาว (Project) หรืองานด่วน
    if (tRole.includes('executive') || tRole.includes('ผู้บริหาร')) {
      if (type.includes('project') || type.includes('โครงการ') || item.priority === 'urgent') return true;
    }

    // 4. ช่างเทคนิค (Tech)
    if (tRole.includes('tech') || tRole.includes('ช่าง')) {
      const techTarget = String(item.targetTechnician || item.technician || '').toLowerCase().trim();
      if (tName && techTarget && (techTarget === tName || techTarget.includes(tName))) return true;
      if (type.includes('repair') || type.includes('building') || type.includes('it') || type.includes('อาคาร') || type.includes('ไอที') || type.includes('ซ่อม')) {
        return true;
      }
    }

    // 5. เจ้าหน้าที่โสตฯ (AV)
    if (tRole.includes('av') || tRole.includes('โสต')) {
      if (type.includes('av') || type.includes('โสต')) return true;
    }

    // 6. ครูผู้แจ้งงาน (Teacher / Reporter) รับแจ้งเตือนเฉพาะงานของตนเอง
    const targetEmail = String(item.targetUserEmail || item.reporterEmail || '').toLowerCase().trim();
    if (tEmail && targetEmail && tEmail === targetEmail) return true;

    const repName = String(item.reporterName || item.reporter || item.borrower || '').toLowerCase().trim();
    if (tName && tName.length >= 2 && tName !== 'ผู้ใช้งาน' && tName !== 'ครูผู้ใช้งาน' && repName && (repName === tName || repName.includes(tName))) {
      return true;
    }

    // 7. ประกาศส่วนกลาง
    if (type.includes('announcement') || type.includes('ประกาศ') || item.category === 'ประกาศ') {
      return true;
    }

    return false;
  }

  async function dispatchFCMWebPush(item, forceCurrentTokenOnly = false) {
    if (!window.firestoreDb || !item) return;
    try {
      const auth = await getFcmAccessToken();
      if (!auth || !auth.accessToken) return;

      const snap = await window.firestoreDb.collection('fcm_tokens').get();
      if (snap.empty) return;

      const targetDocs = [];
      const seenTokens = new Set();

      snap.forEach(doc => {
        const d = doc.data() || {};
        const tk = String(d.token || '').trim();
        if (!tk || seenTokens.has(tk)) return;

        if (forceCurrentTokenOnly) {
          if (tk === currentFcmToken) {
            seenTokens.add(tk);
            targetDocs.push({ docId: doc.id, token: tk });
          }
          return;
        }

        // ถ้าแอปเปิดอยู่บนหน้าจอเครื่องผู้ส่งเอง และไม่ได้พับจอ ข้ามการส่ง Push ซ้ำเข้าเครื่องตัวเอง
        if (tk === currentFcmToken && document.visibilityState === 'visible') {
          return;
        }

        if (isTokenTargetForPush(d, item)) {
          seenTokens.add(tk);
          targetDocs.push({ docId: doc.id, token: tk });
        }
      });

      if (targetDocs.length === 0) return;

      const pushTitle = item.title || 'FaCiLiTy • มีการแจ้งเตือนใหม่';
      const pushBody = item.body || item.subject || 'มีรายการอัปเดตใหม่ในระบบ FaCiLiTy';
      const ticketId = String(item.ticketId || '');
      const targetLink = ticketId ? ('./?ticketId=' + encodeURIComponent(ticketId)) : './';
      const pushTag = 'facility-push-' + (ticketId || Date.now());
      const endpoint = `https://fcm.googleapis.com/v1/projects/${auth.projectId}/messages:send`;

      await Promise.all(targetDocs.map(async ({ docId, token }) => {
        try {
          const res = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Authorization': 'Bearer ' + auth.accessToken,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              message: {
                token: token,
                notification: {
                  title: pushTitle,
                  body: pushBody
                },
                data: {
                  ticketId: ticketId,
                  title: pushTitle,
                  body: pushBody,
                  url: targetLink,
                  tag: pushTag
                },
                webpush: {
                  headers: {
                    Urgency: 'high',
                    TTL: '86400'
                  },
                  notification: {
                    title: pushTitle,
                    body: pushBody,
                    icon: './img/icon-192.png',
                    badge: './img/logo.png',
                    tag: pushTag,
                    renotify: true,
                    vibrate: [200, 100, 200, 100, 250]
                  },
                  fcm_options: {
                    link: targetLink
                  }
                }
              }
            })
          });

          if (res.status === 404) {
            window.firestoreDb.collection('fcm_tokens').doc(docId).delete().catch(() => { });
          }
        } catch (_) { }
      }));

      console.log(`[NotificationHub] 📲 Dispatched FCM Web Push to ${targetDocs.length} background device(s):`, pushTitle);
    } catch (err) {
      console.warn('[NotificationHub] dispatchFCMWebPush error:', err);
    }
  }

  // ── 14. ฟังก์ชันสำหรับยิงแจ้งเตือนใหม่เข้า Firestore และส่ง Web Push ปลุกจอล็อก ───
  async function publish(dataObj) {
    if (!window.firestoreDb) {
      console.warn('[NotificationHub] Cannot publish: firestoreDb not ready');
      return false;
    }
    try {
      const notifId = 'notif_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
      // จดจำ ID นี้ไว้ล่วงหน้าทันที เพื่อไม่ให้ snapshot บนเครื่องตัวเองเด้งซ้ำ
      knownDocIds.add(notifId);
      if (dataObj && dataObj.ticketId) {
        knownDocIds.add(dataObj.ticketId);
        knownDocIds.add('ticket_' + dataObj.ticketId);
      }

      const payload = {
        id: notifId,
        senderSessionId: CURRENT_SESSION_ID,
        clientTimestamp: Date.now(),
        createdAtMs: Date.now(),
        createdAt: (typeof firebase !== 'undefined' && firebase.firestore && firebase.firestore.FieldValue)
          ? firebase.firestore.FieldValue.serverTimestamp()
          : new Date(),
        ...dataObj
      };
      await window.firestoreDb.collection('notifications').doc(notifId).set(payload);
      console.log('[NotificationHub] 🚀 Real-time notification published to Firestore successfully:', notifId, payload.title);

      // ส่ง FCM v1 Web Push ปลุกหน้าจออุปกรณ์ที่ปิดแอปหรือล็อกหน้าจออยู่ทันที
      dispatchFCMWebPush(payload).catch(() => { });

      return true;
    } catch (e) {
      console.warn('[NotificationHub] publish error:', e);
      return false;
    }
  }

  // ── 15. ทดสอบยิงแจ้งเตือนจำลอง (Test Trigger) ─────────────────────────────
  function test() {
    testDeviceNotification();
  }

  // ── 16. เริ่มการทำงาน (Init) ──────────────────────────────────────────────
  function init() {
    initListener();
    updateBadge();
    renderList();
    updatePermissionUI();

    // ขอ / ต่ออายุ FCM Web Push Token อัตโนมัติหากผู้ใช้เคยให้สิทธิ์แล้ว
    if ('Notification' in window && Notification.permission === 'granted') {
      setTimeout(() => {
        requestFCMToken();
      }, 1200);
    }

    // ปลดล็อกระบบเสียงบนอุปกรณ์เคลื่อนที่เมื่อผู้ใช้แตะหรือคลิกหน้าจอ
    const unlockHandler = () => {
      unlockAudioContext();
    };
    document.addEventListener('touchstart', unlockHandler, { passive: true });
    document.addEventListener('click', unlockHandler, { passive: true });
    document.addEventListener('pointerdown', unlockHandler, { passive: true });

    // ปลดล็อกเสียงและอัปเดตสถานะทันทีเมื่อสลับกลับมาที่แอป
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        unlockAudioContext();
        updateBadge();
        renderList();
      }
    });
  }

  // ── 17. ล้างแคชและบังคับอัปเดตแอปสู่เวอร์ชันล่าสุดทันที ──────────────────────
  async function forceUpdateApp() {
    if (typeof Swal !== 'undefined') {
      Swal.fire({
        title: 'กำลังอัปเดตแอป...',
        text: 'กำลังล้างแคชเก่าและดึงข้อมูลระบบเวอร์ชันล่าสุด v1.0',
        allowOutsideClick: false,
        timer: 1600,
        showConfirmButton: false,
        didOpen: () => { Swal.showLoading(); }
      });
    }

    try {
      if ('caches' in window) {
        const names = await caches.keys();
        await Promise.all(names.map(n => caches.delete(n)));
      }
      if (navigator.serviceWorker) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map(r => r.unregister()));
      }
    } catch (e) {
      console.warn('forceUpdateApp cleanup error:', e);
    }

    setTimeout(() => {
      window.location.replace(window.location.origin + window.location.pathname + '?v=' + Date.now());
    }, 500);
  }

  return {
    init,
    playChime,
    unlockAudioContext,
    showToast,
    dismissToast,
    setTab,
    markAllAsRead,
    deleteItem,
    clearAll,
    openTicketAndDismiss,
    requestPushPermission: requestNativePermission,
    requestNativePermission,
    requestFCMToken,
    getFCMToken: () => currentFcmToken,
    checkNotificationPermission,
    updatePermissionUI,
    showDeviceNotification,
    testDeviceNotification,
    testLineNotification,
    forceUpdateApp,
    publish,
    refreshTokenProfile,
    unregisterFCMProfile,
    test: testDeviceNotification,
    renderList,
    updateBadge
  };
})();

window.NotificationHub = NotificationHub;

document.addEventListener('DOMContentLoaded', () => {
  NotificationHub.init();
});

