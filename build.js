const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');
const indexHtmlPath = path.join(__dirname, 'index.html');

let htmlTemplate = fs.readFileSync(path.join(srcDir, 'index.html'), 'utf8').replace(/^\uFEFF/, '');

// replace CSS
const cssFiles = fs.readdirSync(path.join(srcDir, 'css')).filter(f => f.endsWith('.css'));
let cssContent = '';
for (const file of cssFiles) {
  cssContent += fs.readFileSync(path.join(srcDir, 'css', file), 'utf8').replace(/^\uFEFF/, '') + '\n';
}
htmlTemplate = htmlTemplate.replace('/* INCLUDE_CSS */', () => cssContent);
// replace JS
const jsModulesDir = path.join(srcDir, 'js', 'modules');
let jsApp = '';

// Explicit load order to prevent reference errors for global variables
const loadOrder = [
  'api.js',
  'auth.js',
  'user.js',
  'repair.js',
  'av.js',
  'dashboard.js',
  'main.js'
];

if (fs.existsSync(jsModulesDir)) {
  const allFiles = fs.readdirSync(jsModulesDir).filter(f => f.endsWith('.js'));
  
  // Load explicitly ordered files first
  for (const file of loadOrder) {
    if (allFiles.includes(file)) {
      jsApp += fs.readFileSync(path.join(jsModulesDir, file), 'utf8').replace(/^\uFEFF/, '') + '\n\n';
    }
  }
  
  // Load any remaining files
  for (const file of allFiles) {
    if (!loadOrder.includes(file)) {
      jsApp += fs.readFileSync(path.join(jsModulesDir, file), 'utf8').replace(/^\uFEFF/, '') + '\n\n';
    }
  }
}

// Fallback to old app.js if still migrating
const oldAppJsPath = path.join(srcDir, 'js', 'app.js');
if (fs.existsSync(oldAppJsPath)) {
  jsApp += fs.readFileSync(oldAppJsPath, 'utf8').replace(/^\uFEFF/, '') + '\n';
}

htmlTemplate = htmlTemplate.replace('<!-- INCLUDE_JS -->', () => jsApp);

// replace components
const pagesDir = path.join(srcDir, 'pages');
if (fs.existsSync(pagesDir)) {
  const pageFiles = fs.readdirSync(pagesDir).filter(f => f.endsWith('.html'));
  let pagesContent = '';
  for (const pageFile of pageFiles) {
    pagesContent += fs.readFileSync(path.join(pagesDir, pageFile), 'utf8').replace(/^\uFEFF/, '') + '\n';
  }
  htmlTemplate = htmlTemplate.replace('<!-- INCLUDE_PAGES -->', () => pagesContent);
}

fs.writeFileSync(indexHtmlPath, htmlTemplate);
console.log('Build successful!');
