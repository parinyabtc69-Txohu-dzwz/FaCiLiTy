const fs = require('fs');

let content = fs.readFileSync('index.html', 'utf8');

// 1. Replace the button
const oldButton = `          <button onclick="nav('page-advanced-manage')" id="gnav-advanced-manage"
            class="gmail-nav-item w-full hidden justify-between items-center px-4 py-2.5 rounded-r-full text-slate-700 hover:bg-slate-200/60 transition-colors text-sm font-normal">
            <div class="flex items-center gap-4">
              <i class="fa-solid fa-server w-5 text-center text-indigo-600"></i> จัดการระบบ IT/AV
            </div>
            <span id="badge-adv" class="hidden bg-fuchsia-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">0</span>
          </button>`;

const newButtons = `          <button onclick="nav('page-it-manage')" id="gnav-it-manage"
            class="gmail-nav-item w-full hidden justify-between items-center px-4 py-2.5 rounded-r-full text-slate-700 hover:bg-slate-200/60 transition-colors text-sm font-normal">
            <div class="flex items-center gap-4">
              <i class="fa-solid fa-desktop w-5 text-center text-sky-600"></i> จัดการงานซ่อม IT
            </div>
            <span id="badge-it-manage" class="hidden bg-fuchsia-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">0</span>
          </button>

          <button onclick="nav('page-av-repair-manage')" id="gnav-av-repair-manage"
            class="gmail-nav-item w-full hidden justify-between items-center px-4 py-2.5 rounded-r-full text-slate-700 hover:bg-slate-200/60 transition-colors text-sm font-normal">
            <div class="flex items-center gap-4">
              <i class="fa-solid fa-camera w-5 text-center text-amber-500"></i> จัดการงานซ่อมโสตฯ
            </div>
            <span id="badge-av-repair-manage" class="hidden bg-fuchsia-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">0</span>
          </button>

          <button onclick="nav('page-project-manage')" id="gnav-project-manage"
            class="gmail-nav-item w-full hidden justify-between items-center px-4 py-2.5 rounded-r-full text-slate-700 hover:bg-slate-200/60 transition-colors text-sm font-normal">
            <div class="flex items-center gap-4">
              <i class="fa-solid fa-building-circle-check w-5 text-center text-violet-500"></i> พิจารณาโครงการ
            </div>
            <span id="badge-project-manage" class="hidden bg-fuchsia-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">0</span>
          </button>`;

content = content.replace(oldButton, newButtons);

// 2. Replace navigation mapping
const oldMapping = "'page-advanced-manage': 'gnav-advanced-manage',";
const newMapping = "'page-it-manage': 'gnav-it-manage',\n    'page-av-repair-manage': 'gnav-av-repair-manage',\n    'page-project-manage': 'gnav-project-manage',";
content = content.replace(oldMapping, newMapping);

// 3. Replace show logic globally
const oldShow = /if \(\$\('gnav-advanced-manage'\)\) \{ \$\('gnav-advanced-manage'\)\.classList\.remove\('hidden'\); \$\('gnav-advanced-manage'\)\.classList\.add\('flex'\); \}/g;
const newShow = `if ($('gnav-it-manage')) { $('gnav-it-manage').classList.remove('hidden'); $('gnav-it-manage').classList.add('flex'); }
    if ($('gnav-av-repair-manage')) { $('gnav-av-repair-manage').classList.remove('hidden'); $('gnav-av-repair-manage').classList.add('flex'); }
    if ($('gnav-project-manage')) { $('gnav-project-manage').classList.remove('hidden'); $('gnav-project-manage').classList.add('flex'); }`;
content = content.replace(oldShow, newShow);

// 4. Replace hide logic globally
const oldHide = /if \(\$\('gnav-advanced-manage'\)\) \$\('gnav-advanced-manage'\)\.classList\.add\('hidden'\);/g;
const newHide = `if ($('gnav-it-manage')) $('gnav-it-manage').classList.add('hidden');
    if ($('gnav-av-repair-manage')) $('gnav-av-repair-manage').classList.add('hidden');
    if ($('gnav-project-manage')) $('gnav-project-manage').classList.add('hidden');`;
content = content.replace(oldHide, newHide);

// 5. Replace references to nav('page-advanced-manage') in main.js
let mainJs = fs.readFileSync('src/js/modules/main.js', 'utf8');

// The active classes in main.js for nav elements
// const advNav = $('gnav-advanced-manage');
mainJs = mainJs.replace(/const advNav = \$\('gnav-advanced-manage'\);/, "const itNav = $('gnav-it-manage'); const avRepairNav = $('gnav-av-repair-manage'); const projNav = $('gnav-project-manage');");
mainJs = mainJs.replace(/if \(advNav\) advNav\.classList\.remove\('bg-slate-200\/60', 'font-medium'\);/, "if (itNav) itNav.classList.remove('bg-slate-200/60', 'font-medium');\n  if (avRepairNav) avRepairNav.classList.remove('bg-slate-200/60', 'font-medium');\n  if (projNav) projNav.classList.remove('bg-slate-200/60', 'font-medium');");
mainJs = mainJs.replace(/if \(pageId === 'page-advanced-manage' \&\& advNav\) advNav\.classList\.add\('bg-slate-200\/60', 'font-medium'\);/, "if (pageId === 'page-it-manage' && itNav) itNav.classList.add('bg-slate-200/60', 'font-medium');\n    if (pageId === 'page-av-repair-manage' && avRepairNav) avRepairNav.classList.add('bg-slate-200/60', 'font-medium');\n    if (pageId === 'page-project-manage' && projNav) projNav.classList.add('bg-slate-200/60', 'font-medium');");

fs.writeFileSync('index.html', content, 'utf8');
fs.writeFileSync('src/js/modules/main.js', mainJs, 'utf8');

console.log("Sidebar patched successfully.");
