const fs = require('fs');
let code = fs.readFileSync('src/js/modules/main.js', 'utf8');

// The updateAdvTask function needs the screening modal logic.
// Let's replace the top part of updateAdvTask where it checks `if (taskData) { ... }`
// and adds the `if (isSupervisor && currentStatus === 'รอดำเนินการ') { ... }` block.
// To do this reliably, we'll find the `window.updateAdvTask = async function (type, index, currentStatus) {` 
// and the subsequent `const r = await Swal.fire({`

const targetFunc = "window.updateAdvTask = async function (type, index, currentStatus) {";
const splitPoint = code.indexOf(targetFunc);
if (splitPoint !== -1) {
  const funcStr = code.substring(splitPoint);
  const swalPoint = funcStr.indexOf('const r = await Swal.fire({');
  
  if (swalPoint !== -1) {
    const injection = `
    const userRole = localStorage.getItem('logged_role') || '';
    const isSupervisor = (userRole.toLowerCase() === 'supervisor' || userRole.toLowerCase() === 'admin' || userRole.toLowerCase() === 'executive' || userRole.toLowerCase() === 'director');

    if (isSupervisor && currentStatus === 'รอดำเนินการ') {
      let supHtml = detailsHtml + \`
      <div class="text-left space-y-4 text-slate-800 mt-4 border-t pt-4">
        <div>
          <label class="block text-xs font-semibold mb-2">ความเร่งด่วน <span class="text-rose-500">*</span></label>
          <div class="flex gap-2 justify-between">
            <label class="flex-1 text-center p-2 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 text-sm has-[:checked]:border-rose-500 has-[:checked]:bg-rose-50 has-[:checked]:text-rose-700"><input type="radio" name="supUrgency" value="ด่วน" class="sr-only" required><span class="block mt-1 mb-1 font-bold">🔴 ด่วน</span></label>
            <label class="flex-1 text-center p-2 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 text-sm has-[:checked]:border-[#f59e0b] has-[:checked]:bg-[#fef3c7] has-[:checked]:text-[#f59e0b]"><input type="radio" name="supUrgency" value="ตามคิว" checked class="sr-only"><span class="block mt-1 mb-1 font-bold">🔵 ตามคิว</span></label>
            <label class="flex-1 text-center p-2 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 text-sm has-[:checked]:border-emerald-500 has-[:checked]:bg-emerald-50 has-[:checked]:text-emerald-700"><input type="radio" name="supUrgency" value="ไม่รีบ" class="sr-only"><span class="block mt-1 mb-1 font-bold">🟢 ไม่รีบ</span></label>
          </div>
        </div>
        <div>
          <label class="block text-xs font-semibold mb-2">มอบหมายช่าง / ผู้รับผิดชอบ <span class="text-rose-500">*</span></label>
          <input id="supTechName" type="text" class="w-full p-2.5 border border-slate-300 rounded-lg text-sm bg-white" placeholder="ระบุชื่อผู้รับผิดชอบ...">
        </div>
      </div>\`;

      const s = await Swal.fire({
        title: 'คัดกรองงาน (หัวหน้างาน)',
        html: supHtml,
        showCancelButton: true,
        confirmButtonText: 'อนุมัติ & มอบหมาย',
        cancelButtonText: 'ยกเลิก',
        confirmButtonColor: '#265D5A',
        preConfirm: () => {
          const urgency = document.querySelector('input[name="supUrgency"]:checked').value;
          const techName = document.getElementById('supTechName').value.trim();
          if (!techName) return Swal.showValidationMessage('กรุณาระบุชื่อช่างผู้รับผิดชอบ');
          return { urgency, techName };
        }
      });

      if (s.isConfirmed) {
        let targetSheet = '';
        if (type === 'it') targetSheet = 'IT_Repairs';
        else if (type === 'av-repair' || type === 'av') targetSheet = 'AV_Repairs';
        else if (type === 'project') targetSheet = 'Facility_Projects';

        return submitAction(
          () => ResourceHubCore.api.post({ 
            action: 'approve_task',
            rowIndex: index, 
            status: 'มอบหมายแล้ว',
            urgency: s.value.urgency,
            technician: s.value.techName,
            sheetName: targetSheet
          }),
          'มอบหมายงานเรียบร้อย',
          () => loadAdvancedTasks()
        );
      }
      return;
    }
`;
    const newCode = code.substring(0, splitPoint + swalPoint) + injection + code.substring(splitPoint + swalPoint);
    fs.writeFileSync('src/js/modules/main.js', newCode);
    console.log('Modified main.js updateAdvTask');
  }
}

