const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');
const indexHtmlPath = path.join(__dirname, 'index.html');

let htmlTemplate = fs.readFileSync(path.join(srcDir, 'index.html'), 'utf8');
const jsApp = fs.readFileSync(path.join(srcDir, 'js', 'app.js'), 'utf8');

// replace CSS
const cssFiles = fs.readdirSync(path.join(srcDir, 'css')).filter(f => f.endsWith('.css'));
let cssContent = '';
for (const file of cssFiles) {
  cssContent += fs.readFileSync(path.join(srcDir, 'css', file), 'utf8') + '\n';
}
htmlTemplate = htmlTemplate.replace('/* INCLUDE_CSS */', cssContent);

// replace JS
htmlTemplate = htmlTemplate.replace('<!-- INCLUDE_JS -->', jsApp);

// replace components
const pagesDir = path.join(srcDir, 'pages');
if (fs.existsSync(pagesDir)) {
  const pageFiles = fs.readdirSync(pagesDir).filter(f => f.endsWith('.html'));
  let pagesContent = '';
  for (const pageFile of pageFiles) {
    pagesContent += fs.readFileSync(path.join(pagesDir, pageFile), 'utf8') + '\n';
  }
  htmlTemplate = htmlTemplate.replace('<!-- INCLUDE_PAGES -->', pagesContent);
}

fs.writeFileSync(indexHtmlPath, htmlTemplate);
console.log('Build successful!');
