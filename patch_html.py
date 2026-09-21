import re

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# We want to replace the table that contains taskBody
# It starts with `<div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-x-auto">` 
# around line 1720 and ends around 1740.
pattern = re.compile(r'<div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-x-auto">\s*<table class="w-full text-left text-sm md:table block">.*?</t\s*body>\s*</table\s*>\s*</div\s*>', re.DOTALL)

def replace_fn(match):
    matched_text = match.group(0)
    if 'id="taskBody"' in matched_text:
        return """<div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div id="taskBody" class="flex flex-col divide-y divide-slate-100">
              <div class="p-8 text-center text-slate-500">กำลังโหลดข้อมูล...</div>
            </div>
          </div>"""
    return matched_text

new_content = pattern.sub(replace_fn, content)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Patch applied successfully.")
