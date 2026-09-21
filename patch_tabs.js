const fs = require('fs');
let content = fs.readFileSync('src/js/modules/main.js', 'utf8');

content = content.replace(
  /b\.classList\.remove\('font-bold', 'text-sky-600', 'border-b-2', 'border-sky-600'\);/g,
  "b.classList.remove('font-bold', 'text-blue-600', 'border-b-2', 'border-blue-600', 'text-sky-600', 'border-sky-600');"
);

content = content.replace(
  /btn\.classList\.add\('font-bold', 'text-sky-600', 'border-b-2', 'border-sky-600'\);/g,
  "btn.classList.add('font-bold', 'text-blue-600', 'border-b-2', 'border-blue-600');"
);

fs.writeFileSync('src/js/modules/main.js', content, 'utf8');
console.log('Replaced successfully');
