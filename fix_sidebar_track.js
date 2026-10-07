const fs = require('fs');

let indexHtml = fs.readFileSync('src/index.html', 'utf8');

if (!indexHtml.includes('gnav-track-ticket')) {
  const trackNav = `
          <button onclick="promptTrackTicket()" id="gnav-track-ticket"
            class="gmail-nav-item w-full flex items-center gap-4 px-4 py-2.5 rounded-r-full text-slate-700 hover:bg-slate-200/60 transition-colors text-sm font-bold text-purple-600 bg-purple-50">
            <i class="fa-solid fa-magnifying-glass w-5 text-center text-purple-600"></i> ติดตามสถานะงาน (แชทโต้ตอบ)
          </button>
  `;
  indexHtml = indexHtml.replace(/<button onclick="nav\('page-home'\)" id="gnav-home"[\s\S]*?<\/button>\s*/, match => match + trackNav);
  fs.writeFileSync('src/index.html', indexHtml, 'utf8');
}
