const fs = require('fs');
let content = fs.readFileSync('src/js/modules/main.js', 'utf8');

content = content.replace(
`    if (currentRole === 'Tech') {
      roleDisplay = 'ช่างซ่อมบำรุง (Tech)';
      if (dashNav) { dashNav.classList.remove('hidden'); dashNav.classList.add('flex'); }
      if (techNav) { techNav.classList.remove('hidden'); techNav.classList.add('flex'); }
      if (homeCardDash) { homeCardDash.classList.remove('hidden'); homeCardDash.classList.add('flex'); }`,
`    if (currentRole === 'Tech') {
      roleDisplay = 'ช่างซ่อมบำรุง (Tech)';
      if (dashNav) { dashNav.classList.remove('hidden'); dashNav.classList.add('flex'); }
      if (techNav) { techNav.classList.remove('hidden'); techNav.classList.add('flex'); }
      if (avManageNav) { avManageNav.classList.remove('hidden'); avManageNav.classList.add('flex'); }
      if (homeCardDash) { homeCardDash.classList.remove('hidden'); homeCardDash.classList.add('flex'); }`
);

content = content.replace(
`    } else if (currentRole === 'AV') {
      roleDisplay = 'เจ้าหน้าที่โสตฯ (AV)';
      if (dashNav) { dashNav.classList.remove('hidden'); dashNav.classList.add('flex'); }
      if (avManageNav) { avManageNav.classList.remove('hidden'); avManageNav.classList.add('flex'); }
      if (homeCardDash) { homeCardDash.classList.remove('hidden'); homeCardDash.classList.add('flex'); }`,
`    } else if (currentRole === 'AV') {
      roleDisplay = 'เจ้าหน้าที่โสตฯ (AV)';
      if (dashNav) { dashNav.classList.remove('hidden'); dashNav.classList.add('flex'); }
      if (techNav) { techNav.classList.remove('hidden'); techNav.classList.add('flex'); }
      if (avManageNav) { avManageNav.classList.remove('hidden'); avManageNav.classList.add('flex'); }
      if (homeCardDash) { homeCardDash.classList.remove('hidden'); homeCardDash.classList.add('flex'); }`
);

fs.writeFileSync('src/js/modules/main.js', content);
