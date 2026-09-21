const fs = require('fs');

let content = fs.readFileSync('index.html', 'utf8');

const oldCode = `    const rowBg = isDone ? 'bg-white hover:bg-slate-50' : 'bg-rose-50/30 hover:bg-rose-50/60 font-medium';
    const img = r[5] && r[5] !== '-' ? \`<button onclick="showImageModal('\${r[5]}')" class="text-blue-500 underline hover:text-blue-700 transition-colors"><i class="fa-solid fa-image"></i> ดูรูป</button>\` : '-';
    const topicText = \`<span class="font-bold text-slate-800">\${r[1]}</span>\`;
    const detailBtn = \`<button onclick="viewRepairDetails(\${originalIndex})" class="text-left w-full max-w-[200px] sm:max-w-xs md:max-w-sm text-sm text-slate-600 hover:text-blue-700 hover:bg-blue-50 bg-slate-50 border border-slate-200 rounded-lg p-2.5 transition-all group" title="คลิกเพื่อดูรายละเอียด">
            <span class="line-clamp-2 leading-relaxed whitespace-normal">\${r[2]}</span>
            <span class="text-[10px] text-blue-500 font-bold mt-1 opacity-0 group-hover:opacity-100 transition-opacity block"><i class="fa-solid fa-expand mr-1"></i> ดูรายละเอียด</span>
          </button>\`;

    return \`<tr class="border-b \${rowBg} transition-colors md:table-row flex flex-col p-4 md:p-0 gap-2 md:gap-0">
            <td class="p-2 md:p-4 text-left md:text-center w-full md:w-auto flex justify-between items-center md:table-cell"><span class="md:hidden font-bold text-slate-500">ความเร่งด่วน:</span>\${firstColHtml}</td>
            <td class="p-2 md:p-4 text-slate-500 w-full md:w-auto flex justify-between items-center md:table-cell"><span class="md:hidden font-bold text-slate-500">เวลาแจ้ง:</span><span>\${r[0]}</span></td>
            <td class="p-2 md:p-4 align-top w-full md:w-auto flex justify-between items-center md:table-cell"><span class="md:hidden font-bold text-slate-500">สถานะ:</span>
              <div class="flex flex-col items-end md:items-start text-right">
                \${statusTagClass(r[4])}
              </div>
            </td>
            <td class="p-2 md:p-4 w-full md:w-auto flex flex-col md:table-cell"><span class="md:hidden font-bold text-slate-500 mb-1">หัวข้อปัญหา:</span>\${topicText}</td>
            <td class="p-2 md:p-4 w-full md:w-auto flex flex-col md:table-cell"><span class="md:hidden font-bold text-slate-500 mb-1">รายละเอียด:</span>\${detailBtn}</td>
            <td class="p-2 md:p-4 font-semibold text-slate-700 w-full md:w-auto flex justify-between items-center md:table-cell"><span class="md:hidden font-bold text-slate-500">ผู้แจ้ง:</span><span>\${r[3]}</span></td>
            <td class="p-2 md:p-4 w-full md:w-auto flex justify-between items-center md:table-cell"><span class="md:hidden font-bold text-slate-500">รูปภาพ:</span>\${img}</td>
            <td class="p-2 md:p-4 text-center w-full md:w-auto mt-2 md:mt-0 flex justify-center md:table-cell border-t md:border-none pt-4 md:pt-4"><button onclick="updateTask(\${originalIndex})" class="w-full md:w-auto bg-blue-50 border border-blue-200 hover:bg-blue-600 hover:text-white text-blue-700 px-4 py-2 md:py-1.5 rounded-lg shadow-sm transition-colors font-bold text-base md:text-sm">อัปเดต</button></td>
          </tr>\`;`;

const newCode = `    const rowBg = isDone ? 'bg-white hover:bg-slate-50' : 'bg-rose-50/30 hover:bg-rose-50/60';
    const hasImg = r[5] && r[5] !== '-';
    
    // Function to get initials for avatar
    const getInitials = (name) => {
      if (!name) return 'U';
      const parts = name.trim().split(' ');
      if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
      return name.substring(0, 2).toUpperCase();
    };
    
    // Function to get a deterministic color based on name
    const getAvatarColor = (name) => {
      const colors = ['bg-[#265D5A]', 'bg-blue-600', 'bg-emerald-600', 'bg-violet-600', 'bg-rose-600', 'bg-amber-600', 'bg-cyan-600'];
      let hash = 0;
      for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
      return colors[Math.abs(hash) % colors.length];
    };
    
    const avatarColor = getAvatarColor(r[3] || '');
    const isUnread = !isDone; // Highlight unread/pending

    return \`<div onclick="updateTask(\${originalIndex})" class="\${rowBg} cursor-pointer p-4 flex gap-4 items-start transition-colors border-b border-slate-100 hover:bg-slate-50">
  <div class="flex-shrink-0 mt-1">
    <div class="w-12 h-12 rounded-full \${avatarColor} text-white flex items-center justify-center font-bold text-lg shadow-sm">
      \${getInitials(r[3] || '')}
    </div>
  </div>
  <div class="flex-1 min-w-0">
    <div class="flex justify-between items-baseline mb-1">
      <h4 class="text-base \${isUnread ? 'font-bold text-slate-800' : 'font-semibold text-slate-700'} truncate pr-2">\${r[3]}</h4>
      <span class="text-xs text-slate-500 whitespace-nowrap">\${r[0]}</span>
    </div>
    <div class="text-sm \${isUnread ? 'font-bold text-slate-800' : 'font-semibold text-slate-600'} mb-1 truncate flex items-center gap-2">
      \${r[1]}
      \${hasImg ? '<i class="fa-solid fa-paperclip text-slate-400" title="มีรูปภาพแนบ"></i>' : ''}
    </div>
    <div class="text-sm text-slate-500 line-clamp-2 leading-relaxed mb-3">
      \${r[2]}
    </div>
    <div class="flex flex-wrap gap-2 items-center">
      \${firstColHtml.replace(/onclick="[^"]*"/g, (match) => 'onclick="event.stopPropagation(); ' + match.substring(9))}
      \${statusTagClass(r[4])}
    </div>
  </div>
</div>\`;`;

if (content.includes(oldCode)) {
    content = content.replace(oldCode, newCode);
    fs.writeFileSync('index.html', content, 'utf8');
    console.log("Patch applied successfully.");
} else {
    console.log("Old code not found! Patch failed.");
}
