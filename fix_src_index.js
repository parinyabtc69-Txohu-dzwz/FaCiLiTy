const fs = require('fs');
let html = fs.readFileSync('src/index.html', 'utf8');

// Replace button
const btnSearch = /<button onclick="nav\('page-advanced-manage'\)" id="gnav-advanced-manage"[\s\S]*?<\/button>/;
const btnReplace = `<button onclick="nav('page-it-manage')" id="gnav-it-manage" class="gmail-nav-item w-full hidden justify-between items-center px-4 py-2.5 rounded-r-full text-slate-700 hover:bg-slate-200/60 transition-colors text-sm font-normal">
            <div class="flex items-center gap-4"><i class="fa-solid fa-desktop w-5 text-center text-sky-600"></i> จัดการงานซ่อม IT</div>
          </button>
          <button onclick="nav('page-av-repair-manage')" id="gnav-av-repair-manage" class="gmail-nav-item w-full hidden justify-between items-center px-4 py-2.5 rounded-r-full text-slate-700 hover:bg-slate-200/60 transition-colors text-sm font-normal">
            <div class="flex items-center gap-4"><i class="fa-solid fa-camera w-5 text-center text-amber-500"></i> จัดการงานซ่อมโสตฯ</div>
          </button>
          <button onclick="nav('page-project-manage')" id="gnav-project-manage" class="gmail-nav-item w-full hidden justify-between items-center px-4 py-2.5 rounded-r-full text-slate-700 hover:bg-slate-200/60 transition-colors text-sm font-normal">
            <div class="flex items-center gap-4"><i class="fa-solid fa-building-circle-check w-5 text-center text-violet-500"></i> พิจารณาโครงการ</div>
          </button>`;
html = html.replace(btnSearch, btnReplace);

// Replace menu map
const menuMapSearch = /'page-advanced-manage': 'gnav-advanced-manage',/;
const menuMapReplace = `'page-it-manage': 'gnav-it-manage',\n    'page-av-repair-manage': 'gnav-av-repair-manage',\n    'page-project-manage': 'gnav-project-manage',`;
html = html.replace(menuMapSearch, menuMapReplace);

// Replace login toggles
const loginToggleSearch = /if \(\$\('gnav-advanced-manage'\)\) \{ \$\('gnav-advanced-manage'\)\.classList\.remove\('hidden'\); \$\('gnav-advanced-manage'\)\.classList\.add\('flex'\); \}/g;
const loginToggleReplace = `
    if ($('gnav-it-manage')) { $('gnav-it-manage').classList.remove('hidden'); $('gnav-it-manage').classList.add('flex'); }
    if ($('gnav-av-repair-manage')) { $('gnav-av-repair-manage').classList.remove('hidden'); $('gnav-av-repair-manage').classList.add('flex'); }
    if ($('gnav-project-manage')) { $('gnav-project-manage').classList.remove('hidden'); $('gnav-project-manage').classList.add('flex'); }
`;
html = html.replace(loginToggleSearch, loginToggleReplace);

// Replace logout toggles
const logoutToggleSearch = /if \(\$\('gnav-advanced-manage'\)\) \$\('gnav-advanced-manage'\)\.classList\.add\('hidden'\);/g;
const logoutToggleReplace = `
    if ($('gnav-it-manage')) $('gnav-it-manage').classList.add('hidden');
    if ($('gnav-av-repair-manage')) $('gnav-av-repair-manage').classList.add('hidden');
    if ($('gnav-project-manage')) $('gnav-project-manage').classList.add('hidden');
`;
html = html.replace(logoutToggleSearch, logoutToggleReplace);

fs.writeFileSync('src/index.html', html, 'utf8');
console.log('src/index.html fixed!');
