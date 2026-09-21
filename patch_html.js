const fs = require('fs');

let content = fs.readFileSync('index.html', 'utf8');

const pattern = /<div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-x-auto">\s*<table class="w-full text-left text-sm md:table block">[\s\S]*?<\/tbody>\s*<\/table>\s*<\/div>/g;

let matchCount = 0;
content = content.replace(pattern, (match) => {
    if (match.includes('id="taskBody"')) {
        matchCount++;
        return `<div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div id="taskBody" class="flex flex-col divide-y divide-slate-100">
              <div class="p-8 text-center text-slate-500">กำลังโหลดข้อมูล...</div>
            </div>
          </div>`;
    }
    return match;
});

if (matchCount > 0) {
    fs.writeFileSync('index.html', content, 'utf8');
    console.log("Patch applied successfully. Replaced " + matchCount + " occurrences.");
} else {
    console.log("No matching taskBody table found.");
}
