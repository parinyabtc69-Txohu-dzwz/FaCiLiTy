const fs = require('fs');

let content = fs.readFileSync('src/js/modules/main.js', 'utf8');

// 1. menuMap update
content = content.replace(/'page-advanced-manage': 'gnav-advanced-manage',/g, "'page-it-manage': 'gnav-it-manage',\n    'page-av-repair-manage': 'gnav-av-repair-manage',\n    'page-project-manage': 'gnav-project-manage',");

// 2. Login toggles update
content = content.replace(/if \(\$\('gnav-advanced-manage'\)\) \{ \$\('gnav-advanced-manage'\)\.classList\.remove\('hidden'\); \$\('gnav-advanced-manage'\)\.classList\.add\('flex'\); \}/g, "if ($('gnav-it-manage')) { $('gnav-it-manage').classList.remove('hidden'); $('gnav-it-manage').classList.add('flex'); }\n    if ($('gnav-av-repair-manage')) { $('gnav-av-repair-manage').classList.remove('hidden'); $('gnav-av-repair-manage').classList.add('flex'); }\n    if ($('gnav-project-manage')) { $('gnav-project-manage').classList.remove('hidden'); $('gnav-project-manage').classList.add('flex'); }");

// 3. Logout toggles update
content = content.replace(/if \(\$\('gnav-advanced-manage'\)\) \$\('gnav-advanced-manage'\)\.classList\.add\('hidden'\);/g, "if ($('gnav-it-manage')) $('gnav-it-manage').classList.add('hidden');\n    if ($('gnav-av-repair-manage')) $('gnav-av-repair-manage').classList.add('hidden');\n    if ($('gnav-project-manage')) $('gnav-project-manage').classList.add('hidden');");

// 4. Navigation routing update (2 places)
content = content.replace(/\} else if \(pageId === 'page-advanced-manage'\) \{\s*loadAdvancedTasks\(\);\s*\}/g, "} else if (pageId === 'page-it-manage' || pageId === 'page-av-repair-manage' || pageId === 'page-project-manage') {\n    loadAdvancedTasks();\n  }");

// 5. loadAdvancedTasks update
const searchLoad = /async function loadAdvancedTasks\(\) \{\s*try \{\s*const data = await ResourceHubCore\.api\.get\('get_adv_tasks'\);\s*if \(data\.it\) renderAdvTable\('itTaskBody', data\.it, 'it'\);\s*if \(data\.projects\) renderAdvTable\('projectBody', data\.projects, 'project'\);\s*\} catch \(e\) \{\s*console\.error\('loadAdvancedTasks error:', e\);\s*\}\s*\}/g;

const replaceLoad = `async function loadAdvancedTasks() {
  try {
    const data = await ResourceHubCore.api.get('get_adv_tasks');
    window.advTasksData = data;
    if (window.applyAdvFilters) {
      window.applyAdvFilters('it');
      window.applyAdvFilters('project');
      window.applyAdvFilters('av-repair');
    }
  } catch (e) {
    console.error('loadAdvancedTasks error:', e);
  }
}`;
content = content.replace(searchLoad, replaceLoad);

// Append filter functions
const filterLogic = `
window.currentAdvFilters = {
  'it': { status: 'all', date: '', search: '', reporter: '' },
  'av-repair': { status: 'all', date: '', search: '', reporter: '' },
  'project': { status: 'all', date: '', search: '', reporter: '' }
};

window.filterAdvTab = function(type, status, btn) {
  window.currentAdvFilters[type].status = status;
  const containerId = type === 'it' ? 'itManageTabs' : (type === 'av-repair' ? 'avRepairManageTabs' : 'projectManageTabs');
  const container = document.getElementById(containerId);
  if (container) {
    container.querySelectorAll('button').forEach(b => {
      b.className = 'px-4 py-2 font-semibold text-slate-500 hover:text-slate-700 whitespace-nowrap';
    });
    btn.className = 'px-4 py-2 font-bold text-blue-600 border-b-2 border-blue-600 whitespace-nowrap';
  }
  window.applyAdvFilters(type);
};

window.applyAdvFilters = function(type) {
  if (!window.advTasksData || !window.advTasksData[type === 'av-repair' ? 'av' : type]) return;
  const allRows = window.advTasksData[type === 'av-repair' ? 'av' : type];
  const filters = window.currentAdvFilters[type];
  let filtered = allRows;
  
  if (filters.status === 'pending') filtered = filtered.filter(r => r[4] === 'รอดำเนินการ');
  else if (filters.status === 'progress') filtered = filtered.filter(r => r[4] === 'กำลังดำเนินการ');
  else if (filters.status === 'done') filtered = filtered.filter(r => ['เสร็จสิ้น', 'อนุมัติ', 'ไม่อนุมัติ', 'ยกเลิก'].includes(r[4]));
  
  if (filters.search) {
    const s = filters.search.toLowerCase();
    filtered = filtered.filter(r => (r[1] && r[1].toLowerCase().includes(s)) || (r[2] && r[2].toLowerCase().includes(s)));
  }
  if (filters.date) {
    const now = new Date();
    filtered = filtered.filter(r => {
      if (!r[0]) return false;
      const parts = r[0].split(' ');
      if (parts.length < 2) return true;
      const dateParts = parts[0].split('/');
      if (dateParts.length < 3) return true;
      const d = new Date(dateParts[2], dateParts[1] - 1, dateParts[0]);
      if (filters.date === 'today') return d.toDateString() === now.toDateString();
      if (filters.date === 'week') return (now - d) <= 7 * 24 * 60 * 60 * 1000;
      if (filters.date === 'month') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      return true;
    });
  }
  if (filters.reporter) {
    const s = filters.reporter.toLowerCase();
    filtered = filtered.filter(r => r[3] && r[3].toLowerCase().includes(s));
  }
  
  const tbodyId = type === 'it' ? 'itTaskBody' : (type === 'av-repair' ? 'avRepairTaskBody' : 'projectBody');
  if (window.renderAdvTableFiltered) window.renderAdvTableFiltered(tbodyId, filtered, type);
};

window.renderAdvTableFiltered = function(tbodyId, rows, type) {
  const tbody = document.getElementById(tbodyId);
  if (!tbody) return;
  if (!rows || !rows.length) {
    tbody.innerHTML = '<div class="p-8 text-center text-slate-500 bg-white">ไม่มีรายการที่ตรงกับเงื่อนไข</div>';
    return;
  }
  tbody.innerHTML = rows.map((r, i) => {
    const allData = window.advTasksData[type === 'av-repair' ? 'av' : type];
    const originalIndex = allData.indexOf(r);
    const timestamp = r[0] || '';
    const subject = r[1] || '';
    const detail = r[2] || '';
    const reporter = r[3] || '';
    const status = r[4] || '';
    const img = r[5] && r[5] !== '-' ? \`<a href="\${r[5]}" target="_blank" class="text-xs text-blue-500 bg-blue-50 px-2 py-1 rounded-md border border-blue-200 hover:bg-blue-100" onclick="event.stopPropagation();"><i class="fa-solid fa-image"></i> รูปภาพ</a>\` : '';
    const urgency = r[6] || '';
    const isDone = ['เสร็จสิ้น', 'อนุมัติ', 'ไม่อนุมัติ', 'ยกเลิก'].includes(status);
    const rowBg = isDone ? 'bg-white hover:bg-slate-50' : 'bg-rose-50/30 hover:bg-rose-50/60 font-medium';
    
    const getInitials = (name) => {
      if (!name) return 'U';
      const parts = name.trim().split(' ');
      if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
      return name.substring(0, 2).toUpperCase();
    };
    const getAvatarColor = (name) => {
      const colors = ['bg-[#265D5A]', 'bg-blue-600', 'bg-emerald-600', 'bg-violet-600', 'bg-rose-600', 'bg-amber-600', 'bg-cyan-600'];
      let hash = 0;
      for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
      return colors[Math.abs(hash) % colors.length];
    };
    const avatarColor = getAvatarColor(reporter);
    const isUnread = !isDone;
    let urgBadge = '';
    if (urgency === 'ด่วน') urgBadge = '<span class="text-rose-500 text-[10px] font-bold px-2 py-0.5 bg-rose-50 rounded-full border border-rose-100 ml-2">ด่วน</span>';
    
    return \`<div onclick="updateAdvTask('\${type}', \${originalIndex}, '\${status}')" class="\${rowBg} cursor-pointer p-4 flex gap-4 items-start transition-colors border-b border-slate-100 hover:bg-slate-50"><div class="flex-shrink-0 mt-1"><div class="w-12 h-12 rounded-full \${avatarColor} text-white flex items-center justify-center font-bold text-lg shadow-sm">\${getInitials(reporter)}</div></div><div class="flex-1 min-w-0"><div class="flex justify-between items-baseline mb-1"><h4 class="text-base \${isUnread ? 'font-bold text-slate-800' : 'font-semibold text-slate-700'} truncate pr-2 flex items-center">\${reporter} \${urgBadge}</h4><span class="text-xs text-slate-500 whitespace-nowrap">\${timestamp}</span></div><div class="text-sm \${isUnread ? 'font-bold text-slate-800' : 'font-semibold text-slate-600'} mb-1 truncate flex items-center gap-2">\${subject}\${img ? '<i class="fa-solid fa-paperclip text-slate-400" title="มีแนบ"></i>' : ''}</div><div class="text-sm text-slate-500 line-clamp-2 leading-relaxed mb-3">\${detail}</div><div class="flex flex-wrap gap-2 items-center">\${statusTagClass(status)}\${img}</div></div></div>\`;
  }).join('');
};
`;

if (!content.includes('window.currentAdvFilters = {')) {
  content += '\n' + filterLogic;
}

// 6. updateRepair
const searchRepair = /const r = await Swal\.fire\(\{ title: 'อัปเดตสถานะงาน', showDenyButton: true, showCancelButton: true, confirmButtonText: 'กำลังดำเนินการ', denyButtonText: 'เสร็จสิ้น \(แนบรูป\)', confirmButtonColor: '#3b82f6', denyButtonColor: '#10b981' \};/;
const replaceRepair = `const taskData = window.allRepairTasks ? window.allRepairTasks[index] : null;
      let detailsHtml = '';
      if (taskData) {
        const timestamp = taskData[0] || '-';
        const subject = taskData[1] || '-';
        const detail = taskData[2] || '-';
        const reporter = taskData[3] || '-';
        detailsHtml = \`<div class="text-left mb-5 p-4 bg-slate-50 rounded-xl border border-slate-200 shadow-sm"><div class="font-bold text-slate-800 mb-1 text-base">\${subject}</div><div class="text-sm text-slate-600 mb-3 whitespace-pre-wrap">\${detail}</div><div class="text-xs font-semibold text-slate-500 flex items-center gap-1"><i class="fa-solid fa-user text-slate-400"></i> \${reporter} &nbsp;&nbsp;|&nbsp;&nbsp;<i class="fa-regular fa-clock text-slate-400"></i> \${timestamp}</div></div>\`;
      }
      const r = await Swal.fire({ title: 'อัปเดตสถานะงาน', html: detailsHtml, showDenyButton: true, showCancelButton: true, confirmButtonText: 'กำลังดำเนินการ', denyButtonText: 'เสร็จสิ้น (แนบรูป)', confirmButtonColor: '#3b82f6', denyButtonColor: '#10b981' });`;
content = content.replace(searchRepair, replaceRepair);

// 7. updateAV
const searchAV = /const \{ value: v \} = await Swal\.fire\(\{\s*title: '🎛️ อัปเดตสถานะงานโสตฯ',\s*html: `<div class="text-left space-y-4 mt-2 text-slate-900"><select id="swal-av-status" class="w-full p-2\.5 border rounded-xl bg-slate-50 font-semibold"><option value="รอยืนยันการยืม">⏳ รอยืนยันการยืม \/ รอตรวจสอบ<\/option><option value="จัดเตรียมแล้ว">🛠️ จัดเตรียมอุปกรณ์ให้แล้ว<\/option><option value="กำลังใช้งาน">🔊 กำลังใช้งาน \/ อยู่ระหว่างกิจกรรม<\/option><option value="เสร็จสิ้น\/คืนเรียบร้อย">✅ เสร็จสิ้น \/ ตรวจรับของคืนเรียบร้อย<\/option><\/select><input id="swal-av-tech" class="w-full p-2\.5 border rounded-xl bg-slate-50" placeholder="ระบุชื่อเจ้าหน้าที่โสตฯ" value="\$\{oldTech !== '-' \? oldTech : ''\}"><\/div>`,/g;

const replaceAV = `const taskData = window.allAVTasks ? window.allAVTasks[index] : null;
      let detailsHtml = '';
      if (taskData) {
        const timestamp = taskData[0] || '-';
        const borrower = taskData[1] || '-';
        const equipment = taskData[2] || '-';
        const useDate = taskData[3] || '-';
        const loc = taskData[4] || '-';
        detailsHtml = \`<div class="text-left mb-5 p-4 bg-slate-50 rounded-xl border border-slate-200 shadow-sm"><div class="font-bold text-slate-800 mb-1 text-base"><i class="fa-solid fa-headphones text-amber-500"></i> \${borrower}</div><div class="text-sm text-slate-600 mb-2 whitespace-pre-wrap"><span class="font-semibold text-slate-700">อุปกรณ์:</span> \${equipment}</div><div class="text-xs text-slate-500 mb-1"><span class="font-semibold text-slate-600">วันที่ใช้:</span> \${useDate}</div><div class="text-xs text-slate-500 mb-3"><span class="font-semibold text-slate-600">สถานที่:</span> \${loc}</div><div class="text-xs font-semibold text-slate-500 flex items-center gap-1 border-t border-slate-200 pt-2"><i class="fa-regular fa-clock text-slate-400"></i> แจ้งเมื่อ: \${timestamp}</div></div>\`;
      }
      const { value: v } = await Swal.fire({
        title: '🎛️ อัปเดตสถานะงานโสตฯ',
        html: detailsHtml + \`<div class="text-left space-y-4 mt-2 text-slate-900"><select id="swal-av-status" class="w-full p-2.5 border rounded-xl bg-slate-50 font-semibold"><option value="รอยืนยันการยืม">⏳ รอยืนยันการยืม / รอตรวจสอบ</option><option value="จัดเตรียมแล้ว">🛠️ จัดเตรียมอุปกรณ์ให้แล้ว</option><option value="กำลังใช้งาน">🔊 กำลังใช้งาน / อยู่ระหว่างกิจกรรม</option><option value="เสร็จสิ้น/คืนเรียบร้อย">✅ เสร็จสิ้น / ตรวจรับของคืนเรียบร้อย</option></select><input id="swal-av-tech" class="w-full p-2.5 border rounded-xl bg-slate-50" placeholder="ระบุชื่อเจ้าหน้าที่โสตฯ" value="\${oldTech !== '-' ? oldTech : ''}"></div>\`,\n`;
content = content.replace(searchAV, replaceAV);

fs.writeFileSync('src/js/modules/main.js', content, 'utf8');
console.log('main.js fully patched!');
