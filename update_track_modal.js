const fs = require('fs');

// 1. Update page-home.html
let homeHtml = fs.readFileSync('src/pages/page-home.html', 'utf8');

// Replace QR button with Track Modal button
homeHtml = homeHtml.replace(
  /<button onclick="quickScanQr\(\)" class="bg-\[#265D5A\] hover:bg-\[#1a3f3d\] text-white px-6 py-3 rounded-2xl font-bold flex items-center justify-center gap-3 transition-colors shadow-md mx-auto w-full md:w-auto">[\s\S]*?<\/button>/,
  `<button onclick="openTrackModal()" class="bg-[#265D5A] hover:bg-[#1a3f3d] text-white px-8 py-3.5 rounded-2xl font-bold flex items-center justify-center gap-3 transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-1 mx-auto w-full md:w-auto">
            <i class="fa-solid fa-magnifying-glass text-xl"></i> <span>ติดตามงานซ่อม / แชทกับช่าง</span>
          </button>`
);

// Remove the purple button card (lines 20-31 basically)
homeHtml = homeHtml.replace(/<button onclick="promptTrackTicket\(\)"[\s\S]*?<\/button>/, '');

fs.writeFileSync('src/pages/page-home.html', homeHtml, 'utf8');

// 2. Add Modal to src/index.html
let indexHtml = fs.readFileSync('src/index.html', 'utf8');
if (!indexHtml.includes('trackTicketModal')) {
  const modalHtml = `
  <!-- Track Ticket Modal -->
  <div id="trackTicketModal" class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center hidden">
    <div class="bg-white rounded-2xl w-full max-w-md mx-4 overflow-hidden shadow-2xl transform transition-all">
      <div class="p-8 text-center">
        <h3 class="font-bold text-2xl text-slate-800 mb-2">ติดตามงาน / แชทกับช่าง</h3>
        <p class="text-slate-500 mb-6">โปรดระบุเลข Ticket ID ของคุณ</p>
        <input type="text" id="trackTicketInput" placeholder="เช่น REP-A8F2Z" 
          class="w-full text-center text-lg font-bold p-4 border-2 border-slate-200 rounded-xl focus:border-[#265D5A] focus:outline-none mb-6">
        <div class="flex gap-4 justify-center">
          <button onclick="submitTrackModal()" class="bg-[#265D5A] hover:bg-[#1a3f3d] text-white font-bold py-3 px-8 rounded-xl transition-colors shadow-md">
            ค้นหา
          </button>
          <button onclick="closeTrackModal()" class="bg-slate-500 hover:bg-slate-600 text-white font-bold py-3 px-8 rounded-xl transition-colors shadow-md">
            ยกเลิก
          </button>
        </div>
      </div>
    </div>
  </div>
`;
  indexHtml = indexHtml.replace('</body>', modalHtml + '\n</body>');
  fs.writeFileSync('src/index.html', indexHtml, 'utf8');
}

// 3. Update main.js
let mainJs = fs.readFileSync('src/js/modules/main.js', 'utf8');

const jsLogic = `
window.openTrackModal = function() {
  const modal = document.getElementById('trackTicketModal');
  if(modal) {
    modal.classList.remove('hidden');
    const input = document.getElementById('trackTicketInput');
    if(input) {
      input.value = '';
      input.focus();
    }
  }
};

window.closeTrackModal = function() {
  const modal = document.getElementById('trackTicketModal');
  if(modal) modal.classList.add('hidden');
};

window.submitTrackModal = async function() {
  const input = document.getElementById('trackTicketInput');
  const btn = event.currentTarget;
  if(!input) return;
  const ticketId = input.value.trim().toUpperCase();
  
  if(!ticketId) {
    alert('กรุณาระบุเลขที่ตั๋วงาน');
    return;
  }
  
  // Show loading
  const originalText = btn.innerHTML;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
  btn.disabled = true;
  
  try {
    const doc = await firestoreDb.collection('tickets').doc(ticketId).get();
    if (doc.exists) {
      const token = doc.data().token;
      if (token) {
        closeTrackModal();
        nav('page-ticket', { id: ticketId, token: token });
      } else {
        alert('ไม่พบ Token ของตั๋วงานนี้');
      }
    } else {
      alert('ไม่พบเลขที่ตั๋วงานนี้ในระบบ');
    }
  } catch (err) {
    alert('เกิดข้อผิดพลาด: ' + err.message);
  } finally {
    btn.innerHTML = originalText;
    btn.disabled = false;
  }
};
`;

// Replace promptTrackTicket with the new functions
mainJs = mainJs.replace(/window\.promptTrackTicket = async function\(\) \{[\s\S]*?\};\s*/, jsLogic);

fs.writeFileSync('src/js/modules/main.js', mainJs, 'utf8');

console.log('UI updated for Track Modal');
