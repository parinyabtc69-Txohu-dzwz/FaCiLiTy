// FaCiLiTy PWA Install Module
// Developed by Taohx_dz_parinya

let deferredInstallPrompt = null;

/**
 * ตรวจสอบว่าแอปทำงานในโหมด Standalone (ติดตั้งเป็นไอคอนแล้ว) หรือไม่
 */
function isAppInstalled() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true ||
    document.referrer.includes('android-app://')
  );
}

/**
 * ตรวจสอบว่าเป็นอุปกรณ์ iOS (iPhone / iPad / iPod) หรือไม่
 */
function isIOS() {
  const userAgent = window.navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod/.test(userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

/**
 * แสดงปุ่มติดตั้งแอปในทุกจุด
 */
function showInstallButtons() {
  if (isAppInstalled()) {
    hideInstallButtons();
    return;
  }
  const headerBtn = document.getElementById('btn-pwa-install-header');
  const sidebarBtn = document.getElementById('btn-pwa-install-sidebar');
  const dropdownBtn = document.getElementById('btn-pwa-install-dropdown');

  if (headerBtn) headerBtn.classList.remove('hidden');
  if (sidebarBtn) sidebarBtn.classList.remove('hidden');
  if (dropdownBtn) dropdownBtn.classList.remove('hidden');
}

/**
 * ซ่อนปุ่มติดตั้งแอปทุกจุด
 */
function hideInstallButtons() {
  const headerBtn = document.getElementById('btn-pwa-install-header');
  const sidebarBtn = document.getElementById('btn-pwa-install-sidebar');
  const dropdownBtn = document.getElementById('btn-pwa-install-dropdown');

  if (headerBtn) headerBtn.classList.add('hidden');
  if (sidebarBtn) sidebarBtn.classList.add('hidden');
  if (dropdownBtn) dropdownBtn.classList.add('hidden');
}

/**
 * ฟังก์ชันหลักเมื่อผู้ใช้กดปุ่ม 'ติดตั้งแอป'
 */
async function triggerPWAInstall() {
  // หากติดตั้งแล้ว ให้แจ้งเตือนว่ามีแอปอยู่แล้ว
  if (isAppInstalled()) {
    if (typeof Swal !== 'undefined') {
      Swal.fire({
        icon: 'info',
        title: 'ติดตั้งแล้ว',
        text: 'แอป FaCiLiTy อยู่บนหน้าจอหลักของคุณแล้ว สามารถเปิดใช้งานได้โดยตรง',
        confirmButtonColor: '#265D5A',
        confirmButtonText: 'ตกลง'
      });
    }
    return;
  }

  // กรณีเป็น Android / Chrome / Edge และมี Event prompt พร้อม
  if (deferredInstallPrompt) {
    try {
      deferredInstallPrompt.prompt();
      const choiceResult = await deferredInstallPrompt.userChoice;
      if (choiceResult && choiceResult.outcome === 'accepted') {
        console.log('[PWA] ผู้ใช้ยอมรับการติดตั้งแอป');
        hideInstallButtons();
      } else {
        console.log('[PWA] ผู้ใช้ยกเลิกการติดตั้งแอป');
      }
    } catch (err) {
      console.warn('[PWA] ข้อผิดพลาดขณะเรียก prompt:', err);
    }
    deferredInstallPrompt = null;
    return;
  }

  // กรณีเป็น iOS Safari (iPhone / iPad)
  if (isIOS()) {
    openIosInstallModal();
    return;
  }

  // กรณีอื่นๆ (เช่น Desktop ที่ยังไม่ trigger หรือเบราว์เซอร์อื่นๆ)
  if (typeof Swal !== 'undefined') {
    Swal.fire({
      icon: 'info',
      title: 'ติดตั้งแอปลงหน้าจอหลัก',
      html: `
        <div class="text-left text-sm space-y-3 text-slate-700 leading-relaxed">
          <div class="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <p class="font-bold text-[#265D5A] mb-1"><i class="fa-brands fa-chrome mr-1"></i> บนมือถือ Android (Chrome):</p>
            <p class="text-xs text-slate-600">กดปุ่มเมนู 3 จุด (<i class="fa-solid fa-ellipsis-vertical"></i>) ที่มุมขวาบนของเบราว์เซอร์ แล้วเลือก <b>"เพิ่มลงในหน้าจอหลัก"</b> หรือ <b>"ติดตั้งแอปพลิเคชัน"</b></p>
          </div>
          <div class="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <p class="font-bold text-[#265D5A] mb-1"><i class="fa-solid fa-desktop mr-1"></i> บนคอมพิวเตอร์ (Chrome / Edge):</p>
            <p class="text-xs text-slate-600">คลิกที่ไอคอนติดตั้ง <i class="fa-solid fa-download text-[#265D5A]"></i> บริเวณด้านขวาสุดของแถบกรอกที่อยู่เว็บ (Address bar) แล้วคลิก <b>"ติดตั้ง"</b></p>
          </div>
        </div>
      `,
      confirmButtonColor: '#265D5A',
      confirmButtonText: 'เข้าใจแล้ว'
    });
  }
}

/**
 * เปิดหน้าต่างแนะนำการติดตั้งบน iOS Safari
 */
function openIosInstallModal() {
  const modal = document.getElementById('iosInstallModal');
  if (modal) {
    modal.classList.remove('hidden');
    modal.classList.add('flex');
  }
}

/**
 * ปิดหน้าต่างแนะนำการติดตั้งบน iOS Safari
 */
function closeIosInstallModal() {
  const modal = document.getElementById('iosInstallModal');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
}

// ----------------- Event Listeners -----------------

// ดักจับ Event เมื่อเบราว์เซอร์พร้อมติดตั้ง
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredInstallPrompt = e;
  console.log('[PWA] beforeinstallprompt event captured');
  showInstallButtons();
});

// ดักจับเมื่อผู้ใช้ติดตั้งสำเร็จ
window.addEventListener('appinstalled', () => {
  console.log('[PWA] ติดตั้งแอป FaCiLiTy สำเร็จแล้ว!');
  deferredInstallPrompt = null;
  hideInstallButtons();
  if (typeof Swal !== 'undefined') {
    Swal.fire({
      icon: 'success',
      title: 'ติดตั้งสำเร็จ!',
      text: 'ไอคอนแอป FaCiLiTy ถูกเพิ่มไปยังหน้าจอหลักของคุณแล้ว สามารถเปิดใช้งานได้ตลอดเวลา',
      confirmButtonColor: '#265D5A',
      confirmButtonText: 'ตกลง'
    });
  }
});

// เริ่มต้นระบบเมื่อโหลดหน้าเสร็จ
window.addEventListener('DOMContentLoaded', () => {
  // หากติดตั้งแล้ว ให้ซ่อนปุ่ม แต่ถ้ายัง ให้แสดงปุ่มในทุกแพลตฟอร์ม
  if (isAppInstalled()) {
    hideInstallButtons();
  } else {
    showInstallButtons();
  }
});

// ลงทะเบียน Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => {
        console.log('[PWA] Service Worker ทำงานเรียบร้อย Scope:', reg.scope);
      })
      .catch(err => {
        console.warn('[PWA] Service Worker เกิดข้อผิดพลาด:', err);
      });
  });
}
