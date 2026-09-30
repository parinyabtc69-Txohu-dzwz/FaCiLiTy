const fs = require('fs');
let code = fs.readFileSync('src/js/modules/main.js', 'utf8');

code = code.replace(/<i class="fa-solid fa-box-archive hover:text-slate-700" title="เก็บถาวร" onclick="event\.stopPropagation\(\)"><\/i>/g, '<i class="fa-solid fa-box-archive hover:text-slate-700" title="เก็บถาวร" onclick="triggerRowAction(event, \'archive\')"></i>');

code = code.replace(/<i class="fa-solid fa-trash hover:text-rose-600" title="ลบ" onclick="event\.stopPropagation\(\)"><\/i>/g, '<i class="fa-solid fa-trash hover:text-rose-600" title="ลบ" onclick="triggerRowAction(event, \'delete\')"></i>');

fs.writeFileSync('src/js/modules/main.js', code);
