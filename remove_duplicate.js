const fs = require('fs');
let content = fs.readFileSync('src/js/modules/main.js', 'utf8');

const regex = /async function loadAdvancedTasks\(\) \{\s*try \{\s*const data = await ResourceHubCore\.api\.get\('get_adv_tasks'\);\s*window\.advTasksData = data;\s*window\.advTasksData = data;\s*if \(data\.it\) renderAdvTable\('itTaskBody', data\.it, 'it'\);\s*if \(data\.project\) renderAdvTable\('projectBody', data\.project, 'project'\);\s*if \(data\.av\) renderAdvTable\('avRepairTaskBody', data\.av, 'av-repair'\);\s*\} catch \(e\) \{\s*console\.error\('loadAdvancedTasks error:', e\);\s*\}\s*\}/;

content = content.replace(regex, ''); // just remove the duplicate one at 1379

fs.writeFileSync('src/js/modules/main.js', content, 'utf8');
console.log('Duplicate removed');
