const fs = require('fs');
const file = 'src/js/modules/main.js';
let content = fs.readFileSync(file, 'utf8');

// Replace the old admin menus with the new unified one
const oldSidebarRegex = /\{ id: 'nav-technician',[\s\S]*?\{ id: 'nav-project-manage',[\s\S]*?\},/g;
const newSidebar = `{ id: 'nav-fb-admin', label: 'ศูนย์จัดการตั๋วงาน', icon: 'fa-solid fa-server', pageId: 'page-fb-admin', roles: ['Admin', 'Technician', 'Supervisor'] },`;

content = content.replace(oldSidebarRegex, newSidebar);

fs.writeFileSync(file, content, 'utf8');
console.log("Updated sidebar in main.js");
