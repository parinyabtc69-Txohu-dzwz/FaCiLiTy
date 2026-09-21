const fs = require('fs');
let content = fs.readFileSync('index.html', 'utf8');

// Find the start of the return statement in renderRepairTable
const searchStart = "const rowBg = isDone ? 'bg-white hover:bg-slate-50' : 'bg-rose-50/30 hover:bg-rose-50/60 font-medium';";
const searchEnd = "</tr>\`;";

let startIndex = content.indexOf(searchStart);
let endIndex = content.indexOf(searchEnd, startIndex);

if (startIndex !== -1 && endIndex !== -1) {
    endIndex += searchEnd.length;
    let oldBlock = content.substring(startIndex, endIndex);

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

    content = content.substring(0, startIndex) + newCode + content.substring(endIndex);
    fs.writeFileSync('index.html', content, 'utf8');
    console.log("Patch applied successfully.");
} else {
    console.log("Could not find block boundaries!");
}
