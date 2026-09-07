// === QR Code Scanner ===
let html5QrcodeScanner = null;
let currentQrTargetId = null;

function openQrScanner(targetId) {
  currentQrTargetId = targetId;
  const modal = document.getElementById('qrScannerModal');
  if (modal) modal.classList.remove('hidden');

  if (!html5QrcodeScanner) {
    html5QrcodeScanner = new Html5Qrcode("qr-reader");
  }

  const qrCodeSuccessCallback = (decodedText, decodedResult) => {
    // กำหนดค่าที่สแกนได้ลงใน input ที่เรียกใช้งาน
    const targetInput = document.getElementById(currentQrTargetId);
    if (targetInput) {
      targetInput.value = decodedText;
      // Trigger event input เพื่อให้อัปเดต UI ถ้ามีการจับ event ไว้
      targetInput.dispatchEvent(new Event('input'));
    }
    closeQrScanner();
    Swal.fire({
      icon: 'success',
      title: 'สแกนสำเร็จ',
      text: 'ได้ข้อมูล: ' + decodedText,
      timer: 1500,
      showConfirmButton: false
    });
  };

  const config = { fps: 10, qrbox: { width: 250, height: 250 } };
  
  html5QrcodeScanner.start({ facingMode: "environment" }, config, qrCodeSuccessCallback)
    .catch((err) => {
      console.error("Error starting QR scanner: ", err);
      Swal.fire('ข้อผิดพลาด', 'ไม่สามารถเข้าถึงกล้องได้ หรือไม่มีกล้อง', 'error');
    });
}

function closeQrScanner() {
  const modal = document.getElementById('qrScannerModal');
  if (modal) modal.classList.add('hidden');
  if (html5QrcodeScanner) {
    html5QrcodeScanner.stop().then((ignore) => {
      // QR Code scanning is stopped.
    }).catch((err) => {
      // Stop failed
    });
  }
}
