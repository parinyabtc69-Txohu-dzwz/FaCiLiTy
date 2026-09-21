const fs = require('fs');
let content = fs.readFileSync('src/js/modules/main.js', 'utf8');

// 1. Add window.advTasksData
content = content.replace(/const data = await ResourceHubCore\.api\.get\('get_adv_tasks'\);/g, "const data = await ResourceHubCore.api.get('get_adv_tasks'); window.advTasksData = data;");

// 2. Inject details into updateAdvTask
const searchReg = /window\.updateAdvTask = async function \(type, index, currentStatus\) \{\s*const r = await Swal\.fire\(\{\s*title: 'อัปเดตสถานะ',\s*showDenyButton: true,/m;

const replacement = `window.updateAdvTask = async function (type, index, currentStatus) {
  let taskData = null;
  if (window.advTasksData) {
    if (type === 'it' && window.advTasksData.it) taskData = window.advTasksData.it[index];
    else if (type === 'project' && window.advTasksData.project) taskData = window.advTasksData.project[index];
    else if (type === 'av-repair' && window.advTasksData.av) taskData = window.advTasksData.av[index];
  }

  let detailsHtml = '';
  if (taskData) {
    const subject = taskData[1] || '-';
    const detail = taskData[2] || '-';
    const reporter = taskData[3] || '-';
    const timestamp = taskData[0] || '-';
    detailsHtml = \`
      <div class="text-left mb-5 p-4 bg-slate-50 rounded-xl border border-slate-200 shadow-sm">
        <div class="font-bold text-slate-800 mb-1 text-base">\${subject}</div>
        <div class="text-sm text-slate-600 mb-3 whitespace-pre-wrap">\${detail}</div>
        <div class="text-xs font-semibold text-slate-500 flex items-center gap-1">
          <i class="fa-solid fa-user text-slate-400"></i> \${reporter} &nbsp;&nbsp;|&nbsp;&nbsp; 
          <i class="fa-regular fa-clock text-slate-400"></i> \${timestamp}
        </div>
      </div>
    \`;
  }

  const r = await Swal.fire({
    title: 'อัปเดตสถานะ',
    html: detailsHtml,
    showDenyButton: true,`;

if (searchReg.test(content)) {
  content = content.replace(searchReg, replacement);
  fs.writeFileSync('src/js/modules/main.js', content, 'utf8');
  console.log('Replaced successfully');
} else {
  console.log('Could not find search string');
}
