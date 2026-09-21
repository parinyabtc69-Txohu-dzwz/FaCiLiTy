const fs = require('fs');
let content = fs.readFileSync('src/js/modules/main.js', 'utf8');

// The bug was the /g flag and replacing tbody.innerHTML which matched multiple tables
const searchStr = /tbody\.innerHTML = filteredList\.map\(\(\{ r, originalIndex \}\) => \{\s*const st = r\[5\] \|\| 'รอยืนยันการยืม';[\s\S]*?\}\)\.join\(''\);/;

const replacement = `tbody.innerHTML = filteredList.map(({ r, originalIndex }) => {
    const st = r[5] || 'รอยืนยันการยืม';
    const tech = r[6] || '-';
    const isDone = (st === 'เสร็จสิ้น' || st === 'เสร็จสิ้น/คืนเรียบร้อย' || st === 'เรียบร้อยแล้ว');

    let starIcon = '';
    if (isDone) {
      const rating = parseInt(r[18] || '0', 10);
      if (rating > 0) {
        const starArr = Array(5).fill(0).map((_, i) =>
          '<i class="' + (i < rating ? 'fa-solid' : 'fa-regular') + ' fa-star text-sm ' + (i < rating ? 'text-amber-400' : 'text-slate-300') + '"></i>');
        starIcon = '<span class="flex justify-center gap-0.5">' + starArr.join('') + '</span>';
      } else {
        starIcon = \`<button onclick="openSurveyModal('av', \${originalIndex + 2})" class="text-xs text-blue-500 hover:text-blue-700 font-semibold whitespace-nowrap"><i class="fa-regular fa-star mr-0.5"></i>ประเมิน</button>\`;
      }
    } else {
      starIcon = '<span class="text-amber-400 drop-shadow-sm"><i class="fa-solid fa-star text-lg animate-bounce"></i></span>';
    }

    const rowBg = isDone ? 'bg-white hover:bg-slate-50' : 'bg-amber-50/30 hover:bg-amber-50/60 font-medium';
    const isUnread = !isDone;

    // Function to get initials for avatar
    const getInitials = (name) => {
      if (!name) return 'U';
      const parts = name.trim().split(' ');
      if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
      return name.substring(0, 2).toUpperCase();
    };
    
    // Function to get a deterministic color based on name
    const getAvatarColor = (name) => {
      const colors = ['bg-amber-600', 'bg-blue-600', 'bg-emerald-600', 'bg-violet-600', 'bg-rose-600', 'bg-cyan-600'];
      let hash = 0;
      for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
      return colors[Math.abs(hash) % colors.length];
    };
    
    const avatarColor = getAvatarColor(r[1] || '');

    return \`<div onclick="updateAV(\${originalIndex}, '\${st}', '\${tech}')" class="\${rowBg} cursor-pointer p-4 flex gap-4 items-start transition-colors border-b border-slate-100 hover:bg-slate-50">
      <div class="flex-shrink-0 mt-1">
        <div class="w-12 h-12 rounded-full \${avatarColor} text-white flex items-center justify-center font-bold text-lg shadow-sm">
          \${getInitials(r[1] || '')}
        </div>
      </div>
      <div class="flex-1 min-w-0">
        <div class="flex justify-between items-baseline mb-1">
          <h4 class="text-base \${isUnread ? 'font-bold text-slate-800' : 'font-semibold text-slate-700'} truncate pr-2">\${r[1]}</h4>
          <span class="text-xs text-slate-500 whitespace-nowrap">\${r[0]}</span>
        </div>
        <div class="text-sm \${isUnread ? 'font-bold text-slate-800' : 'font-semibold text-slate-600'} mb-1 flex items-center gap-2">
          <i class="fa-solid fa-microphone-lines text-amber-500"></i> \${r[2]}
        </div>
        <div class="text-sm text-slate-500 line-clamp-2 leading-relaxed mb-3">
          ใช้วันที่: \${r[3]} | สถานที่: \${r[4]} <br> ช่างผู้ดูแล: \${tech}
        </div>
        <div class="flex flex-wrap gap-2 items-center">
          \${starIcon.replace(/onclick="[^"]*"/g, (match) => 'onclick="event.stopPropagation(); ' + match.substring(9))}
          \${statusTagClass(st)}
        </div>
      </div>
    </div>\`;
  }).join('');`;

content = content.replace(searchStr, replacement);
fs.writeFileSync('src/js/modules/main.js', content, 'utf8');
console.log('Patched renderAVTable.');
