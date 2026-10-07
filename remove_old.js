const fs = require('fs');
const path = require('path');

// 1. Remove the back button from page-fb-admin.html
const adminFile = 'src/pages/page-fb-admin.html';
let adminHtml = fs.readFileSync(adminFile, 'utf8');
adminHtml = adminHtml.replace(/<button onclick="nav\('page-technician'\)"[\s\S]*?<\/button>/, '');
fs.writeFileSync(adminFile, adminHtml, 'utf8');

// 2. Modify main.js to show the actual error message
const mainFile = 'src/js/modules/main.js';
let mainJs = fs.readFileSync(mainFile, 'utf8');
mainJs = mainJs.replace(
  /'<div class="col-span-full text-center p-8 text-rose-400"><i class="fa-solid fa-triangle-exclamation text-3xl mb-3"><\/i><br>เกิดข้อผิดพลาดในการโหลดข้อมูล<\/div>'/g,
  '`<div class="col-span-full text-center p-8 text-rose-400"><i class="fa-solid fa-triangle-exclamation text-3xl mb-3"></i><br>เกิดข้อผิดพลาด: ${err.message}</div>`'
);

// 3. Delete old admin files
const filesToDelete = [
  'src/pages/page-technician.html',
  'src/pages/page-it-manage.html',
  'src/pages/page-av-manage.html',
  'src/pages/page-av-repair-manage.html',
  'src/pages/page-project-manage.html'
];

for (const file of filesToDelete) {
  if (fs.existsSync(file)) {
    fs.unlinkSync(file);
    console.log('Deleted ' + file);
  }
}

fs.writeFileSync(mainFile, mainJs, 'utf8');
console.log('Patches applied successfully!');
