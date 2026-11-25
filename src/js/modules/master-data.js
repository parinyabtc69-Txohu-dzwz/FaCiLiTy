// ============================================================
// ระบบจัดการข้อมูลหลัก Master Data (Firebase Firestore)
// จัดการ: สถานที่/ห้อง, แผนก/ฝ่าย, โครงการ, ช่างผู้รับผิดชอบ
// รองรับการแสดงผลแบบ Dropdown ในแบบฟอร์มทุกหน้า
// ============================================================

const MasterData = (() => {
  const CACHE_KEY = 'master_data_cache_v3';
  const LEGACY_CACHE_KEYS = ['master_data_cache_v2'];

  // ข้อมูลเริ่มต้นมาตรฐาน (Default Seed Data)
  const DEFAULT_DATA = {
    locations: [
      // ---------- ตึก วพบ. (วิทยาลัยพยาบาลบรมราชชนนี) ----------
      // ชั้น 1
      { id: 'loc_wpb_101', name: 'ห้อง 101 (ชั้น 1)', department: 'วพบ.' },
      { id: 'loc_wpb_102', name: 'ห้อง 102 (ชั้น 1)', department: 'วพบ.' },
      { id: 'loc_wpb_103', name: 'ห้อง 103 - ผู้ช่วย วพบ. (ชั้น 1)', department: 'วพบ.' },
      { id: 'loc_wpb_104', name: 'ห้อง 104 (ชั้น 1)', department: 'วพบ.' },
      { id: 'loc_wpb_105', name: 'ห้อง 105 (ชั้น 1)', department: 'วพบ.' },
      { id: 'loc_wpb_106', name: 'ห้อง 106 (ชั้น 1)', department: 'วพบ.' },
      { id: 'loc_wpb_off', name: 'ห้องธุรการ (ชั้น 1)', department: 'วพบ.' },

      // ชั้น 2
      { id: 'loc_wpb_201', name: 'ห้อง 201 (ชั้น 2)', department: 'วพบ.' },
      { id: 'loc_wpb_202', name: 'ห้อง 202 (ชั้น 2)', department: 'วพบ.' },
      { id: 'loc_wpb_203', name: 'ห้อง 203 (ชั้น 2)', department: 'วพบ.' },
      { id: 'loc_wpb_204', name: 'ห้อง 204 (ชั้น 2)', department: 'วพบ.' },
      { id: 'loc_wpb_205', name: 'ห้อง 205 (ชั้น 2)', department: 'วพบ.' },
      { id: 'loc_wpb_206', name: 'ห้อง 206 (ชั้น 2)', department: 'วพบ.' },
      { id: 'loc_wpb_sport', name: 'ห้องอุปกรณ์กีฬา (ชั้น 2)', department: 'วพบ.' },

      // ชั้น 3
      { id: 'loc_wpb_301', name: 'ห้อง 301 (ชั้น 3)', department: 'วพบ.' },
      { id: 'loc_wpb_302', name: 'ห้อง 302 (ชั้น 3)', department: 'วพบ.' },
      { id: 'loc_wpb_303', name: 'ห้อง 303 (ชั้น 3)', department: 'วพบ.' },
      { id: 'loc_wpb_304', name: 'ห้อง 304 (ชั้น 3)', department: 'วพบ.' },
      { id: 'loc_wpb_305', name: 'ห้อง 305 (ชั้น 3)', department: 'วพบ.' },
      { id: 'loc_wpb_306', name: 'ห้อง 306 (ชั้น 3)', department: 'วพบ.' },
      { id: 'loc_wpb_309', name: 'ห้อง 309 (ชั้น 3)', department: 'วพบ.' },

      // ชั้น 4
      { id: 'loc_wpb_401', name: 'ห้อง 401 - ห้องเสื้อผ้า (ชั้น 4)', department: 'วพบ.' },
      { id: 'loc_wpb_402', name: 'ห้อง 402 (ชั้น 4)', department: 'วพบ.' },
      { id: 'loc_wpb_403', name: 'ห้อง 403 - ห้องเรียน (ชั้น 4)', department: 'วพบ.' },
      { id: 'loc_wpb_404', name: 'ห้อง 404 (ชั้น 4)', department: 'วพบ.' },
      { id: 'loc_wpb_405', name: 'ห้อง 405 (ชั้น 4)', department: 'วพบ.' },
      { id: 'loc_wpb_406', name: 'ห้อง 406 (ชั้น 4)', department: 'วพบ.' },
      { id: 'loc_wpb_wc4', name: 'ห้องน้ำหญิง (ชั้น 4)', department: 'วพบ.' },

      // ---------- ตึก ศษ. (ศูนย์การศึกษา / โรงเรียน) ----------
      // ชั้น 1 / บริการ
      { id: 'loc_ss_coop', name: 'สหกรณ์ (ชั้น 1)', department: 'ศษ.' },
      { id: 'loc_ss_store', name: 'ห้องเก็บของ ศษ. (ชั้น 1)', department: 'ศษ.' },
      { id: 'loc_ss_pool', name: 'สระว่ายน้ำ (ชั้น 1)', department: 'ศษ.' },
      { id: 'loc_ss_wc', name: 'ห้องน้ำ ศษ. (ชั้น 1)', department: 'ศษ.' },

      // ชั้น 2
      { id: 'loc_ss_201', name: 'ห้อง 201 (ชั้น 2)', department: 'ศษ.' },
      { id: 'loc_ss_202', name: 'ห้อง 202 (ชั้น 2)', department: 'ศษ.' },
      { id: 'loc_ss_203', name: 'ห้อง 203 (ชั้น 2)', department: 'ศษ.' },
      { id: 'loc_ss_204', name: 'ห้อง 204 (ชั้น 2)', department: 'ศษ.' },
      { id: 'loc_ss_205', name: 'ห้อง 205 (ชั้น 2)', department: 'ศษ.' },
      { id: 'loc_ss_206', name: 'ห้อง 206 (ชั้น 2)', department: 'ศษ.' },
      { id: 'loc_ss_207', name: 'ห้อง 207 (ชั้น 2)', department: 'ศษ.' },
      { id: 'loc_ss_208', name: 'ห้อง 208 (ชั้น 2)', department: 'ศษ.' },
      { id: 'loc_ss_209', name: 'ห้อง 209 (ชั้น 2)', department: 'ศษ.' },
      { id: 'loc_ss_210', name: 'ห้อง 210 (ชั้น 2)', department: 'ศษ.' },

      // ชั้น 3
      { id: 'loc_ss_301', name: 'ห้อง 301 (ชั้น 3)', department: 'ศษ.' },
      { id: 'loc_ss_302', name: 'ห้อง 302 (ชั้น 3)', department: 'ศษ.' },
      { id: 'loc_ss_303', name: 'ห้อง 303 (ชั้น 3)', department: 'ศษ.' },
      { id: 'loc_ss_304', name: 'ห้อง 304 (ชั้น 3)', department: 'ศษ.' },
      { id: 'loc_ss_305', name: 'ห้อง 305 (ชั้น 3)', department: 'ศษ.' },
      { id: 'loc_ss_306', name: 'ห้อง 306 (ชั้น 3)', department: 'ศษ.' },
      { id: 'loc_ss_307', name: 'ห้อง 307 (ชั้น 3)', department: 'ศษ.' },
      { id: 'loc_ss_308', name: 'ห้อง 308 (ชั้น 3)', department: 'ศษ.' },
      { id: 'loc_ss_309', name: 'ห้อง 309 (ชั้น 3)', department: 'ศษ.' },
      { id: 'loc_ss_310', name: 'ห้อง 310 (ชั้น 3)', department: 'ศษ.' },

      // ชั้น 4
      { id: 'loc_ss_401', name: 'ห้อง 401 (ชั้น 4)', department: 'ศษ.' },
      { id: 'loc_ss_402', name: 'ห้อง 402 (ชั้น 4)', department: 'ศษ.' },
      { id: 'loc_ss_403', name: 'ห้อง 403 (ชั้น 4)', department: 'ศษ.' },
      { id: 'loc_ss_404', name: 'ห้อง 404 (ชั้น 4)', department: 'ศษ.' },
      { id: 'loc_ss_405', name: 'ห้อง 405 (ชั้น 4)', department: 'ศษ.' },
      { id: 'loc_ss_406', name: 'ห้อง 406 (ชั้น 4)', department: 'ศษ.' },
      { id: 'loc_ss_407', name: 'ห้อง 407 (ชั้น 4)', department: 'ศษ.' },
      { id: 'loc_ss_408', name: 'ห้อง 408 (ชั้น 4)', department: 'ศษ.' },
      { id: 'loc_ss_409', name: 'ห้อง 409 (ชั้น 4)', department: 'ศษ.' },
      { id: 'loc_ss_410', name: 'ห้อง 410 (ชั้น 4)', department: 'ศษ.' },
      { id: 'loc_ss_meet4', name: 'ห้องประชุม ศษ. (ชั้น 4)', department: 'ศษ.' },
      { id: 'loc_ss_type4', name: 'ห้องพิมพ์ดีด / คอมพิวเตอร์ (ชั้น 4)', department: 'ศษ.' },

      // ชั้น 5
      { id: 'loc_ss_501', name: 'ห้อง 501 (ชั้น 5)', department: 'ศษ.' },
      { id: 'loc_ss_502', name: 'ห้อง 502 (ชั้น 5)', department: 'ศษ.' },
      { id: 'loc_ss_503', name: 'ห้อง 503 (ชั้น 5)', department: 'ศษ.' },
      { id: 'loc_ss_504', name: 'ห้อง 504 (ชั้น 5)', department: 'ศษ.' },
      { id: 'loc_ss_505', name: 'ห้อง 505 (ชั้น 5)', department: 'ศษ.' },
      { id: 'loc_ss_506', name: 'ห้อง 506 (ชั้น 5)', department: 'ศษ.' },
      { id: 'loc_ss_507', name: 'ห้อง 507 (ชั้น 5)', department: 'ศษ.' },
      { id: 'loc_ss_508', name: 'ห้อง 508 (ชั้น 5)', department: 'ศษ.' },

      // ห้องปฏิบัติการ
      { id: 'loc_ss_lab', name: 'ห้อง LAB', department: 'ศษ.' },

      // ---------- ส่วนกลาง / อื่นๆ ----------
      { id: 'loc_cen_gate', name: 'ป้อมยาม / ประตูทางเข้า', department: 'ส่วนกลาง' },
      { id: 'loc_cen_park', name: 'ลานจอดรถ', department: 'ส่วนกลาง' },
      { id: 'loc_cen_canteen', name: 'โรงอาหาร', department: 'ส่วนกลาง' },
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
    settings: { ...DEFAULT_DATA.settings },
    loaded: false
  };

  let retryCount = 0;
  const writeQueues = {};
  const activeWriteCount = {};
  const CATEGORY_MAP = {
    location: 'locations',
    department: 'departments',
    project: 'projects',
    mechanic: 'mechanics'
  };

  function getCategoryKey(type) {
    return CATEGORY_MAP[type] || null;
  }

  function cloneItems(arr) {
    return Array.isArray(arr) ? arr.map(item => ({ ...item })) : [];
  }

  function matchesDeptFilter(itemDept, filterDept, includeCentral = false) {
    if (!filterDept || filterDept === 'ทั้งหมด') return true;
    const dept = String(itemDept || '').trim();
    if (includeCentral && dept === 'ส่วนกลาง') return true;
    if (filterDept.startsWith('วพบ')) return dept.startsWith('วพบ') || dept === 'วิทยาลัย';
    if (filterDept.startsWith('ศษ')) return dept.startsWith('ศษ') || dept === 'โรงเรียน';
    if (filterDept.includes('ส่วนกลาง')) return dept === 'ส่วนกลาง';
    return dept === filterDept;
  }

  // โหลดจาก Local Cache (ยอมรับค่าว่าง [] หากเคยซิงก์และถูกลบไว้จริง)
  function loadCache() {
    try {
      LEGACY_CACHE_KEYS.forEach(k => localStorage.removeItem(k));
      const raw = localStorage.getItem(CACHE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          if (Array.isArray(parsed.locations)) state.locations = parsed.locations;
          if (Array.isArray(parsed.departments)) state.departments = parsed.departments;
          if (Array.isArray(parsed.projects)) state.projects = parsed.projects;
          if (Array.isArray(parsed.mechanics)) state.mechanics = parsed.mechanics;
          if (parsed.settings && typeof parsed.settings === 'object') state.settings = { ...state.settings, ...parsed.settings };
          if (parsed.loaded) {
            state.loaded = true;
          }
        }
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
    renderMasterDataUI();
    initFormDropdowns();

    if (state.loaded && !force && window._masterDataFirestoreSynced) {
      return state;
    }

    if (!window.firestoreDb && typeof initFirebase === 'function') {
      initFirebase();
    }

    if (!window.firestoreDb) {
      if (retryCount < 10) {
        retryCount++;
        setTimeout(() => load(force), 600);
      }
      return state;
    }

    try {
      const colRef = window.firestoreDb.collection('master_data');
      const getPromise = typeof window.withTimeout === 'function' ? window.withTimeout(colRef.get(), 6000) : colRef.get();
      const snap = await getPromise;

      if (snap.empty) {
        // หากใน Firebase ยังไม่มี collection master_data เลย ให้สร้างชุดข้อมูลเริ่มต้นครั้งแรก
        console.log('Firebase master_data is empty. Auto-seeding initial data...');
        await seedInitialData(true);
        window._masterDataFirestoreSynced = true;
        return state;
      }

      const foundDocs = new Set();
      snap.forEach(doc => {
        const id = doc.id;
        const d = doc.data() || {};
        foundDocs.add(id);
        if (id === 'locations' && Array.isArray(d.items)) state.locations = d.items;
        if (id === 'departments' && Array.isArray(d.items)) state.departments = d.items;
        if (id === 'projects' && Array.isArray(d.items)) state.projects = d.items;
        if (id === 'mechanics' && Array.isArray(d.items)) state.mechanics = d.items;
        if (id === 'settings') state.settings = d || { overdueDays: 3 };
      });

      // สร้าง doc เฉพาะหมวดที่ยังไม่เคยมี document ใน Firestore เลยเท่านั้น (ไม่เขียนทับหมวดที่มี items: [])
      const missingKeys = ['locations', 'departments', 'projects', 'mechanics'].filter(k => !foundDocs.has(k));
      if (missingKeys.length > 0) {
        const batch = window.firestoreDb.batch();
        missingKeys.forEach(k => {
          const seed = cloneItems(DEFAULT_DATA[k]);
          state[k] = seed;
          batch.set(colRef.doc(k), { items: seed });
        });
        await batch.commit();
      }

      state.loaded = true;
      window._masterDataFirestoreSynced = true;
      saveCache();
      renderMasterDataUI();
      initFormDropdowns();

      // Real-time listener สำหรับ Master Data ทุกหมวดใน Firestore
      if (window.firestoreDb && !window._masterMechanicsListenerAttached) {
        window._masterMechanicsListenerAttached = true;
        window.firestoreDb.collection('master_data')
          .onSnapshot(colSnap => {
            if (colSnap.metadata && colSnap.metadata.hasPendingWrites) return;
            let changed = false;
            colSnap.forEach(doc => {
              const id = doc.id;
              if (activeWriteCount[id] > 0) return;
              const d = doc.data() || {};
              if ((id === 'locations' || id === 'departments' || id === 'projects' || id === 'mechanics') && Array.isArray(d.items)) {
                state[id] = d.items;
                changed = true;
              } else if (id === 'settings' && d) {
                state.settings = d;
                changed = true;
              }
            });
            if (changed) {
              state.loaded = true;
              saveCache();
              renderMasterDataUI();
              initFormDropdowns();
            }
          }, err => console.warn('MasterData real-time sync error:', err));
      }
    } catch (e) {
      console.error('MasterData load error:', e);
      renderMasterDataUI();
      initFormDropdowns();
    }
    return state;
  }

  // บันทึกชุดข้อมูลเริ่มต้นลง Firestore (Seed Data)
  async function seedInitialData(silent = false) {
    if (!window.firestoreDb && typeof initFirebase === 'function') initFirebase();
    if (!window.firestoreDb) {
      if (!silent && typeof Swal !== 'undefined') {
        Swal.fire('ข้อผิดพลาด', 'ไม่สามารถเชื่อมต่อฐานข้อมูล Firebase ได้', 'error');
      }
      return;
    }
    try {
      ['locations', 'departments', 'projects', 'mechanics', 'settings'].forEach(k => {
        activeWriteCount[k] = (activeWriteCount[k] || 0) + 1;
      });
      const colRef = window.firestoreDb.collection('master_data');
      const batch = window.firestoreDb.batch();
      const seedLocs = cloneItems(DEFAULT_DATA.locations);
      const seedDepts = cloneItems(DEFAULT_DATA.departments);
      const seedProjs = cloneItems(DEFAULT_DATA.projects);
      const seedMechs = cloneItems(DEFAULT_DATA.mechanics);
      const seedSettings = { ...DEFAULT_DATA.settings };

      batch.set(colRef.doc('locations'), { items: seedLocs });
      batch.set(colRef.doc('departments'), { items: seedDepts });
      batch.set(colRef.doc('projects'), { items: seedProjs });
      batch.set(colRef.doc('mechanics'), { items: seedMechs });
      batch.set(colRef.doc('settings'), seedSettings);

      const commitP = batch.commit();
      if (typeof window.withTimeout === 'function') await window.withTimeout(commitP, 8000);
      else await commitP;

      state = {
        locations: seedLocs,
        departments: seedDepts,
        projects: seedProjs,
        mechanics: seedMechs,
        settings: seedSettings,
        loaded: true
      };
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
    } finally {
      ['locations', 'departments', 'projects', 'mechanics', 'settings'].forEach(k => {
        activeWriteCount[k] = Math.max(0, (activeWriteCount[k] || 0) - 1);
      });
    }
  }

  // เขียนข้อมูลหมวดลง Firestore แบบเรียงคิว (ป้องกัน Race Condition และ Rollback เมื่อพัง)
  async function persistCategory(key, computeNext) {
    if (!window.firestoreDb && typeof initFirebase === 'function') initFirebase();
    if (!window.firestoreDb) {
      if (typeof alertBox === 'function') {
        alertBox('error', 'ไม่สามารถเชื่อมต่อฐานข้อมูล', 'กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองใหม่อีกครั้ง');
      }
      return false;
    }

    const previousItems = cloneItems(state[key]);
    const nextItems = computeNext(state[key]);
    state[key] = nextItems;
    state.loaded = true;
    saveCache();
    renderMasterDataUI();
    initFormDropdowns();

    activeWriteCount[key] = (activeWriteCount[key] || 0) + 1;
    const prevChain = writeQueues[key] || Promise.resolve();

    const runWrite = prevChain.then(async () => {
      const writeP = window.firestoreDb.collection('master_data').doc(key).set({
        items: nextItems
      });
      if (typeof window.withTimeout === 'function') {
        await window.withTimeout(writeP, 8000);
      } else {
        await writeP;
      }
    });

    writeQueues[key] = runWrite.catch(() => {});

    try {
      await runWrite;
      return true;
    } catch (e) {
      console.error(`Persist ${key} to Firestore error:`, e);
      if (activeWriteCount[key] <= 1) {
        state[key] = previousItems;
        saveCache();
        renderMasterDataUI();
        initFormDropdowns();
      }
      if (typeof alertBox === 'function') {
        alertBox('error', 'บันทึกข้อมูลไม่สำเร็จ', 'ไม่สามารถบันทึกลงฐานข้อมูลได้: ' + (e.message || 'กรุณาลองใหม่'));
      }
      return false;
    } finally {
      activeWriteCount[key] = Math.max(0, (activeWriteCount[key] || 0) - 1);
    }
  }

  // เพิ่มข้อมูลลงในหมวด (type: 'location' | 'department' | 'project' | 'mechanic')
  async function addItem(type, item) {
    if (!item.id) item.id = `${type}_${Date.now()}`;
    const key = getCategoryKey(type);
    if (!key) return false;
    return persistCategory(key, items => [...(items || []), item]);
  }

  // ลบข้อมูลออกจากหมวด
  async function deleteItem(type, id) {
    const key = getCategoryKey(type);
    if (!key) return false;
    const targetId = String(id ?? '');
    return persistCategory(key, items => (items || []).filter(x => String(x.id ?? '') !== targetId));
  }

  // ล้างข้อมูลในหมวด (รองรับการกรองตามสังกัดสำหรับ locations และ projects)
  async function clearCategory(type, filterDept = 'ทั้งหมด') {
    const key = getCategoryKey(type);
    if (!key) return false;
    const useDeptFilter = (key === 'locations' || key === 'projects') && filterDept && filterDept !== 'ทั้งหมด';
    return persistCategory(key, items => {
      const list = items || [];
      return useDeptFilter ? list.filter(x => !matchesDeptFilter(x.department, filterDept)) : [];
    });
  }

  // บันทึกการตั้งค่า Overdue Days
  async function saveSettings(settings) {
    const previous = { ...state.settings };
    state.settings = { ...state.settings, ...settings };
    saveCache();
    if (!window.firestoreDb && typeof initFirebase === 'function') initFirebase();
    if (!window.firestoreDb) {
      state.settings = previous;
      saveCache();
      if (typeof alertBox === 'function') alertBox('error', 'บันทึกไม่สำเร็จ', 'ไม่สามารถเชื่อมต่อฐานข้อมูล Firebase ได้');
      return false;
    }
    activeWriteCount.settings = (activeWriteCount.settings || 0) + 1;
    try {
      const p = window.firestoreDb.collection('master_data').doc('settings').set(state.settings);
      if (typeof window.withTimeout === 'function') await window.withTimeout(p, 8000);
      else await p;
      return true;
    } catch (e) {
      console.error('Save settings error:', e);
      state.settings = previous;
      saveCache();
      if (typeof alertBox === 'function') alertBox('error', 'บันทึกไม่สำเร็จ', e.message || 'เกิดข้อผิดพลาด');
      return false;
    } finally {
      activeWriteCount.settings = Math.max(0, (activeWriteCount.settings || 0) - 1);
    }
  }

  // ---------- ฟังก์ชันผูก Dropdown ในแบบฟอร์ม ----------

  // อัปเดตตัวเลือกสถานที่ใน Dropdown ตามสถาบัน/สังกัดที่เลือก
  function updateLocationSelect(instVal, selectElId, otherInputId) {
    const sel = document.getElementById(selectElId);
    if (!sel) return;

    const prevVal = sel.value;
    const inst = (instVal || '').trim();
    const allLocs = Array.isArray(state.locations) ? state.locations : [];

    // กรองสถานที่: ถ้าเลือก วพบ. ก็เอาของ วพบ. + ส่วนกลาง, ถ้าเลือก ศษ. ก็เอาของ ศษ. + ส่วนกลาง, ถ้าเลือก ส่วนกลาง ก็เอาส่วนกลาง
    const filtered = allLocs.filter(l => matchesDeptFilter(l.department, inst, true));

    let html = `<option value="" disabled selected>-- เลือกสถานที่ / ห้อง --</option>`;
    filtered.forEach(loc => {
      const deptTag = (loc.department === 'ส่วนกลาง') ? '[ส่วนกลาง] ' : '';
      html += `<option value="${sanitize(loc.name)}">${deptTag}${sanitize(loc.name)}</option>`;
    });
    html += `<option value="__OTHER__">➕ อื่นๆ (พิมพ์ระบุเอง)...</option>`;

    sel.innerHTML = html;

    if (prevVal && Array.from(sel.options).some(o => o.value === prevVal)) {
      sel.value = prevVal;
    }

    // ซ่อนช่องกรอกอื่นๆ ไว้ก่อน (เว้นแต่เลือก __OTHER__ ค้างไว้)
    if (otherInputId && sel.value !== '__OTHER__') {
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

    const prevVal = sel.value;
    const depts = Array.isArray(state.departments) ? state.departments : [];
    let html = `<option value="" disabled selected>-- เลือกฝ่าย / แผนก --</option>`;
    depts.forEach(d => {
      html += `<option value="${sanitize(d.name)}">${sanitize(d.name)}</option>`;
    });
    html += `<option value="__OTHER__">➕ อื่นๆ (พิมพ์ระบุเอง)...</option>`;
    sel.innerHTML = html;

    if (prevVal && Array.from(sel.options).some(o => o.value === prevVal)) {
      sel.value = prevVal;
    }

    if (otherInputId && sel.value !== '__OTHER__') {
      const otherInput = document.getElementById(otherInputId);
      if (otherInput) otherInput.classList.add('hidden');
    }
  }

  // เติมข้อมูลลง Dropdown โครงการ
  function updateProjectSelect(selectElId, otherInputId) {
    const sel = document.getElementById(selectElId);
    if (!sel) return;

    const prevVal = sel.value;
    const prjs = Array.isArray(state.projects) ? state.projects : [];
    let html = `<option value="" disabled selected>-- เลือกโครงการ --</option>`;
    prjs.forEach(p => {
      html += `<option value="${sanitize(p.name)}">${sanitize(p.name)}</option>`;
    });
    html += `<option value="__OTHER__">➕ โครงการใหม่ (พิมพ์ระบุเอง)...</option>`;
    sel.innerHTML = html;

    if (prevVal && Array.from(sel.options).some(o => o.value === prevVal)) {
      sel.value = prevVal;
    }

    if (otherInputId && sel.value !== '__OTHER__') {
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

  let activeLocFilter = 'ทั้งหมด';
  let activeProjFilter = 'ทั้งหมด';

  function filterLocations(dept) {
    activeLocFilter = dept || 'ทั้งหมด';
    const sel = document.getElementById('md-location-dept');
    if (sel && sel.value !== activeLocFilter) {
      sel.value = activeLocFilter;
    }
    document.querySelectorAll('.md-loc-tab').forEach(btn => {
      const bDept = btn.getAttribute('data-dept');
      if (bDept === activeLocFilter) {
        btn.className = 'md-loc-tab px-2.5 py-1 rounded-lg font-medium bg-[#265D5A] text-white shadow-sm';
      } else {
        btn.className = 'md-loc-tab px-2.5 py-1 rounded-lg font-medium bg-slate-100 text-slate-600 hover:bg-slate-200';
      }
    });
    renderMasterDataUI();
  }

  function filterProjects(dept) {
    activeProjFilter = dept || 'ทั้งหมด';
    const sel = document.getElementById('md-project-dept');
    if (sel && sel.value !== activeProjFilter) {
      sel.value = activeProjFilter;
    }
    document.querySelectorAll('.md-proj-tab').forEach(btn => {
      const bDept = btn.getAttribute('data-dept');
      if (bDept === activeProjFilter) {
        btn.className = 'md-proj-tab px-2.5 py-1 rounded-lg font-medium bg-violet-600 text-white shadow-sm';
      } else {
        btn.className = 'md-proj-tab px-2.5 py-1 rounded-lg font-medium bg-slate-100 text-slate-600 hover:bg-slate-200';
      }
    });
    renderMasterDataUI();
  }

  // แสดงผลในหน้า Master Data UI (page-master-data.html)
  function renderMasterDataUI() {
    const locEl = document.getElementById('md-locations');
    const locCountEl = document.getElementById('md-loc-count');
    const depEl = document.getElementById('md-departments');
    const depCountEl = document.getElementById('md-dept-count');
    const proEl = document.getElementById('md-projects');
    const proCountEl = document.getElementById('md-proj-count');
    const mecEl = document.getElementById('md-mechanics');
    const mecCountEl = document.getElementById('md-mech-count');

    if (locEl) {
      const allLocs = state.locations || [];
      const filteredLocs = allLocs.filter(x => matchesDeptFilter(x.department, activeLocFilter));
      if (locCountEl) {
        locCountEl.textContent = `(${filteredLocs.length} จาก ${allLocs.length} ห้อง)`;
      }

      const emptyMsg = !state.loaded ? 'กำลังโหลดข้อมูล...' : 'ยังไม่มีข้อมูลสถานที่ / ห้อง';
      locEl.innerHTML = filteredLocs.map(x =>
        `<div class="flex justify-between items-center p-2.5 rounded-xl bg-slate-50 text-slate-800 border border-slate-100 hover:bg-slate-100/60 transition">
          <div class="flex items-center gap-2">
            <span class="text-xs px-2 py-0.5 rounded-md font-semibold ${x.department === 'วพบ.' ? 'bg-sky-100 text-sky-700' : (x.department === 'ศษ.' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700')}">${sanitize(x.department || 'ทั่วไป')}</span>
            <span class="font-medium text-sm">${sanitize(x.name)}</span>
          </div>
          <div class="flex items-center gap-3">
            <button type="button" data-name="${sanitize(x.name)}" onclick="if(typeof openQrGenModal === 'function') openQrGenModal(this.dataset.name)" class="text-[#265D5A] hover:text-[#1a3f3d] p-1" title="สร้าง QR Code"><i class="fa-solid fa-qrcode"></i></button>
            <button type="button" data-id="${sanitize(x.id)}" data-name="${sanitize(x.name)}" onclick="deleteMaster('location', this.dataset.id, this.dataset.name)" class="text-rose-500 hover:text-rose-700 p-1" title="ลบ"><i class="fa-solid fa-trash-can"></i></button>
          </div>
        </div>`
      ).join('') || `<p class="text-slate-400 text-sm p-4 text-center">${emptyMsg}</p>`;
    }

    if (depEl) {
      const allDepts = state.departments || [];
      if (depCountEl) {
        depCountEl.textContent = `(${allDepts.length} แผนก)`;
      }
      const emptyMsg = !state.loaded ? 'กำลังโหลดข้อมูล...' : 'ยังไม่มีข้อมูล';
      depEl.innerHTML = allDepts.map(x =>
        `<div class="flex justify-between items-center p-2.5 rounded-xl bg-slate-50 text-slate-800 border border-slate-100 hover:bg-slate-100/60 transition">
          <span class="font-medium text-sm"><i class="fa-solid fa-building-user text-slate-400 mr-2"></i>${sanitize(x.name)}</span>
          <button type="button" data-id="${sanitize(x.id)}" data-name="${sanitize(x.name)}" onclick="deleteMaster('department', this.dataset.id, this.dataset.name)" class="text-rose-500 hover:text-rose-700 p-1" title="ลบ"><i class="fa-solid fa-trash-can"></i></button>
        </div>`
      ).join('') || `<p class="text-slate-400 text-sm p-4 text-center">${emptyMsg}</p>`;
    }

    if (proEl) {
      const allProjs = state.projects || [];
      const filteredProjs = allProjs.filter(x => matchesDeptFilter(x.department, activeProjFilter));
      if (proCountEl) {
        proCountEl.textContent = `(${filteredProjs.length} จาก ${allProjs.length} โครงการ)`;
      }

      const emptyMsg = !state.loaded ? 'กำลังโหลดข้อมูล...' : 'ยังไม่มีข้อมูลโครงการ';
      proEl.innerHTML = filteredProjs.map(x =>
        `<div class="flex justify-between items-center p-2.5 rounded-xl bg-slate-50 text-slate-800 border border-slate-100 hover:bg-slate-100/60 transition">
          <div>
            <div class="font-medium text-sm">${sanitize(x.name)}</div>
            <small class="text-xs text-slate-400">${sanitize(x.department || '')}</small>
          </div>
          <button type="button" data-id="${sanitize(x.id)}" data-name="${sanitize(x.name)}" onclick="deleteMaster('project', this.dataset.id, this.dataset.name)" class="text-rose-500 hover:text-rose-700 p-1" title="ลบ"><i class="fa-solid fa-trash-can"></i></button>
        </div>`
      ).join('') || `<p class="text-slate-400 text-sm p-4 text-center">${emptyMsg}</p>`;
    }

    if (mecEl) {
      const allMechs = state.mechanics || [];
      if (mecCountEl) {
        mecCountEl.textContent = `(${allMechs.length} คน)`;
      }
      const emptyMsg = !state.loaded ? 'กำลังโหลดข้อมูล...' : 'ยังไม่มีข้อมูล';
      mecEl.innerHTML = allMechs.map(x =>
        `<div class="p-2.5 rounded-xl bg-slate-50 text-slate-800 border border-slate-100 hover:bg-slate-100/60 transition">
          <div class="flex justify-between items-start">
            <b class="text-sm text-slate-800">${sanitize(x.name)}</b>
            <button type="button" data-id="${sanitize(x.id)}" data-name="${sanitize(x.name)}" onclick="deleteMaster('mechanic', this.dataset.id, this.dataset.name)" class="text-rose-500 hover:text-rose-700 p-1" title="ลบ"><i class="fa-solid fa-trash-can"></i></button>
          </div>
          <div class="text-xs text-slate-500 mt-1 flex flex-wrap gap-2">
            <span><i class="fa-solid fa-phone text-slate-400 mr-1"></i>${sanitize(x.phone || '-')}</span>
            <span><i class="fa-solid fa-wrench text-slate-400 mr-1"></i>${sanitize(x.skills || '-')}</span>
          </div>
        </div>`
      ).join('') || `<p class="text-slate-400 text-sm p-4 text-center">${emptyMsg}</p>`;
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
    clearCategory,
    saveSettings,
    seedInitialData,
    initFormDropdowns,
    updateLocationSelect,
    handleSelectOther,
    updateDepartmentSelect,
    updateProjectSelect,
    filterLocations,
    filterProjects,
    matchesDeptFilter,
    getActiveFilters: () => ({ location: activeLocFilter, project: activeProjFilter }),
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

window.filterMasterLocations = function (dept) {
  if (window.MasterData && typeof window.MasterData.filterLocations === 'function') {
    window.MasterData.filterLocations(dept);
  }
};

window.filterMasterProjects = function (dept) {
  if (window.MasterData && typeof window.MasterData.filterProjects === 'function') {
    window.MasterData.filterProjects(dept);
  }
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
    let chosenDept = deptEl ? deptEl.value : 'วพบ.';
    if (chosenDept === 'ทั้งหมด') chosenDept = 'วพบ.';
    item.department = chosenDept;
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
    let chosenDept = deptEl ? deptEl.value : 'ทั่วไป';
    if (chosenDept === 'ทั้งหมด') chosenDept = 'วพบ.';
    item.department = chosenDept;
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

  const ok = await MasterData.addItem(type, item);
  if (ok && typeof alertBox === 'function') {
    alertBox('success', 'เพิ่มข้อมูลสำเร็จ', '', { timer: 1200, showConfirmButton: false });
  }
};

window.deleteMaster = async function (type, id, label = '') {
  if (typeof Swal !== 'undefined') {
    const confirm = await Swal.fire({
      title: 'ยืนยันการลบข้อมูล?',
      text: label ? `ต้องการลบ "${label}" ออกจากระบบใช่หรือไม่ (ไม่สามารถกู้คืนได้)` : 'ข้อมูลที่ลบจะไม่สามารถกู้คืนได้',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'ใช่, ลบเลย',
      cancelButtonText: 'ยกเลิก'
    });
    if (!confirm.isConfirmed) return false;
  }
  const ok = await MasterData.deleteItem(type, id);
  if (ok && typeof alertBox === 'function') {
    alertBox('success', 'ลบข้อมูลสำเร็จ', '', { timer: 1000, showConfirmButton: false });
  }
  return ok;
};

window.clearMaster = async function (type) {
  const mdState = MasterData.getState();
  const filters = MasterData.getActiveFilters();
  const labels = {
    location: 'สถานที่ / ห้อง',
    department: 'แผนก / ฝ่าย',
    project: 'โครงการ',
    mechanic: 'ช่าง / ผู้รับผิดชอบ'
  };
  const keyMap = {
    location: 'locations',
    department: 'departments',
    project: 'projects',
    mechanic: 'mechanics'
  };
  const key = keyMap[type];
  if (!key) return false;

  const currentItems = mdState[key] || [];
  const activeFilter = (type === 'location') ? filters.location
                     : (type === 'project') ? filters.project
                     : 'ทั้งหมด';
  const targetItems = (activeFilter && activeFilter !== 'ทั้งหมด')
    ? currentItems.filter(x => MasterData.matchesDeptFilter(x.department, activeFilter))
    : currentItems;

  if (!targetItems.length) {
    if (typeof alertBox === 'function') alertBox('info', 'ไม่มีข้อมูลให้ล้าง', `ไม่มีรายการในหมวด${labels[type] || ''}`);
    return false;
  }

  const scopeText = (activeFilter && activeFilter !== 'ทั้งหมด')
    ? `สังกัด "${activeFilter}" (${targetItems.length} รายการ)`
    : `ทั้งหมด (${targetItems.length} รายการ)`;

  if (typeof Swal !== 'undefined') {
    const confirm = await Swal.fire({
      title: `ล้างข้อมูล${labels[type] || ''}?`,
      html: `ระบบจะลบรายการ${scopeText} ออกจากฐานข้อมูลถาวร<br><span class="text-xs text-slate-500">หากต้องการนำค่ามาตรฐานกลับมา สามารถกดปุ่ม "ข้อมูลเริ่มต้นมาตรฐาน" ด้านบนได้</span>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'ยืนยันล้างข้อมูล',
      cancelButtonText: 'ยกเลิก'
    });
    if (!confirm.isConfirmed) return false;
  }

  const ok = await MasterData.clearCategory(type, activeFilter);
  if (ok && typeof alertBox === 'function') {
    alertBox('success', 'ล้างข้อมูลเรียบร้อย', `ลบ ${targetItems.length} รายการแล้ว`, { timer: 1400, showConfirmButton: false });
  }
  return ok;
};

window.saveOverdueSettings = async function () {
  const daysEl = document.getElementById('md-overdue-days');
  const days = daysEl ? Number(daysEl.value) || 3 : 3;
  const ok = await MasterData.saveSettings({ overdueDays: days });
  if (ok && typeof alertBox === 'function') {
    alertBox('success', 'บันทึกสำเร็จ', 'อัปเดตการตั้งค่าแจ้งเตือนแล้ว');
  }
};

// โหลดข้อมูล Master Data ทันทีเมื่อ DOM พร้อม
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => MasterData.load());
} else {
  MasterData.load();
}
