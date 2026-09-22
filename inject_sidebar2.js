const fs = require('fs');

// 1. Edit index.html
let html = fs.readFileSync('src/index.html', 'utf8');

const target1 = '<div class="flex items-center gap-3">';
let idx1 = html.indexOf(target1);
if (idx1 !== -1 && !html.includes('toggleDesktopSidebar()')) {
    const insert1 = `
      <!-- Add hamburger here -->
      <button onclick="toggleDesktopSidebar()" class="hidden md:flex text-white hover:bg-white/20 p-2 rounded-full transition-colors w-10 h-10 items-center justify-center" title="ซ่อน/แสดงเมนู">
        <i class="fa-solid fa-bars text-xl"></i>
      </button>`;
    html = html.substring(0, idx1 + target1.length) + insert1 + html.substring(idx1 + target1.length);
} else {
    console.log('Target 1 not found or already added in index.html');
}

const target2 = 'id="app-sidebar"';
let idx2 = html.indexOf(target2);
if (idx2 !== -1) {
    let asideTagEnd = html.indexOf('>', idx2);
    let asideTag = html.substring(idx2, asideTagEnd);
    // Replace transition-transform with transition-all, and add overflow-x-hidden whitespace-nowrap
    if (asideTag.includes('transition-transform')) {
        let newAsideTag = asideTag.replace('transition-transform', 'transition-all overflow-x-hidden whitespace-nowrap');
        html = html.substring(0, idx2) + newAsideTag + html.substring(asideTagEnd);
    }
}

fs.writeFileSync('src/index.html', html, 'utf8');
console.log('index.html updated');

// 2. Edit main.js
let js = fs.readFileSync('src/js/modules/main.js', 'utf8');
if (!js.includes('toggleDesktopSidebar')) {
    js += `\n
window.toggleDesktopSidebar = function() {
  const sb = document.getElementById('app-sidebar');
  if (sb) {
    sb.classList.toggle('sidebar-collapsed');
    if (sb.classList.contains('sidebar-collapsed')) {
      sb.classList.replace('w-64', 'w-[4.5rem]');
    } else {
      sb.classList.replace('w-[4.5rem]', 'w-64');
    }
  }
};
\n`;
    fs.writeFileSync('src/js/modules/main.js', js, 'utf8');
    console.log('main.js updated');
} else {
    console.log('main.js already updated');
}

// 3. Edit style.css
let css = fs.readFileSync('src/css/style.css', 'utf8');
if (!css.includes('.sidebar-collapsed')) {
    css += `\n
/* Sidebar Collapsed State */
.sidebar-collapsed .gmail-nav-item span,
.sidebar-collapsed .gmail-nav-item div:not(.relative) {
  display: none !important;
}
.sidebar-collapsed .gmail-nav-item i {
  margin: 0 auto !important;
  font-size: 1.25rem;
}
.sidebar-collapsed .gmail-nav-item {
  padding-left: 0.5rem;
  padding-right: 0.5rem;
  justify-content: center;
}
.sidebar-collapsed .bg-\\[\\#265D5A\\] span {
  display: none;
}
.sidebar-collapsed .bg-\\[\\#265D5A\\] {
  padding-left: 0.5rem;
  padding-right: 0.5rem;
  justify-content: center;
}
.sidebar-collapsed .bg-\\[\\#265D5A\\] i {
  margin: 0;
}
.sidebar-collapsed #badge-repair {
  display: none !important;
}
\n`;
    fs.writeFileSync('src/css/style.css', css, 'utf8');
    console.log('style.css updated');
} else {
    console.log('style.css already updated');
}
