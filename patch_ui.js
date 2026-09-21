const fs = require('fs');

let content = fs.readFileSync('src/js/modules/main.js', 'utf8');

// 1. Rewrite renderRepairTable to output Card UI
const searchRenderRepair = /window\.renderRepairTable = function \(\) \{[\s\S]*?(?=window\.viewRepairDetails)/;

const replaceRenderRepair = `window.renderRepairTable = function () {
  const rawData = window.allRepairTasks || [];
  const listWithIndex = rawData.map((r, idx) => ({ r, originalIndex: idx }));

  const getWeight = st => {
    const s = (st || '').trim();
    if (['เสร็จสิ้น', 'เสร็จสิ้น/คืนเรียบร้อย', 'เรียบร้อยแล้ว'].includes(s)) return 3;
    if (['กำลังดำเนินการ', 'กำลังใช้งาน', 'จัดเตรียมแล้ว', 'กำลังดำเนินงาน'].includes(s)) return 2;
    return 1;
  };

  const searchQuery = (window.currentRepairSearch || '').toLowerCase().trim();
  const dateFilter = window.currentRepairDate || '';
  const reporterFilter = (window.currentRepairReporter || '').toLowerCase().trim();
  const locFilter = (window.currentRepairLocation || '').toLowerCase().trim();

  const filteredList = listWithIndex.filter(({ r }) => {
    const w = getWeight(r[4]);
    if (window.currentRepairTab === 'pending' && w !== 1) return false;
    if (window.currentRepairTab === 'progress' && w !== 2) return false;
    if (window.currentRepairTab === 'done' && w !== 3) return false;

    if (searchQuery) {
      const detailText = (r[2] || '').toLowerCase();
      if (!detailText.includes(searchQuery)) return false;
    }

    if (reporterFilter && !(r[3] || '').toLowerCase().includes(reporterFilter)) return false;
    if (locFilter && !(r[13] || '').toLowerCase().includes(locFilter)) return false;

    if (dateFilter) {
      const now = new Date();
      const parts = (r[0] || '').split(' ');
      if (parts.length >= 2) {
        const dp = parts[0].split('/');
        if (dp.length >= 3) {
          const d = new Date(dp[2], dp[1] - 1, dp[0]);
          if (dateFilter === 'today' && d.toDateString() !== now.toDateString()) return false;
          if (dateFilter === 'week' && (now - d) > 7 * 24 * 60 * 60 * 1000) return false;
          if (dateFilter === 'month' && (d.getMonth() !== now.getMonth() || d.getFullYear() !== now.getFullYear())) return false;
        }
      }
    }
    return true;
  });

  filteredList.sort((a, b) => {
    const wa = getWeight(a.r[4]);
    const wb = getWeight(b.r[4]);
    if (wa !== wb) return wa - wb;
    return b.originalIndex - a.originalIndex;
  });

  const tbody = document.getElementById('taskBody');
  if (!tbody) return;

  if (filteredList.length === 0) {
    tbody.innerHTML = '<div class="p-8 text-center text-slate-500 bg-white">ไม่มีรายการแจ้งซ่อมที่ตรงกับเงื่อนไข</div>';
    return;
  }

  tbody.innerHTML = filteredList.map(({ r, originalIndex: i }) => {
    const timestamp = r[0] || '';
    const subject = r[1] || '';
    const detail = r[2] || '';
    const reporter = r[3] || '';
    const status = r[4] || '';
    const img = r[5] && r[5] !== '-' ? \`<button onclick="event.stopPropagation(); showImageModal('\${r[5]}')" class="text-xs text-blue-500 bg-blue-50 px-2 py-1 rounded-md border border-blue-200 hover:bg-blue-100 mt-2"><i class="fa-solid fa-image"></i> รูปภาพ</button>\` : '';
    const urgency = r[12] || '';
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

    return \`<div onclick="updateRepair(\${i})" class="\${rowBg} cursor-pointer p-4 flex gap-4 items-start transition-colors border-b border-slate-100 hover:bg-slate-50"><div class="flex-shrink-0 mt-1"><div class="w-12 h-12 rounded-full \${avatarColor} text-white flex items-center justify-center font-bold text-lg shadow-sm">\${getInitials(reporter)}</div></div><div class="flex-1 min-w-0"><div class="flex justify-between items-baseline mb-1"><h4 class="text-base \${isUnread ? 'font-bold text-slate-800' : 'font-semibold text-slate-700'} truncate pr-2 flex items-center">\${reporter} \${urgBadge}</h4><span class="text-xs text-slate-500 whitespace-nowrap">\${timestamp}</span></div><div class="text-sm \${isUnread ? 'font-bold text-slate-800' : 'font-semibold text-slate-600'} mb-1 truncate flex items-center gap-2">\${subject}\${img ? '<i class="fa-solid fa-paperclip text-slate-400" title="มีแนบ"></i>' : ''}</div><div class="text-sm text-slate-500 line-clamp-2 leading-relaxed mb-3">\${detail}</div><div class="flex flex-wrap gap-2 items-center">\${statusTagClass(status)}\${img}</div></div></div>\`;
  }).join('');
};

`;

content = content.replace(searchRenderRepair, replaceRenderRepair);


// 2. Add detailsHtml to window.updateAdvTask
const searchUpdateAdvTask = /window\.updateAdvTask = async function \(type, index, currentStatus\) \{[\s\S]*?(?=const r = await Swal\.fire\(\{)/;
const replaceUpdateAdvTask = `window.updateAdvTask = async function (type, index, currentStatus) {
  const allData = window.advTasksData[type === 'av-repair' ? 'av' : type];
  const taskData = allData ? allData[index] : null;
  let detailsHtml = '';
  
  if (taskData) {
    const timestamp = taskData[0] || '-';
    const subject = taskData[1] || '-';
    const detail = taskData[2] || '-';
    const reporter = taskData[3] || '-';
    
    detailsHtml = \`<div class="text-left mb-5 p-4 bg-slate-50 rounded-xl border border-slate-200 shadow-sm"><div class="font-bold text-slate-800 mb-1 text-base">\${subject}</div><div class="text-sm text-slate-600 mb-3 whitespace-pre-wrap">\${detail}</div><div class="text-xs font-semibold text-slate-500 flex items-center gap-1 border-t border-slate-200 pt-2 mt-2"><i class="fa-solid fa-user text-slate-400"></i> \${reporter} &nbsp;&nbsp;|&nbsp;&nbsp;<i class="fa-regular fa-clock text-slate-400"></i> \${timestamp}</div></div>\`;
  }

  `;

content = content.replace(searchUpdateAdvTask, replaceUpdateAdvTask);

// Update Swal.fire in updateAdvTask to include HTML
const searchSwalAdvTask = /const r = await Swal\.fire\(\{[\s\S]*?title: 'อัปเดตสถานะ',[\s\S]*?showDenyButton: true,/;
const replaceSwalAdvTask = `const r = await Swal.fire({
    title: 'อัปเดตสถานะ',
    html: detailsHtml,
    showDenyButton: true,`;
content = content.replace(searchSwalAdvTask, replaceSwalAdvTask);

fs.writeFileSync('src/js/modules/main.js', content, 'utf8');
console.log('UI Patch successful!');
