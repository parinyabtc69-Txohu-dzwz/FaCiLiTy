const fs = require('fs');

let homeHtml = fs.readFileSync('src/pages/page-home.html', 'utf8');
if (!homeHtml.includes('promptTrackTicket()')) {
  const trackBtn = `
          <button onclick="promptTrackTicket()"
            class="btn-card flex items-center p-5 border border-purple-100 rounded-2xl bg-white hover:bg-purple-50 hover:border-purple-300 transition-all text-left group shadow-sm col-span-1 md:col-span-2">
            <div
              class="icon-wrapper w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center text-xl mr-4 group-hover:scale-110 transition-transform">
              <i class="fa-solid fa-magnifying-glass"></i>
            </div>
            <div class="flex-grow">
              <span class="block text-base font-medium text-slate-800">ติดตามสถานะงาน (แชทโต้ตอบ)</span>
              <span class="block text-xs text-slate-500 font-light">ตรวจสอบสถานะการแจ้งซ่อม และสนทนากับช่างซ่อม</span>
            </div>
            <div class="text-slate-300 font-bold text-lg group-hover:text-purple-600">›</div>
          </button>
  `;
  // Let's just put it right after homeMenuGrid opening tag!
  homeHtml = homeHtml.replace('<div class="grid grid-cols-1 md:grid-cols-2 gap-4" id="homeMenuGrid">', '<div class="grid grid-cols-1 md:grid-cols-2 gap-4" id="homeMenuGrid">\n' + trackBtn);
  fs.writeFileSync('src/pages/page-home.html', homeHtml, 'utf8');
}
