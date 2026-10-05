const fs = require('fs');
const files = [
  'src/pages/page-it-repair.html',
  'src/pages/page-av-repair.html',
  'src/pages/page-project-form.html',
  'src/pages/page-repair-form.html'
];

for (const f of files) {
  if (!fs.existsSync(f)) continue;
  let html = fs.readFileSync(f, 'utf8');
  
  const searchStr = '<label class="block text-xs font-semibold text-slate-700 mb-1">ความเร่งด่วน';
  let idx = html.indexOf(searchStr);
  if (idx !== -1) {
    let startDiv = html.lastIndexOf('<div>', idx);
    if (startDiv !== -1) {
      // Find the end of this div block. It contains <div> <label> <div> <label></label>... </div> </div>
      // We can just find the second </div> after the startStr.
      let afterLabel = html.indexOf('</div>', idx); // first </div> for the grid
      let afterBlock = html.indexOf('</div>', afterLabel + 1); // second </div> for the outer div
      if (afterBlock !== -1) {
        html = html.substring(0, startDiv) + html.substring(afterBlock + 6);
        fs.writeFileSync(f, html);
        console.log('Removed from', f);
      }
    }
  }
}
