const fs = require('fs');
let code = fs.readFileSync('Code.gs', 'utf8');

const targetStr = "      case 'approve_task':";
const firstIndex = code.indexOf(targetStr);
if (firstIndex !== -1) {
  const secondIndex = code.indexOf(targetStr, firstIndex + 10);
  if (secondIndex !== -1) {
    // The second case 'approve_task': ... goes down to the next case or break
    const breakIndex = code.indexOf('break;', secondIndex);
    if (breakIndex !== -1) {
      code = code.substring(0, secondIndex) + code.substring(breakIndex + 6);
      fs.writeFileSync('Code.gs', code);
      console.log('Removed duplicate approve_task in Code.gs');
    }
  }
}
