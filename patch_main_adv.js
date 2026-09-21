const fs = require('fs');
let mainJs = fs.readFileSync('src/js/modules/main.js', 'utf8');

const filterLogic = `
// Adv Filters State
window.currentAdvFilters = {
  'it': { status: 'all', date: '', search: '', reporter: '' },
  'av-repair': { status: 'all', date: '', search: '', reporter: '' },
  'project': { status: 'all', date: '', search: '', reporter: '' }
};

window.filterAdvTab = function(type, status, btn) {
  window.currentAdvFilters[type].status = status;
  
  // Update button styles
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
  
  // 1. Status Filter
  if (filters.status === 'pending') {
    filtered = filtered.filter(r => r[4] === 'รอดำเนินการ');
  } else if (filters.status === 'progress') {
    filtered = filtered.filter(r => r[4] === 'กำลังดำเนินการ');
  } else if (filters.status === 'done') {
    filtered = filtered.filter(r => ['เสร็จสิ้น', 'อนุมัติ', 'ไม่อนุมัติ', 'ยกเลิก'].includes(r[4]));
  }
  
  // 2. Search
  if (filters.search) {
    const s = filters.search.toLowerCase();
    filtered = filtered.filter(r => (r[1] && r[1].toLowerCase().includes(s)) || (r[2] && r[2].toLowerCase().includes(s)));
  }
  
  // 3. Date
  if (filters.date) {
    const now = new Date();
    filtered = filtered.filter(r => {
      if (!r[0]) return false;
      // Parse DD/MM/YYYY HH:mm:ss
      const parts = r[0].split(' ');
      if (parts.length < 2) return true;
      const dateParts = parts[0].split('/');
      if (dateParts.length < 3) return true;
      const d = new Date(dateParts[2], dateParts[1] - 1, dateParts[0]);
      
      if (filters.date === 'today') {
        return d.toDateString() === now.toDateString();
      } else if (filters.date === 'week') {
        const diff = now - d;
        return diff <= 7 * 24 * 60 * 60 * 1000;
      } else if (filters.date === 'month') {
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      }
      return true;
    });
  }
  
  // 4. Reporter
  if (filters.reporter) {
    const s = filters.reporter.toLowerCase();
    filtered = filtered.filter(r => r[3] && r[3].toLowerCase().includes(s));
  }
  
  const tbodyId = type === 'it' ? 'itTaskBody' : (type === 'av-repair' ? 'avRepairTaskBody' : 'projectBody');
  renderAdvTableFiltered(tbodyId, filtered, type);
};

function renderAdvTableFiltered(tbodyId, rows, type) {
  const tbody = document.getElementById(tbodyId);
  if (!tbody) return;
  
  if (!rows || !rows.length) {
    tbody.innerHTML = '<div class="p-8 text-center text-slate-500 bg-white">ไม่มีรายการที่ตรงกับเงื่อนไข</div>';
    return;
  }
  
  tbody.innerHTML = rows.map((r, i) => {
    // We need original index for updateAdvTask
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
    if (urgency === 'ด่วน') {
      urgBadge = '<span class="text-rose-500 text-[10px] font-bold px-2 py-0.5 bg-rose-50 rounded-full border border-rose-100 ml-2">ด่วน</span>';
    }
    
    return \`
      <div onclick="updateAdvTask('\${type}', \${originalIndex}, '\${status}')" class="\${rowBg} cursor-pointer p-4 flex gap-4 items-start transition-colors border-b border-slate-100 hover:bg-slate-50">
        <div class="flex-shrink-0 mt-1">
          <div class="w-12 h-12 rounded-full \${avatarColor} text-white flex items-center justify-center font-bold text-lg shadow-sm">
            \${getInitials(reporter)}
          </div>
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex justify-between items-baseline mb-1">
            <h4 class="text-base \${isUnread ? 'font-bold text-slate-800' : 'font-semibold text-slate-700'} truncate pr-2 flex items-center">
              \${reporter} \${urgBadge}
            </h4>
            <span class="text-xs text-slate-500 whitespace-nowrap">\${timestamp}</span>
          </div>
          <div class="text-sm \${isUnread ? 'font-bold text-slate-800' : 'font-semibold text-slate-600'} mb-1 truncate flex items-center gap-2">
            \${subject}
            \${img ? '<i class="fa-solid fa-paperclip text-slate-400" title="มีแนบ"></i>' : ''}
          </div>
          <div class="text-sm text-slate-500 line-clamp-2 leading-relaxed mb-3">
            \${detail}
          </div>
          <div class="flex flex-wrap gap-2 items-center">
            \${statusTagClass(status)}
            \${img}
          </div>
        </div>
      </div>
    \`;
  }).join('');
}
`;

mainJs = mainJs + '\n\n' + filterLogic;

// Update loadAdvancedTasks
const searchLoad = /async function loadAdvancedTasks\(\) \{\s*try \{\s*const data = await ResourceHubCore\.api\.get\('get_adv_tasks'\);\s*window\.advTasksData = data;\s*if \(data\.it\) renderAdvTable\('itTaskBody', data\.it, 'it'\);\s*if \(data\.project\) renderAdvTable\('projectBody', data\.project, 'project'\);\s*if \(data\.av\) renderAdvTable\('avRepairTaskBody', data\.av, 'av-repair'\);\s*\} catch \(e\) \{\s*console\.error\('loadAdvancedTasks error:', e\);\s*\}\s*\}/g;

const replaceLoad = `async function loadAdvancedTasks() {
  try {
    const data = await ResourceHubCore.api.get('get_adv_tasks');
    window.advTasksData = data;
    window.applyAdvFilters('it');
    window.applyAdvFilters('project');
    window.applyAdvFilters('av-repair');
  } catch (e) {
    console.error('loadAdvancedTasks error:', e);
  }
}`;

mainJs = mainJs.replace(searchLoad, replaceLoad);

// Remove the old renderAdvTable and switchAdvTab (Optional, but cleaner)
// I will just leave them since they aren't called anymore, but replacing is safer if I can find them.
// Let's replace the page routing in updatePageContent or init
const oldPageIfs = `  if (pageId === 'page-dashboard') {
    loadDashboard();
  } else if (pageId === 'page-technician') {
    loadBuildingTasks();
  } else if (pageId === 'page-advanced-manage') {
    loadAdvancedTasks();
  }`;

const newPageIfs = `  if (pageId === 'page-dashboard') {
    loadDashboard();
  } else if (pageId === 'page-technician') {
    loadBuildingTasks();
  } else if (pageId === 'page-it-manage' || pageId === 'page-av-repair-manage' || pageId === 'page-project-manage') {
    loadAdvancedTasks();
  }`;

mainJs = mainJs.replace(oldPageIfs, newPageIfs);

fs.writeFileSync('src/js/modules/main.js', mainJs, 'utf8');
console.log('Main.js updated for separate advanced manage pages.');
