const fs = require('fs');
let content = fs.readFileSync('src/js/modules/main.js', 'utf8');

// 1. Update updateRepair
const searchRepair = /async updateRepair\(index\) \{\s*const r = await Swal\.fire\(\{ title: 'อัปเดตสถานะงาน', showDenyButton: true, showCancelButton: true, confirmButtonText: 'กำลังดำเนินการ', denyButtonText: 'เสร็จสิ้น \(แนบรูป\)', confirmButtonColor: '#3b82f6', denyButtonColor: '#10b981' \};\s*if \(r\.isConfirmed\) \{/g;

const replaceRepair = `async updateRepair(index) {
      const taskData = window.allRepairTasks ? window.allRepairTasks[index] : null;
      let detailsHtml = '';
      if (taskData) {
        const timestamp = taskData[0] || '-';
        const subject = taskData[1] || '-';
        const detail = taskData[2] || '-';
        const reporter = taskData[3] || '-';
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

      const r = await Swal.fire({ title: 'อัปเดตสถานะงาน', html: detailsHtml, showDenyButton: true, showCancelButton: true, confirmButtonText: 'กำลังดำเนินการ', denyButtonText: 'เสร็จสิ้น (แนบรูป)', confirmButtonColor: '#3b82f6', denyButtonColor: '#10b981' });
      if (r.isConfirmed) {`;

content = content.replace(searchRepair, replaceRepair);

// 2. Update updateAV
const searchAV = /async updateAV\(index, oldStatus, oldTech\) \{\s*const \{ value: v \} = await Swal\.fire\(\{\s*title: '🎛️ อัปเดตสถานะงานโสตฯ',\s*html: `<div class="text-left space-y-4 mt-2 text-slate-900">/g;

const replaceAV = `async updateAV(index, oldStatus, oldTech) {
      const taskData = window.allAVTasks ? window.allAVTasks[index] : null;
      let detailsHtml = '';
      if (taskData) {
        const timestamp = taskData[0] || '-';
        const borrower = taskData[1] || '-';
        const equipment = taskData[2] || '-';
        const useDate = taskData[3] || '-';
        const loc = taskData[4] || '-';
        
        detailsHtml = \`
          <div class="text-left mb-5 p-4 bg-slate-50 rounded-xl border border-slate-200 shadow-sm">
            <div class="font-bold text-slate-800 mb-1 text-base"><i class="fa-solid fa-headphones text-amber-500"></i> \${borrower}</div>
            <div class="text-sm text-slate-600 mb-2 whitespace-pre-wrap"><span class="font-semibold text-slate-700">อุปกรณ์:</span> \${equipment}</div>
            <div class="text-xs text-slate-500 mb-1"><span class="font-semibold text-slate-600">วันที่ใช้:</span> \${useDate}</div>
            <div class="text-xs text-slate-500 mb-3"><span class="font-semibold text-slate-600">สถานที่:</span> \${loc}</div>
            <div class="text-xs font-semibold text-slate-500 flex items-center gap-1 border-t border-slate-200 pt-2">
              <i class="fa-regular fa-clock text-slate-400"></i> แจ้งเมื่อ: \${timestamp}
            </div>
          </div>
        \`;
      }

      const { value: v } = await Swal.fire({
        title: '🎛️ อัปเดตสถานะงานโสตฯ',
        html: detailsHtml + \`<div class="text-left space-y-4 mt-2 text-slate-900">`;

content = content.replace(searchAV, replaceAV);

fs.writeFileSync('src/js/modules/main.js', content, 'utf8');
console.log('Updated updateRepair and updateAV.');
