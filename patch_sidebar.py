import re

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Replace the button
old_button = r"""          <button onclick="nav\('page-advanced-manage'\)" id="gnav-advanced-manage"
            class="gmail-nav-item w-full hidden justify-between items-center px-4 py-2\.5 rounded-r-full text-slate-700 hover:bg-slate-200/60 transition-colors text-sm font-normal">
            <div class="flex items-center gap-4">
              <i class="fa-solid fa-server w-5 text-center text-indigo-600"></i> จัดการระบบ IT/AV
            </div>
            <span id="badge-adv" class="hidden bg-fuchsia-600 text-white text-\[10px\] font-bold px-1\.5 py-0\.5 rounded-full min-w-\[20px\] text-center">0</span>
          </button>"""

new_buttons = """          <button onclick="nav('page-it-manage')" id="gnav-it-manage"
            class="gmail-nav-item w-full hidden justify-between items-center px-4 py-2.5 rounded-r-full text-slate-700 hover:bg-slate-200/60 transition-colors text-sm font-normal">
            <div class="flex items-center gap-4">
              <i class="fa-solid fa-desktop w-5 text-center text-sky-600"></i> จัดการงานซ่อม IT
            </div>
            <span id="badge-it-manage" class="hidden bg-fuchsia-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">0</span>
          </button>

          <button onclick="nav('page-av-repair-manage')" id="gnav-av-repair-manage"
            class="gmail-nav-item w-full hidden justify-between items-center px-4 py-2.5 rounded-r-full text-slate-700 hover:bg-slate-200/60 transition-colors text-sm font-normal">
            <div class="flex items-center gap-4">
              <i class="fa-solid fa-camera w-5 text-center text-amber-500"></i> จัดการงานซ่อมโสตฯ
            </div>
            <span id="badge-av-repair-manage" class="hidden bg-fuchsia-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">0</span>
          </button>

          <button onclick="nav('page-project-manage')" id="gnav-project-manage"
            class="gmail-nav-item w-full hidden justify-between items-center px-4 py-2.5 rounded-r-full text-slate-700 hover:bg-slate-200/60 transition-colors text-sm font-normal">
            <div class="flex items-center gap-4">
              <i class="fa-solid fa-building-circle-check w-5 text-center text-violet-500"></i> พิจารณาโครงการ
            </div>
            <span id="badge-project-manage" class="hidden bg-fuchsia-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">0</span>
          </button>"""

content = re.sub(old_button, new_buttons, content)

# 2. Replace navigation mapping
old_mapping = r"'page-advanced-manage': 'gnav-advanced-manage',"
new_mapping = "'page-it-manage': 'gnav-it-manage',\n    'page-av-repair-manage': 'gnav-av-repair-manage',\n    'page-project-manage': 'gnav-project-manage',"
content = content.replace(old_mapping, new_mapping)

# 3. Replace show logic
old_show = r"if \(\$\('gnav-advanced-manage'\)\) \{ \$\('gnav-advanced-manage'\)\.classList\.remove\('hidden'\); \$\('gnav-advanced-manage'\)\.classList\.add\('flex'\); \}"
new_show = """if ($('gnav-it-manage')) { $('gnav-it-manage').classList.remove('hidden'); $('gnav-it-manage').classList.add('flex'); }
    if ($('gnav-av-repair-manage')) { $('gnav-av-repair-manage').classList.remove('hidden'); $('gnav-av-repair-manage').classList.add('flex'); }
    if ($('gnav-project-manage')) { $('gnav-project-manage').classList.remove('hidden'); $('gnav-project-manage').classList.add('flex'); }"""
content = re.sub(old_show, new_show, content)

# 4. Replace hide logic
old_hide = r"if \(\$\('gnav-advanced-manage'\)\) \$\('gnav-advanced-manage'\)\.classList\.add\('hidden'\);"
new_hide = """if ($('gnav-it-manage')) $('gnav-it-manage').classList.add('hidden');
    if ($('gnav-av-repair-manage')) $('gnav-av-repair-manage').classList.add('hidden');
    if ($('gnav-project-manage')) $('gnav-project-manage').classList.add('hidden');"""
content = re.sub(old_hide, new_hide, content)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("index.html patched successfully.")
