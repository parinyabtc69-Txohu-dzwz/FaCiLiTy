// ============================================================================
// 🔔 FaCiLiTy Real-Time In-App Notification Hub & Web Push Center
// พัฒนาโดย: Taohx_dz_parinya | AI Assistant: Antigravity
// ฟรี 100% ไร้ขีดจำกัดโควต้า รองรับ In-App Toast, Web Audio Chime และ Service Worker
// ============================================================================

const NotificationHub = (function() {
  // สถานะภายในของระบบ
  let notifications = [];
  let currentTab = 'all'; // 'all' | 'unread' | 'my'
  let isListenerActive = false;
  let audioContextInstance = null;

  // คีย์สำหรับเก็บประวัติที่อ่านแล้วในเครื่อง
  const STORAGE_READ_KEY = 'facility_read_notif_ids_v1';
  const STORAGE_SOUND_KEY = 'facility_notif_sound_enabled';

  // ── 1. ระบบจำสถานะการอ่าน (Read / Unread) ─────────────────────────────────
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
      } catch (e) {}
    }
  }

  // ── 2. ระบบเสียงแจ้งเตือนสังเคราะห์ (Web Audio API Chime) ─────────────────
  // ไม่ต้องดาวน์โหลดไฟล์ภายนอก โหลดเร็วระดับ 0ms และไม่ติดปัญหาลิขสิทธิ์
  function playChime() {
    try {
      const soundEnabled = localStorage.getItem(STORAGE_SOUND_KEY) !== 'false';
      if (!soundEnabled) return;

      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;

      if (!audioContextInstance || audioContextInstance.state === 'suspended') {
        audioContextInstance = new AudioCtx();
      }
      const ctx = audioContextInstance;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const now = ctx.currentTime;

      // ตัวโน้ตที่ 1: D5 (587.33 Hz) เสียงกระดิ่งแรก
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now);
      gain1.gain.setValueAtTime(0.12, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.35);

      // ตัวโน้ตที่ 2: A5 (880.00 Hz) คู่ฮาร์มอนิกก้องกังวานแบบ Messenger
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880.00, now + 0.09);
      gain2.gain.setValueAtTime(0.15, now + 0.09);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.09);
      osc2.stop(now + 0.6);

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

  // ── 6. อัปเดตตัวเลขแจ้งเตือนที่ปุ่มกระดิ่ง (Badge Counter) ───────────────────
  function updateBadge() {
    const readIds = getReadIds();
    const unreadCount = notifications.filter(n => !readIds.includes(n.id)).length;

    const globalBadge = document.getElementById('global-overdue-badge');
    if (globalBadge) {
      if (unreadCount > 0) {
        globalBadge.textContent = unreadCount > 99 ? '99+' : unreadCount;
        globalBadge.classList.remove('hidden');
      } else {
        globalBadge.classList.add('hidden');
      }
    }

    const dropdownCount = document.getElementById('dropdown-unread-count');
    if (dropdownCount) {
      if (unreadCount > 0) {
        dropdownCount.textContent = `${unreadCount} ใหม่`;
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
    const myName = (window.currentTeacher || '').toLowerCase();
    const myEmail = (window.currentEmail || '').toLowerCase();

    let filtered = notifications;
    if (currentTab === 'unread') {
      filtered = notifications.filter(n => !readIds.includes(n.id));
    } else if (currentTab === 'my') {
      filtered = notifications.filter(n => {
        const rName = (n.reporterName || '').toLowerCase();
        const rEmail = (n.reporterEmail || n.targetUserEmail || '').toLowerCase();
        const tTech = (n.targetTechnician || '').toLowerCase();
        return (myName && (rName.includes(myName) || tTech.includes(myName))) ||
               (myEmail && rEmail === myEmail);
      });
    }

    if (filtered.length === 0) {
      listEl.innerHTML = `
        <div class="p-8 text-center text-slate-400 text-xs">
          <i class="fa-regular fa-bell-slash text-2xl mb-2 text-slate-300 block"></i>
          ไม่มีการแจ้งเตือนในหมวดนี้
        </div>
      `;
      return;
    }

    let html = '';
    filtered.forEach(item => {
      const isRead = readIds.includes(item.id);
      const visuals = getCategoryVisuals(item.category, item.taskType);
      const timeStr = formatRelativeTime(item.createdAt);

      html += `
        <div onclick="NotificationHub.openTicketAndDismiss('${item.ticketId || ''}', null, '${item.id || ''}')"
          class="p-2.5 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer flex items-start gap-3 relative ${isRead ? 'opacity-85' : 'bg-emerald-50/30'}">
          <div class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold" style="background-color: ${visuals.bg}; color: ${visuals.color};">
            <i class="fa-solid ${visuals.icon}"></i>
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between gap-1">
              <p class="text-xs font-bold text-slate-800 truncate">${item.title || 'แจ้งเตือน'}</p>
              <span class="text-[10px] text-slate-400 shrink-0">${timeStr}</span>
            </div>
            <p class="text-[11px] text-slate-600 line-clamp-1 mt-0.5">${item.body || item.subject || ''}</p>
            <div class="flex items-center gap-2 mt-1">
              <span class="text-[9px] font-semibold px-1.5 py-0.5 rounded" style="background-color: ${visuals.bg}; color: ${visuals.color};">
                ${visuals.label}
              </span>
              ${item.ticketId ? `<span class="text-[9px] text-slate-400">#${item.ticketId}</span>` : ''}
              ${item.reporterName ? `<span class="text-[9px] text-slate-400">โดย: ${item.reporterName}</span>` : ''}
            </div>
          </div>
          ${!isRead ? `<span class="w-2 h-2 rounded-full bg-emerald-500 absolute top-3 right-2" title="ยังไม่อ่าน"></span>` : ''}
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

  // ── 10. เปิดดูงานและทำเครื่องหมายว่าอ่านแล้ว ──────────────────────────────
  function openTicketAndDismiss(ticketId, toastId, notifId) {
    if (toastId) dismissToast(toastId);
    if (notifId) saveReadId(notifId);

    // ปิด dropdown หากเปิดอยู่
    const notifDropdown = document.getElementById('notification-dropdown');
    if (notifDropdown && !notifDropdown.classList.contains('hidden')) {
      notifDropdown.classList.add('hidden');
    }

    updateBadge();
    renderList();

    if (!ticketId) return;

    // เปิดดูรายละเอียดงานในระบบ TrackUI
    if (window.TrackUI && typeof window.TrackUI.showTicketDetailModal === 'function') {
      window.TrackUI.showTicketDetailModal(ticketId);
    } else if (typeof window.openTaskDetailModal === 'function') {
      window.openTaskDetailModal(ticketId);
    } else if (typeof window.nav === 'function') {
      window.nav('page-home');
    }
  }

  // ── 11. ตรวจสอบสิทธิ์ผู้รับตามบทบาทหน้าที่ (Role Filtering) ───────────────
  function isTargetRecipient(item) {
    const userRole = (window.currentRole || 'Teacher').toLowerCase();
    const userEmail = (window.currentEmail || '').toLowerCase();
    const userName = (window.currentTeacher || '').toLowerCase();

    // ผู้ดูแลระบบ (Admin/Supervisor) ได้รับทุกการแจ้งเตือนเสมอ
    if (userRole.includes('admin') || userRole.includes('supervisor')) return true;

    // ช่าง (Tech) รับงานตามสายงาน
    if (userRole.includes('tech')) {
      const type = (item.taskType || '').toLowerCase();
      const techName = (item.targetTechnician || '').toLowerCase();
      if (techName && techName.includes(userName)) return true;
      if (type.includes('repair') || type.includes('building') || type.includes('it')) return true;
    }

    // เจ้าหน้าที่โสตฯ (AV)
    if (userRole.includes('av')) {
      const type = (item.taskType || '').toLowerCase();
      if (type.includes('av')) return true;
    }

    // ครูผู้แจ้ง (Teacher / General User) ได้รับการแจ้งเตือนงานของตัวเอง
    if (item.targetUserEmail && item.targetUserEmail.toLowerCase() === userEmail) return true;
    if (item.reporterName && item.reporterName.toLowerCase().includes(userName)) return true;

    // หากไม่ระบุเป้าหมาย แสดงให้ทุกคนเห็น
    if (!item.targetRoles && !item.targetUserEmail && !item.targetTechnician) return true;

    return false;
  }

  // ── 12. ยิงส่ง Web Push ผ่าน Service Worker ────────────────────────────────
  function showWebPush(item) {
    try {
      if ('Notification' in window && Notification.permission === 'granted') {
        const title = item.title || 'FaCiLiTy • มีการแจ้งเตือนใหม่';
        const options = {
          body: item.body || item.subject || 'มีงานแจ้งซ่อมหรืออัปเดตใหม่ในระบบ',
          icon: './img/icon-192.png',
          badge: './img/logo.png',
          data: {
            url: window.location.origin + window.location.pathname + '?ticketId=' + encodeURIComponent(item.ticketId || ''),
            ticketId: item.ticketId
          }
        };

        if (navigator.serviceWorker && navigator.serviceWorker.controller) {
          navigator.serviceWorker.ready.then(reg => {
            reg.showNotification(title, options);
          });
        } else {
          new Notification(title, options);
        }
      }
    } catch (e) {
      console.warn('[NotificationHub] Web Push error:', e);
    }
  }

  function requestPushPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          showToast({
            title: '✅ เปิดรับการแจ้งเตือนสำเร็จ',
            body: 'คุณจะได้รับการแจ้งเตือนงานซ่อมแม้ขณะพับหน้าจอครับ',
            category: 'ทั่วไป'
          });
          playChime();
        }
      });
    }
  }

  // ── 13. เชื่อมต่อ Firebase Firestore Real-Time Listener ───────────────────
  function initListener() {
    if (isListenerActive || !window.firestoreDb) return;

    try {
      isListenerActive = true;
      let isFirstLoad = true;
      const initialTimestamp = Date.now();

      window.firestoreDb.collection('notifications')
        .orderBy('createdAt', 'desc')
        .limit(30)
        .onSnapshot(snapshot => {
          const newItems = [];
          snapshot.docChanges().forEach(change => {
            const data = change.doc.data();
            data.id = change.doc.id;

            if (change.type === 'added') {
              newItems.push(data);

              // ถ้าไม่ใช่การโหลดหน้าครั้งแรก และงานถูกสร้างใน 25 วินาทีล่าสุด
              if (!isFirstLoad) {
                let createdMs = 0;
                if (data.createdAt && data.createdAt.toMillis) createdMs = data.createdAt.toMillis();
                else if (data.createdAt) createdMs = new Date(data.createdAt).getTime();

                const isRecent = createdMs > (initialTimestamp - 20000);
                if (isRecent && isTargetRecipient(data)) {
                  showToast(data);
                  playChime();
                  showWebPush(data);
                }
              }
            }
          });

          // เรียงลำดับรายการทั้งหมดจากใหม่ไปเก่า
          notifications = snapshot.docs.map(doc => {
            const d = doc.data();
            d.id = doc.id;
            return d;
          });

          updateBadge();
          renderList();
          isFirstLoad = false;
        }, err => {
          console.warn('[NotificationHub] Firestore snapshot error:', err);
        });

      // ดักฟัง Ticket ใหม่ในตาราง tickets โดยตรงแบบ Real-time เผื่อกรณีสร้างงานซ่อม
      window.firestoreDb.collection('tickets')
        .orderBy('createdAt', 'desc')
        .limit(1)
        .onSnapshot(snap => {
          if (isFirstLoad) return;
          snap.docChanges().forEach(change => {
            if (change.type === 'added') {
              const ticket = change.doc.data();
              // ตรวจสอบว่ามี notification ในคอลเลกชัน notifications แล้วหรือยัง หากยังไม่มีให้เด้ง Toast
              const exists = notifications.some(n => n.ticketId === ticket.ticketId);
              if (!exists && ticket.ticketId) {
                const notifObj = {
                  id: 'local_' + ticket.ticketId,
                  ticketId: ticket.ticketId,
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
                }
              }
            }
          });
        }, () => {});

    } catch (e) {
      console.warn('[NotificationHub] Listener init failed:', e);
    }
  }

  // ── 14. ฟังก์ชันสำหรับยิงแจ้งเตือนใหม่เข้า Firestore ───────────────────────
  async function publish(dataObj) {
    if (!window.firestoreDb) return false;
    try {
      const notifId = 'notif_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
      const payload = {
        id: notifId,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        ...dataObj
      };
      await window.firestoreDb.collection('notifications').doc(notifId).set(payload);
      return true;
    } catch (e) {
      console.warn('[NotificationHub] publish error:', e);
      return false;
    }
  }

  // ── 15. ทดสอบยิงแจ้งเตือนจำลอง (Test Trigger) ─────────────────────────────
  function test() {
    playChime();
    showToast({
      id: 'test_' + Date.now(),
      ticketId: 'FAC-TEST-' + Math.floor(1000 + Math.random() * 9000),
      title: '🔔 ทดสอบการแจ้งเตือน (Real-Time)',
      body: 'ระบบ Pop-up Toast และเสียงเตือน Chime ทำงานได้ 100% แล้วครับ!',
      category: 'แอร์',
      taskType: 'building',
      location: 'ห้องศูนย์ควบคุม FaCiLiTy',
      createdAt: new Date()
    });
  }

  // ── 16. เริ่มการทำงาน (Init) ──────────────────────────────────────────────
  function init() {
    if (typeof window.firestoreDb !== 'undefined') {
      initListener();
    } else {
      setTimeout(init, 800);
    }
    updateBadge();
    renderList();
  }

  return {
    init,
    playChime,
    showToast,
    dismissToast,
    setTab,
    markAllAsRead,
    openTicketAndDismiss,
    requestPushPermission,
    publish,
    test,
    renderList,
    updateBadge
  };
})();

window.NotificationHub = NotificationHub;

document.addEventListener('DOMContentLoaded', () => {
  NotificationHub.init();
});

