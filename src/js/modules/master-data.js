// ============================================================
// ระบบจัดการข้อมูลหลัก Master Data (Firebase Firestore)
// จัดการ: สถานที่/ห้อง, แผนก/ฝ่าย, โครงการ, ช่างผู้รับผิดชอบ
// รองรับการแสดงผลแบบ Dropdown ในแบบฟอร์มทุกหน้า
// ============================================================

const MasterData = (() => {
  const CACHE_KEY = 'master_data_cache_v1';

  // ข้อมูลเริ่มต้นมาตรฐาน (Default Seed Data)
  const DEFAULT_DATA = {
    locations: [
      // สังกัด วพบ. (วิทยาลัยพยาบาลบรมราชชนนี)
      { id: 'loc_wpb_101', name: 'ห้องเรียน 101', department: 'วพบ.' },
      { id: 'loc_wpb_102', name: 'ห้องเรียน 102', department: 'วพบ.' },
      { id: 'loc_wpb_201', name: 'ห้องเรียน 201', department: 'วพบ.' },
      { id: 'loc_wpb_202', name: 'ห้องเรียน 202', department: 'วพบ.' },
      { id: 'loc_wpb_301', name: 'ห้องเรียน 301', department: 'วพบ.' },
      { id: 'loc_wpb_lab', name: 'ห้องปฏิบัติการพยาบาล (Lab)', department: 'วพบ.' },
      { id: 'loc_wpb_com', name: 'ห้องปฏิบัติการคอมพิวเตอร์', department: 'วพบ.' },
      { id: 'loc_wpb_meet1', name: 'ห้องประชุมชั้น 2', department: 'วพบ.' },
      { id: 'loc_wpb_meet_big', name: 'ห้องประชุมใหญ่ วพบ.', department: 'วพบ.' },
      { id: 'loc_wpb_office', name: 'สำนักงานอำนวยการ วพบ.', department: 'วพบ.' },
      { id: 'loc_wpb_canteen', name: 'โรงอาหาร วพบ.', department: 'วพบ.' },
      { id: 'loc_wpb_dorm', name: 'หอพักนักศึกษา วพบ.', department: 'วพบ.' },

      // สังกัด ศษ. (ศูนย์การศึกษา / โรงเรียน)
      { id: 'loc_ss_k1', name: 'ห้องเรียนอนุบาล 1-3', department: 'ศษ.' },
      { id: 'loc_ss_p1', name: 'ห้องเรียน ป.1 - ป.3', department: 'ศษ.' },
      { id: 'loc_ss_p4', name: 'ห้องเรียน ป.4 - ป.6', department: 'ศษ.' },
      { id: 'loc_ss_m1', name: 'ห้องเรียน ม.1 - ม.3', department: 'ศษ.' },
      { id: 'loc_ss_m4', name: 'ห้องเรียน ม.4 - ม.6', department: 'ศษ.' },
      { id: 'loc_ss_tea_p', name: 'ห้องพักครูประถม', department: 'ศษ.' },
      { id: 'loc_ss_tea_m', name: 'ห้องพักครูมัธยม', department: 'ศษ.' },
      { id: 'loc_ss_meet', name: 'ห้องประชุม ศษ.', department: 'ศษ.' },
      { id: 'loc_ss_hall', name: 'หอประชุมใหญ่ ศษ.', department: 'ศษ.' },
      { id: 'loc_ss_lib', name: 'ห้องสมุด ศษ.', department: 'ศษ.' },
      { id: 'loc_ss_com', name: 'ห้องปฏิบัติการคอมพิวเตอร์ ศษ.', department: 'ศษ.' },
      { id: 'loc_ss_gym', name: 'โรงยิม / สนามกีฬา', department: 'ศษ.' },
      { id: 'loc_ss_nurse', name: 'ห้องพยาบาล ศษ.', department: 'ศษ.' },
      { id: 'loc_ss_canteen', name: 'โรงอาหาร ศษ.', department: 'ศษ.' },

      // ส่วนกลาง / อื่นๆ
      { id: 'loc_cen_gate', name: 'ป้อมยาม / ประตูทางเข้า', department: 'ส่วนกลาง' },
      { id: 'loc_cen_park', name: 'ลานจอดรถส่วนกลาง', department: 'ส่วนกลาง' },
      { id: 'loc_cen_garden', name: 'สวนหย่อม / ภูมิทัศน์', department: 'ส่วนกลาง' }
    ],
    departments: [
      { id: 'dep_1', name: 'ฝ่ายวิชาการ' },
      { id: 'dep_2', name: 'ฝ่ายบริหารทั่วไป / ธุรการ' },
      { id: 'dep_3', name: 'ฝ่ายกิจการนักเรียน / นักศึกษา' },
      { id: 'dep_4', name: 'ฝ่ายแผนงานและงบประมาณ' },
      { id: 'dep_5', name: 'ฝ่ายอาคารสถานที่และยานพาหนะ' },
      { id: 'dep_6', name: 'แผนกเทคโนโลยีสารสนเทศ (IT)' },
      { id: 'dep_7', name: 'แผนกโสตทัศนศึกษา (AV)' },
      { id: 'dep_8', name: 'ฝ่ายพยาบาลและสุขอนามัย' }
    ],
    projects: [
      { id: 'prj_1', name: 'โครงการปรับปรุงระบบไฟฟ้าและแสงสว่าง', department: 'วพบ.' },
      { id: 'prj_2', name: 'โครงการปรับปรุงห้องปฏิบัติการคอมพิวเตอร์', department: 'ศษ.' },
      { id: 'prj_3', name: 'โครงการบำรุงรักษาเครื่องปรับอากาศประจำปี', department: 'วพบ.' },
      { id: 'prj_4', name: 'โครงการจัดซื้อครุภัณฑ์โสตทัศนูปกรณ์ประจำอาคาร', department: 'ศษ.' },
      { id: 'prj_5', name: 'โครงการปรับปรุงภูมิทัศน์และสวนหย่อม', department: 'ส่วนกลาง' }
    ],
    mechanics: [
      { id: 'mec_1', name: 'ช่างสมชาย ใจดี', phone: '081-234-5678', skills: 'ไฟฟ้า, แอร์, ประปา' },
      { id: 'mec_2', name: 'ช่างวิชัย มั่นคง', phone: '089-876-5432', skills: 'ช่างไม้, ทาสี, ประตูหน้าต่าง' },
      { id: 'mec_3', name: 'ทีมเทคนิคไอที (IT Support)', phone: '086-111-2222', skills: 'คอมพิวเตอร์, เน็ตเวิร์ก, กล้องวงจรปิด' },
      { id: 'mec_4', name: 'เจ้าหน้าที่โสตทัศนศึกษา (AV)', phone: '084-333-4444', skills: 'เครื่องเสียง, โปรเจคเตอร์, ระบบถ่ายทอดสด' }
    ],
    settings: {
      overdueDays: 3
    }
  };

  let state = {
    locations: [],
    departments: [],
    projects: [],
    mechanics: [],
    settings: { overdueDays: 3 },
    loaded: false
  };

  // โหลดจาก Local Cache เพื่อให้หน้าจอแสดงผลได้ทันที
  function loadCache() {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        state = { ...state, ...parsed };
      }
    } catch (e) {
      console.warn('Load MasterData cache error:', e);
    }
  }

  function saveCache() {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('Save MasterData cache error:', e);
    }
  }

  // ดึงข้อมูลจาก Firebase Collection 'master_data'
  async function load(force = false) {
    loadCache();
    if (state.loaded && !force) {
      renderMasterDataUI();
      initFormDropdowns();
      return state;
    }

    if (!window.firestoreDb) {
      renderMasterDataUI();
      initFormDropdowns();
      return state;
    }

    try {
      const colRef = window.firestoreDb.collection('master_data');
      const snap = await colRef.get();

      if (snap.empty) {
        // หากใน Firebase ยังไม่มีข้อมูล ให้สร้างชุดข้อมูลเริ่มต้นทันที (Auto-Seed)
        console.log('Firebase master_data is empty. Auto-seeding initial data...');
        await seedInitialData(true);
        return state;
      }

      snap.forEach(doc => {
        const id = doc.id;
        const d = doc.data() || {};
        if (id === 'locations') state.locations = Array.isArray(d.items) ? d.items : [];
        if (id === 'departments') state.departments = Array.isArray(d.items) ? d.items : [];
        if (id === 'projects') state.projects = Array.isArray(d.items) ? d.items : [];
        if (id === 'mechanics') state.mechanics = Array.isArray(d.items) ? d.items : [];
        if (id === 'settings') state.settings = d || { overdueDays: 3 };
      });

      // ถ้าหมวดไหนยังว่างเปล่า ให้เติมค่าเริ่มต้นเฉพาะหมวดนั้น
      if (!state.locations.length) state.locations = [...DEFAULT_DATA.locations];
      if (!state.departments.length) state.departments = [...DEFAULT_DATA.departments];
      if (!state.projects.length) state.projects = [...DEFAULT_DATA.projects];
      if (!state.mechanics.length) state.mechanics = [...DEFAULT_DATA.mechanics];

      state.loaded = true;
      saveCache();
      renderMasterDataUI();
      initFormDropdowns();
    } catch (e) {
      console.error('MasterData load error:', e);
      if (!state.locations.length) state = { ...DEFAULT_DATA, loaded: true };
      renderMasterDataUI();
      initFormDropdowns();
    }
    return state;
  }

  // บันทึกชุดข้อมูลเริ่มต้นลง Firestore (Seed Data)
  async function seedInitialData(silent = false) {
    if (!window.firestoreDb) return;
    try {
      const colRef = window.firestoreDb.collection('master_data');
      const batch = window.firestoreDb.batch();

      batch.set(colRef.doc('locations'), { items: DEFAULT_DATA.locations });
      batch.set(colRef.doc('departments'), { items: DEFAULT_DATA.departments });
      batch.set(colRef.doc('projects'), { items: DEFAULT_DATA.projects });
      batch.set(colRef.doc('mechanics'), { items: DEFAULT_DATA.mechanics });
      batch.set(colRef.doc('settings'), DEFAULT_DATA.settings);

      await batch.commit();

      state = { ...DEFAULT_DATA, loaded: true };
      saveCache();
      renderMasterDataUI();
      initFormDropdowns();

      if (!silent && typeof Swal !== 'undefined') {
        Swal.fire({
          icon: 'success',
          title: 'นำเข้าข้อมูลเริ่มต้นสำเร็จ',
          text: 'สร้างข้อมูลสถานที่, แผนก, โครงการ และช่างเริ่มต้นเรียบร้อยแล้ว',
          confirmButtonColor: '#265D5A'
        });
      }
    } catch (e) {
      console.error('Seed initial data error:', e);
      if (!silent && typeof Swal !== 'undefined') {
        Swal.fire('ข้อผิดพลาด', 'ไม่สามารถบันทึกข้อมูลเริ่มต้นได้: ' + e.message, 'error');
      }
    }
  }

  // เพิ่มข้อมูลลงในหมวด (type: 'location' | 'department' | 'project' | 'mechanic')
  async function addItem(type, item) {
    if (!item.id) item.id = `${type}_${Date.now()}`;
    const key = (type === 'location') ? 'locations'
              : (type === 'department') ? 'departments'
              : (type === 'project') ? 'projects'
              : (type === 'mechanic') ? 'mechanics' : null;
    if (!key) return;

    state[key].push(item);
    saveCache();
    renderMasterDataUI();
    initFormDropdowns();

    if (window.firestoreDb) {
      try {
        await window.firestoreDb.collection('master_data').doc(key).set({
          items: state[key]
        });
      } catch (e) {
        console.error(`Save ${key} to Firestore error:`, e);
      }
    }
  }

  // ลบข้อมูลออกจากหมวด
  async function deleteItem(type, id) {
    const key = (type === 'location') ? 'locations'
              : (type === 'department') ? 'departments'
              : (type === 'project') ? 'projects'
              : (type === 'mechanic') ? 'mechanics' : null;
    if (!key) return;

    state[key] = state[key].filter(x => x.id !== id);
    saveCache();
    renderMasterDataUI();
    initFormDropdowns();

    if (window.firestoreDb) {
      try {
        await window.firestoreDb.collection('master_data').doc(key).set({
          items: state[key]
        });
      } catch (e) {
        console.error(`Delete ${key} from Firestore error:`, e);
      }
    }
  }

  // บันทึกการตั้งค่า Overdue Days
  async function saveSettings(settings) {
    state.settings = { ...state.settings, ...settings };
    saveCache();
    if (window.firestoreDb) {
      try {
        await window.firestoreDb.collection('master_data').doc('settings').set(state.settings);
      } catch (e) {
        console.error('Save settings error:', e);
      }
    }
  }

  // ---------- ฟังก์ชันผูก Dropdown ในแบบฟอร์ม ----------

  // อัปเดตตัวเลือกสถานที่ใน Dropdown ตามสถาบัน/สังกัดที่เลือก
  function updateLocationSelect(instVal, selectElId, otherInputId) {
    const sel = document.getElementById(selectElId);
    if (!sel) return;

    const inst = (instVal || '').trim();
    const allLocs = state.locations || [];

    // กรองสถานที่: ถ้าเลือก วพบ. ก็เอาของ วพบ. + ส่วนกลาง, ถ้าเลือก ศษ. ก็เอาของ ศษ. + ส่วนกลาง
    let filtered = allLocs;
    if (inst === 'วพบ.') {
      filtered = allLocs.filter(l => l.department === 'วพบ.' || l.department === 'ส่วนกลาง' || l.department === 'วิทยาลัย');
    } else if (inst === 'ศษ.') {
      filtered = allLocs.filter(l => l.department === 'ศษ.' || l.department === 'ส่วนกลาง' || l.department === 'โรงเรียน');
    }

    let html = `<option value="" disabled selected>-- เลือกสถานที่ / ห้อง --</option>`;
    filtered.forEach(loc => {
      const deptTag = loc.department ? `[${loc.department}] ` : '';
      html += `<option value="${sanitize(loc.name)}">${deptTag}${sanitize(loc.name)}</option>`;
    });
    html += `<option value="__OTHER__">➕ อื่นๆ (พิมพ์ระบุเอง)...</option>`;

    sel.innerHTML = html;

    // ซ่อนช่องกรอกอื่นๆ ไว้ก่อน
    if (otherInputId) {
      const otherInput = document.getElementById(otherInputId);
      if (otherInput) otherInput.classList.add('hidden');
    }
  }

  // ตรวจจับเมื่อเลือก "อื่นๆ (ระบุเอง)" ใน Dropdown ใดๆ
  function handleSelectOther(selectElId, otherInputId) {
    const sel = document.getElementById(selectElId);
    const other = document.getElementById(otherInputId);
    if (!sel || !other) return;

    if (sel.value === '__OTHER__') {
      other.classList.remove('hidden');
      other.required = true;
      other.focus();
    } else {
      other.classList.add('hidden');
      other.required = false;
      other.value = '';
    }
  }

  // เติมข้อมูลลง Dropdown แผนก/ฝ่าย
  function updateDepartmentSelect(selectElId, otherInputId) {
    const sel = document.getElementById(selectElId);
    if (!sel) return;

    const depts = state.departments || [];
    let html = `<option value="" disabled selected>-- เลือกฝ่าย / แผนก --</option>`;
    depts.forEach(d => {
      html += `<option value="${sanitize(d.name)}">${sanitize(d.name)}</option>`;
    });
    html += `<option value="__OTHER__">➕ อื่นๆ (พิมพ์ระบุเอง)...</option>`;
    sel.innerHTML = html;

    if (otherInputId) {
      const otherInput = document.getElementById(otherInputId);
      if (otherInput) otherInput.classList.add('hidden');
    }
  }

  // เติมข้อมูลลง Dropdown โครงการ
  function updateProjectSelect(selectElId, otherInputId) {
    const sel = document.getElementById(selectElId);
    if (!sel) return;

    const prjs = state.projects || [];
    let html = `<option value="" disabled selected>-- เลือกโครงการ --</option>`;
    prjs.forEach(p => {
      html += `<option value="${sanitize(p.name)}">${sanitize(p.name)}</option>`;
    });
    html += `<option value="__OTHER__">➕ โครงการใหม่ (พิมพ์ระบุเอง)...</option>`;
    sel.innerHTML = html;

    if (otherInputId) {
      const otherInput = document.getElementById(otherInputId);
      if (otherInput) otherInput.classList.add('hidden');
    }
  }

  // ดึงค่าจริงจากฟิลด์ (ถ้าเลือก __OTHER__ ให้ดึงค่าจากช่องพิมพ์เอง)
  function getValue(selectId, otherId) {
    const sel = document.getElementById(selectId);
    if (!sel) return '';
    if (sel.value === '__OTHER__') {
      const other = document.getElementById(otherId);
      return other ? other.value.trim() : '';
    }
    return sel.value ? sel.value.trim() : '';
  }

  // ผูกตัวเลือกในแบบฟอร์มทุกหน้า
  function initFormDropdowns() {
    // 1. แบบฟอร์มแจ้งซ่อมอาคาร (Repair)
    const repairInst = document.getElementById('repair_inst');
    if (repairInst) {
      updateLocationSelect(repairInst.value, 'repair_location', 'repair_location_other');
      repairInst.onchange = () => updateLocationSelect(repairInst.value, 'repair_location', 'repair_location_other');
    }
    const repairLoc = document.getElementById('repair_location');
    if (repairLoc) {
      repairLoc.onchange = () => handleSelectOther('repair_location', 'repair_location_other');
    }
    updateDepartmentSelect('department', 'department_other');
    const repairDept = document.getElementById('department');
    if (repairDept) {
      repairDept.onchange = () => handleSelectOther('department', 'department_other');
    }

    // 2. แบบฟอร์มแจ้งซ่อมไอที (IT)
    const itInst = document.getElementById('it_inst');
    if (itInst) {
      updateLocationSelect(itInst.value, 'itLocation', 'itLocation_other');
      itInst.onchange = () => updateLocationSelect(itInst.value, 'itLocation', 'itLocation_other');
    }
    const itLoc = document.getElementById('itLocation');
    if (itLoc) {
      itLoc.onchange = () => handleSelectOther('itLocation', 'itLocation_other');
    }
    updateDepartmentSelect('itDepartment', 'itDepartment_other');
    const itDept = document.getElementById('itDepartment');
    if (itDept) {
      itDept.onchange = () => handleSelectOther('itDepartment', 'itDepartment_other');
    }

    // 3. แบบฟอร์มแจ้งซ่อมโสตฯ (AV Repair)
    const avRepInst = document.getElementById('avRep_inst');
    if (avRepInst) {
      updateLocationSelect(avRepInst.value, 'avRepLocation', 'avRepLocation_other');
      avRepInst.onchange = () => updateLocationSelect(avRepInst.value, 'avRepLocation', 'avRepLocation_other');
    }
    const avRepLoc = document.getElementById('avRepLocation');
    if (avRepLoc) {
      avRepLoc.onchange = () => handleSelectOther('avRepLocation', 'avRepLocation_other');
    }
    updateDepartmentSelect('avRepDepartment', 'avRepDepartment_other');
    const avRepDept = document.getElementById('avRepDepartment');
    if (avRepDept) {
      avRepDept.onchange = () => handleSelectOther('avRepDepartment', 'avRepDepartment_other');
    }

    // 4. แบบฟอร์มขอยืมอุปกรณ์โสตฯ (AV Form)
    const avInst = document.getElementById('av_inst');
    if (avInst) {
      updateLocationSelect(avInst.value, 'av_location', 'av_location_other');
      avInst.onchange = () => updateLocationSelect(avInst.value, 'av_location', 'av_location_other');
    }
    const avLoc = document.getElementById('av_location');
    if (avLoc) {
      avLoc.onchange = () => handleSelectOther('av_location', 'av_location_other');
    }

    // 5. แบบฟอร์มเสนอโครงการ (Project)
    updateDepartmentSelect('projDepartment', 'projDepartment_other');
    const projDept = document.getElementById('projDepartment');
    if (projDept) {
      projDept.onchange = () => handleSelectOther('projDepartment', 'projDepartment_other');
    }
    updateLocationSelect('ทั้งหมด', 'projLocation', 'projLocation_other');
    const projLoc = document.getElementById('projLocation');
    if (projLoc) {
      projLoc.onchange = () => handleSelectOther('projLocation', 'projLocation_other');
    }
  }

  // แสดงผลในหน้า Master Data UI (page-master-data.html)
  function renderMasterDataUI() {
    const locEl = document.getElementById('md-locations');
    const depEl = document.getElementById('md-departments');
    const proEl = document.getElementById('md-projects');
    const mecEl = document.getElementById('md-mechanics');

    if (locEl) {
      locEl.innerHTML = (state.locations || []).map(x =>
        `<div class="flex justify-between items-center p-2.5 rounded-xl bg-slate-50 text-slate-800 border border-slate-100 hover:bg-slate-100/60 transition">
          <div class="flex items-center gap-2">
            <span class="text-xs px-2 py-0.5 rounded-md font-semibold ${x.department === 'วพบ.' ? 'bg-sky-100 text-sky-700' : (x.department === 'ศษ.' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700')}">${sanitize(x.department || 'ทั่วไป')}</span>
            <span class="font-medium text-sm">${sanitize(x.name)}</span>
          </div>
          <div class="flex items-center gap-3">
            <button onclick="if(typeof openQrGenModal === 'function') openQrGenModal('${sanitize(x.name)}')" class="text-[#265D5A] hover:text-[#1a3f3d] p-1" title="สร้าง QR Code"><i class="fa-solid fa-qrcode"></i></button>
            <button onclick="MasterData.deleteItem('location','${sanitize(x.id)}')" class="text-rose-500 hover:text-rose-700 p-1" title="ลบ"><i class="fa-solid fa-trash-can"></i></button>
          </div>
        </div>`
      ).join('') || '<p class="text-slate-400 text-sm p-4 text-center">ยังไม่มีข้อมูล</p>';
    }

    if (depEl) {
      depEl.innerHTML = (state.departments || []).map(x =>
        `<div class="flex justify-between items-center p-2.5 rounded-xl bg-slate-50 text-slate-800 border border-slate-100 hover:bg-slate-100/60 transition">
          <span class="font-medium text-sm"><i class="fa-solid fa-building-user text-slate-400 mr-2"></i>${sanitize(x.name)}</span>
          <button onclick="MasterData.deleteItem('department','${sanitize(x.id)}')" class="text-rose-500 hover:text-rose-700 p-1" title="ลบ"><i class="fa-solid fa-trash-can"></i></button>
        </div>`
      ).join('') || '<p class="text-slate-400 text-sm p-4 text-center">ยังไม่มีข้อมูล</p>';
    }

    if (proEl) {
      proEl.innerHTML = (state.projects || []).map(x =>
        `<div class="flex justify-between items-center p-2.5 rounded-xl bg-slate-50 text-slate-800 border border-slate-100 hover:bg-slate-100/60 transition">
          <div>
            <div class="font-medium text-sm">${sanitize(x.name)}</div>
            <small class="text-xs text-slate-400">${sanitize(x.department || '')}</small>
          </div>
          <button onclick="MasterData.deleteItem('project','${sanitize(x.id)}')" class="text-rose-500 hover:text-rose-700 p-1" title="ลบ"><i class="fa-solid fa-trash-can"></i></button>
        </div>`
      ).join('') || '<p class="text-slate-400 text-sm p-4 text-center">ยังไม่มีข้อมูล</p>';
    }

    if (mecEl) {
      mecEl.innerHTML = (state.mechanics || []).map(x =>
        `<div class="p-2.5 rounded-xl bg-slate-50 text-slate-800 border border-slate-100 hover:bg-slate-100/60 transition">
          <div class="flex justify-between items-start">
            <b class="text-sm text-slate-800">${sanitize(x.name)}</b>
            <button onclick="MasterData.deleteItem('mechanic','${sanitize(x.id)}')" class="text-rose-500 hover:text-rose-700 p-1" title="ลบ"><i class="fa-solid fa-trash-can"></i></button>
          </div>
          <div class="text-xs text-slate-500 mt-1 flex flex-wrap gap-2">
            <span><i class="fa-solid fa-phone text-slate-400 mr-1"></i>${sanitize(x.phone || '-')}</span>
            <span><i class="fa-solid fa-wrench text-slate-400 mr-1"></i>${sanitize(x.skills || '-')}</span>
          </div>
        </div>`
      ).join('') || '<p class="text-slate-400 text-sm p-4 text-center">ยังไม่มีข้อมูล</p>';
    }

    const overdueInput = document.getElementById('md-overdue-days');
    if (overdueInput && state.settings && state.settings.overdueDays) {
      overdueInput.value = state.settings.overdueDays;
    }
  }

  function sanitize(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  return {
    load,
    addItem,
    deleteItem,
    saveSettings,
    seedInitialData,
    initFormDropdowns,
    updateLocationSelect,
    handleSelectOther,
    updateDepartmentSelect,
    updateProjectSelect,
    getValue,
    getState: () => state,
    DEFAULT_DATA
  };
})();

window.MasterData = MasterData;

// Global Hooks สำหรับหน้า HTML
window.loadMasterData = function (force = true) {
  return MasterData.load(force);
};

window.seedInitialMasterData = function () {
  if (typeof Swal !== 'undefined') {
    Swal.fire({
      title: 'นำเข้าข้อมูลเริ่มต้นมาตรฐาน?',
      html: 'ระบบจะสร้างข้อมูลสถานที่ (วพบ./ศษ.), แผนก/ฝ่าย, โครงการ และช่างเริ่มต้นลงฐานข้อมูล',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'ยืนยันนำเข้า',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#265D5A'
    }).then(res => {
      if (res.isConfirmed) MasterData.seedInitialData(false);
    });
  } else {
    MasterData.seedInitialData(false);
  }
};

window.addMaster = async function (type) {
  const item = {};
  if (type === 'location') {
    const nameEl = document.getElementById('md-location-name');
    const deptEl = document.getElementById('md-location-dept');
    if (!nameEl || !nameEl.value.trim()) return alertBox('warning', 'ข้อมูลไม่ครบ', 'กรุณากรอกชื่อสถานที่/ห้อง');
    item.name = nameEl.value.trim();
    item.department = deptEl ? deptEl.value : 'วพบ.';
    nameEl.value = '';
  } else if (type === 'department') {
    const nameEl = document.getElementById('md-dept-name');
    if (!nameEl || !nameEl.value.trim()) return alertBox('warning', 'ข้อมูลไม่ครบ', 'กรุณากรอกชื่อแผนก/ฝ่าย');
    item.name = nameEl.value.trim();
    nameEl.value = '';
  } else if (type === 'project') {
    const nameEl = document.getElementById('md-project-name');
    const deptEl = document.getElementById('md-project-dept');
    if (!nameEl || !nameEl.value.trim()) return alertBox('warning', 'ข้อมูลไม่ครบ', 'กรุณากรอกชื่อโครงการ');
    item.name = nameEl.value.trim();
    item.department = deptEl ? deptEl.value : 'ทั่วไป';
    nameEl.value = '';
  } else if (type === 'mechanic') {
    const nameEl = document.getElementById('md-mechanic-name');
    const phoneEl = document.getElementById('md-mechanic-phone');
    const skillEl = document.getElementById('md-mechanic-skills');
    if (!nameEl || !nameEl.value.trim()) return alertBox('warning', 'ข้อมูลไม่ครบ', 'กรุณากรอกชื่อช่าง');
    item.name = nameEl.value.trim();
    item.phone = phoneEl ? phoneEl.value.trim() : '';
    item.skills = skillEl ? skillEl.value.trim() : '';
    nameEl.value = '';
    if (phoneEl) phoneEl.value = '';
    if (skillEl) skillEl.value = '';
  }

  await MasterData.addItem(type, item);
  if (typeof alertBox === 'function') {
    alertBox('success', 'เพิ่มข้อมูลสำเร็จ', '', { timer: 1200, showConfirmButton: false });
  }
};

window.deleteMaster = async function (type, id) {
  if (typeof Swal !== 'undefined') {
    const confirm = await Swal.fire({
      title: 'ยืนยันการลบ?',
      text: 'ข้อมูลที่ลบจะไม่สามารถกู้คืนได้',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'ใช่, ลบเลย',
      cancelButtonText: 'ยกเลิก'
    });
    if (!confirm.isConfirmed) return;
  }
  await MasterData.deleteItem(type, id);
};

window.saveOverdueSettings = async function () {
  const daysEl = document.getElementById('md-overdue-days');
  const days = daysEl ? Number(daysEl.value) || 3 : 3;
  await MasterData.saveSettings({ overdueDays: days });
  if (typeof alertBox === 'function') {
    alertBox('success', 'บันทึกสำเร็จ', 'อัปเดตการตั้งค่าแจ้งเตือนแล้ว');
  }
};

// โหลดข้อมูล Master Data ทันทีเมื่อ DOM พร้อม
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => MasterData.load());
} else {
  MasterData.load();
}
