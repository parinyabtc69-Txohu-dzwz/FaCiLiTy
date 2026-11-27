/**
 * FaCiLiTy V6 Pre-Build & Phase 4 Regression Test Suite
 * Run: node tests/regression.test.js (from V6 directory)
 */
const assert = require('assert');
const fs = require('fs');
const http = require('http');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

function makeFakeJwt(payloadObj) {
  const h = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const p = Buffer.from(JSON.stringify(payloadObj)).toString('base64url');
  return `${h}.${p}.fakesig`;
}

function runStaticChecks() {
  // 1. All JS modules + root scripts + Code.gs parse cleanly
  const moduleDir = path.join(ROOT, 'src', 'js', 'modules');
  const moduleFiles = fs.readdirSync(moduleDir).filter(f => f.endsWith('.js'));
  assert(!moduleFiles.includes('firestore-db.js'), 'Dead firestore-db.js must be removed');
  assert(!moduleFiles.includes('__proto__'), 'Sanity');

  for (const f of moduleFiles) {
    const code = fs.readFileSync(path.join(moduleDir, f), 'utf8').replace(/^\uFEFF/, '');
    new vm.Script(code, { filename: f });
  }
  for (const rootJs of ['sw.js', 'firebase-messaging-sw.js', 'server.js', 'build.js', 'Code.gs']) {
    const code = read(rootJs).replace(/^\uFEFF/, '');
    new vm.Script(code, { filename: rootJs });
  }

  // 2. Compiled index.html & index_app.html match & include inline valid JS + #gnav-document
  const indexHtml = read('index.html');
  const indexAppHtml = read('index_app.html');
  assert.strictEqual(indexHtml, indexAppHtml, 'index.html and index_app.html must match');
  const inlineScripts = [...indexHtml.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)];
  assert(inlineScripts.length > 0, 'index.html must contain compiled inline script');
  inlineScripts.forEach((m, i) => new vm.Script(m[1], { filename: `index.html#script-${i}` }));

  assert(indexHtml.includes('id="gnav-document"'), 'Sidebar must include #gnav-document for Document Hub');
  assert(indexHtml.includes('id="page-document"'), 'page-document must be compiled');
  assert(indexHtml.includes('openRoleTestModal()'), 'Compiled HTML must expose Admin role-test button');
  assert(!indexHtml.includes('submitTrackModal') && !indexHtml.includes('closeTrackModal'), 'Orphan trackTicketModal must be removed');

  // 3. build.js has no non-existent loadOrder entries
  const buildJs = read('build.js');
  const orderMatch = buildJs.match(/const loadOrder\s*=\s*\[([\s\S]*?)\];/);
  assert(orderMatch, 'build.js loadOrder missing');
  const listed = [...orderMatch[1].matchAll(/'([^']+)'/g)].map(m => m[1]);
  listed.forEach(file => {
    assert(fs.existsSync(path.join(moduleDir, file)), `build.js loadOrder references missing file: ${file}`);
  });

  // 4. PWA & SW checks (relative './sw.js', origin check in notificationclick)
  const pwaSrc = read('src/js/modules/pwa-install.js');
  const swSrc = read('sw.js');
  const fcmSwSrc = read('firebase-messaging-sw.js');
  assert(pwaSrc.includes("register('./sw.js'"), 'pwa-install.js must register ./sw.js');
  assert(!swSrc.includes("client.url.includes('FaCiLiTy')") && swSrc.includes('self.location.origin'), 'sw.js notificationclick must check self.location.origin');
  assert(!fcmSwSrc.includes("client.url.includes('FaCiLiTy')") && fcmSwSrc.includes('self.location.origin'), 'firebase-messaging-sw.js notificationclick must check self.location.origin');

  // 5. Batch scripts align with .gitignore & server.js has traversal guard
  assert(!read('02_deploy_maintenance.bat').includes('index_app.html\n') && !read('02_deploy_maintenance.bat').includes('git add index.html index_app.html'), '02_deploy_maintenance.bat must not git add gitignored index_app.html');
  assert(!read('02_restore_app.bat').includes('git add index.html index_app.html'), '02_restore_app.bat must not git add gitignored index_app.html');
  assert(!read('03_disable_line_group.bat').includes('git add LineConfig.gs'), '03_disable_line_group.bat must not git add gitignored *.gs');
  assert(!read('04_enable_line_group.bat').includes('git add LineConfig.gs'), '04_enable_line_group.bat must not git add gitignored *.gs');

  const serverSrc = read('server.js');
  assert(serverSrc.includes('isBlockedPath') && serverSrc.includes('BASE_DIR + path.sep'), 'server.js must enforce path traversal and sensitive-file guard');

  // 6. Dead legacy tables removed from main.js
  const mainSrc = read('src/js/modules/main.js');
  for (const deadSym of ['loadAdminTable(', 'renderRepairTable', 'renderAVTable', 'loadAdvancedTasks(', 'renderAdvTable(']) {
    assert(!mainSrc.includes(deadSym), `Deprecated table code still in main.js: ${deadSym}`);
  }

  // 7. firestore.rules covers all required collections & denies wildcard fallback
  const rules = read('firestore.rules');
  for (const col of ['users', 'tickets', 'chats', 'system_counters', 'master_data', 'documents', 'bug_reports', 'notifications', 'fcm_tokens']) {
    assert(rules.includes(`match /${col}/`), `firestore.rules missing collection rule for ${col}`);
  }
  assert(rules.includes('allow read, write: if false;'), 'firestore.rules must deny unmatched paths');
  assert(rules.includes('isAdminOrSupervisor') && rules.includes('request.auth.token.email_verified == true'), 'firestore.rules must enforce verified email auth & admin RBAC');

  // 8. Documentation reflects Firestore-first & yearly ticket IDs
  const mdDoc = read('สรุปโครงการและคู่มือการใช้งาน_FaCiLiTy_v1.0.md');
  const htmlDoc = read('สรุปโครงการและคู่มือการใช้งาน_FaCiLiTy_v1.0.html');
  for (const docText of [mdDoc, htmlDoc]) {
    assert(!docText.includes('REP-XXXXX') && !docText.includes('AVR-XXXXX') && !docText.includes('PROJ-XXXXX'), 'Manual must replace legacy REP/AVR/PROJ prefixes');
    assert(docText.includes('BLD69-') && docText.includes('IT69-') && docText.includes('AV69-'), 'Manual must document yearly prefixes');
    assert(docText.includes('One-Way Backup Log') && docText.includes('Single Source of Truth'), 'Manual must describe Firestore-first architecture');
  }

  console.log('PASS Static Checks: syntax, build parity, SW origin, batch/.gitignore, server guard, firestore.rules, manual accuracy');
}

async function runFirebaseAuthAndSessionTests() {
  const mainSrc = read('src/js/modules/main.js');
  const storage = new Map();
  const sessStorage = new Map();
  const elements = new Map();
  const getEl = (id) => {
    if (!elements.has(id)) {
      const cls = new Set();
      elements.set(id, {
        id, value: '', innerHTML: '', textContent: '', dataset: {},
        classList: {
          add: (...c) => c.forEach(x => cls.add(x)),
          remove: (...c) => c.forEach(x => cls.delete(x)),
          contains: c => cls.has(c),
          toggle: (c, f) => (f === undefined ? (cls.has(c) ? cls.delete(c) : cls.add(c)) : (f ? cls.add(c) : cls.delete(c)))
        },
        querySelectorAll: () => [],
        addEventListener() {}
      });
    }
    return elements.get(id);
  };

  let authCalls = [];
  let signedOut = false;
  let currentFirebaseUser = null;
  let firestoreUsers = {
    'teacher@school.ac.th': { email: 'teacher@school.ac.th', name: 'ครูสมศรี', role: 'Teacher', status: 'approved' }
  };
  let simulatePermDenied = false;
  let fetchPosts = [];
  let alerts = [];

  const firebaseAuthMock = {
    get currentUser() { return currentFirebaseUser; },
    async signInWithCredential(cred) {
      authCalls.push(cred);
      currentFirebaseUser = { email: 'teacher@school.ac.th' };
      return { user: currentFirebaseUser };
    },
    async signOut() { signedOut = true; currentFirebaseUser = null; },
    onAuthStateChanged(cb) { setTimeout(() => cb(currentFirebaseUser), 0); }
  };

  const firebaseMock = {
    auth: Object.assign(() => firebaseAuthMock, {
      GoogleAuthProvider: { credential: idTok => ({ providerId: 'google.com', idToken: idTok }) }
    }),
    firestore: { FieldValue: { serverTimestamp: () => 'TS' } }
  };

  const firestoreDb = {
    collection(col) {
      return {
        doc(id) {
          return {
            async get() {
              if (col === 'users') {
                if (simulatePermDenied) {
                  const e = new Error('Missing or insufficient permissions.');
                  e.code = 'permission-denied';
                  throw e;
                }
                const d = firestoreUsers[id];
                return { exists: !!d, id, data: () => d };
              }
              return { exists: false, data: () => ({}) };
            },
            async set(data) {
              if (col === 'users') firestoreUsers[id] = { ...data };
            },
            async update(data) {
              if (col === 'users' && firestoreUsers[id]) Object.assign(firestoreUsers[id], data);
            }
          };
        }
      };
    }
  };

  const ctx = {
    console, setTimeout, clearTimeout, setInterval, clearInterval, Date, Math, JSON, Array, Object, Promise, Error, Map, Set, URLSearchParams, URL, RegExp, Buffer,
    AbortController: typeof AbortController !== 'undefined' ? AbortController : function() { return { signal: {}, abort() {} }; },
    atob: s => Buffer.from(s, 'base64').toString('binary'),
    localStorage: {
      getItem: k => (storage.has(k) ? storage.get(k) : null),
      setItem: (k, v) => storage.set(k, String(v)),
      removeItem: k => storage.delete(k)
    },
    sessionStorage: {
      getItem: k => (sessStorage.has(k) ? sessStorage.get(k) : null),
      setItem: (k, v) => sessStorage.set(k, String(v)),
      removeItem: k => sessStorage.delete(k)
    },
    navigator: { userAgent: 'Mozilla/5.0' },
    document: {
      getElementById: getEl,
      querySelectorAll: () => [],
      addEventListener() {}
    },
    window: null,
    location: { hostname: 'parinyabtc69-txohu-dzwz.github.io', protocol: 'https:', search: '', href: 'https://parinyabtc69-txohu-dzwz.github.io/FaCiLiTy/' },
    scriptURL: 'https://script.google.com/macros/s/MOCK/exec',
    Chart: function() { return { destroy() {} }; },
    Swal: {
      fire: (opts) => { alerts.push(opts); return Promise.resolve({ isConfirmed: true }); },
      showLoading() {}, close() {}
    },
    liff: { init: () => Promise.resolve(), isLoggedIn: () => false },
    firebase: firebaseMock,
    firebaseAuth: firebaseAuthMock,
    firestoreDb,
    initFirebase: () => true,
    fetch: async (_url, opts) => {
      if (opts && opts.body) fetchPosts.push(JSON.parse(opts.body));
      const payload = { status: 'success', building: { total: 0 }, bugs: 0 };
      return { ok: true, status: 200, json: async () => payload, text: async () => JSON.stringify(payload) };
    }
  };
  ctx.window = ctx;
  ctx.scrollTo = () => {};

  vm.createContext(ctx);
  vm.runInContext(mainSrc, ctx, { filename: 'main.js' });
  vm.runInContext('window.__Core = ResourceHubCore; window.__handleCredentialResponse = handleCredentialResponse; window.__handleGlobalLogout = handleGlobalLogout;', ctx);

  // Test 1: Google login signs into Firebase Auth via signInWithCredential BEFORE user fetch & sends valid idToken
  const validJwt = makeFakeJwt({
    aud: '309538362014-2mn08g13ht4rnjj9e8j52r5c7204lsqu.apps.googleusercontent.com',
    iss: 'https://accounts.google.com',
    exp: Math.floor(Date.now() / 1000) + 3600,
    email: 'teacher@school.ac.th',
    name: 'ครูสมศรี'
  });
  await ctx.__handleCredentialResponse({ credential: validJwt });
  assert.strictEqual(authCalls.length, 1, 'Must call firebase.auth().signInWithCredential');
  assert.strictEqual(authCalls[0].idToken, validJwt);
  assert.strictEqual(ctx.currentRole, 'Teacher');
  assert.strictEqual(storage.get('logged_role'), 'Teacher');

  // Test 2: Live role refresh updates demoted/promoted role from Firestore on reload
  firestoreUsers['teacher@school.ac.th'].role = 'Supervisor';
  const syncRes = await ctx.syncSessionUserFromFirestore();
  assert.strictEqual(syncRes.role, 'Supervisor');
  assert.strictEqual(ctx.currentRole, 'Supervisor', 'Live role must refresh from Firestore users/{email}');
  assert.strictEqual(storage.get('logged_admin'), 'true', 'Supervisor promotes admin UI flag cleanly');

  // Test 3: ResourceHubCore.api.post attaches non-expired idToken automatically
  await ctx.__Core.api.post({ action: 'delete_document', docId: 'd1' });
  const lastPost = fetchPosts[fetchPosts.length - 1];
  assert.strictEqual(lastPost.idToken, validJwt, 'POST payload must include valid Google idToken');

  // Test 4: Expired token is NOT sent as idToken
  ctx.currentGoogleIdToken = makeFakeJwt({
    aud: '309538362014-2mn08g13ht4rnjj9e8j52r5c7204lsqu.apps.googleusercontent.com',
    iss: 'https://accounts.google.com',
    exp: Math.floor(Date.now() / 1000) - 60,
    email: 'teacher@school.ac.th'
  });
  await ctx.__Core.api.post({ action: 'notify_chat', ticketId: 'BLD69-001' });
  const expiredPost = fetchPosts[fetchPosts.length - 1];
  assert(!expiredPost.idToken, 'Expired Google ID token must NOT be attached');

  // Test 5: Banned user in Firestore is auto-logged out on refresh
  firestoreUsers['teacher@school.ac.th'].status = 'banned';
  await ctx.syncSessionUserFromFirestore();
  assert.strictEqual(ctx.currentEmail, '', 'Banned user must be signed out immediately');
  assert(signedOut, 'Firebase Auth signOut must be called on logout');

  // Test 6: Pre-Phase-4 legacy localStorage session without Firebase Auth recovers cleanly on permission-denied
  storage.set('logged_email', 'old@school.ac.th');
  storage.set('logged_teacher', 'ครูเก่า');
  storage.set('logged_role', 'Teacher');
  ctx.location.hostname = 'parinyabtc69-txohu-dzwz.github.io';
  simulatePermDenied = true;
  await ctx.syncSessionUserFromFirestore();
  assert.strictEqual(storage.get('logged_email') || '', '', 'Legacy pre-Auth session must prompt re-login on permission-denied');

  console.log('PASS Auth & Session Tests: signInWithCredential, live Firestore role sync, idToken propagation, ban kick, legacy session recovery');
}

async function runServerGuardTest() {
  const serverCode = read('server.js').replace(/server\.listen\([\s\S]*$/, 'module.exports = { server, isBlockedPath };');
  const mod = { exports: {} };
  const fn = new Function('require', 'module', '__dirname', serverCode);
  fn(require, mod, ROOT);
  const srv = mod.exports.server;

  await new Promise((resolve, reject) => {
    srv.listen(0, '127.0.0.1', async () => {
      try {
        const port = srv.address().port;
        const getStatus = (p) => new Promise(res => {
          const r = http.request({ host: '127.0.0.1', port, path: p, method: 'GET' }, resp => {
            resp.resume();
            res(resp.statusCode);
          });
          r.end();
        });
        assert.strictEqual(await getStatus('/'), 200, 'Root path must serve index_app.html');
        assert.strictEqual(await getStatus('/Code.gs'), 403, 'Server must block *.gs');
        assert.strictEqual(await getStatus('/../secret.txt'), 403, 'Server must block raw path traversal');
        assert.strictEqual(await getStatus('/%2e%2e/secret.txt'), 403, 'Server must block URL-encoded path traversal');
        assert.strictEqual(await getStatus('/.git/HEAD'), 403, 'Server must block .git dotfiles');
        assert.strictEqual(await getStatus('/backups/test.zip'), 403, 'Server must block backups/');
        assert.strictEqual(await getStatus('/firestore.rules'), 403, 'Server must block firestore.rules');
        console.log('PASS Server Guard Test: / -> 200; traversal, .git, .gs, backups, .rules -> 403');
        srv.close(resolve);
      } catch (e) {
        srv.close(() => reject(e));
      }
    });
  });
}

async function runRoleTestNotificationChecks() {
  const hubSrc = read('src/js/modules/notification-hub.js');
  const buildContext = ({ role = 'Teacher', loggedAdmin = 'false', legacyUserRole = '' } = {}) => {
    const storage = new Map([
      ['logged_role', role],
      ['logged_admin', loggedAdmin],
      ['logged_teacher', `User(${role})`],
      ['logged_email', `${role.toLowerCase()}@school.ac.th`]
    ]);
    if (legacyUserRole) storage.set('user_role', legacyUserRole);
    const els = new Map();
    const mk = (id) => {
      const cls = new Set(id === 'notif-admin-actions' ? ['hidden'] : []);
      return {
        id, innerHTML: '', textContent: '', value: '', children: [], dataset: {},
        classList: {
          add: (...c) => c.forEach(x => cls.add(x)),
          remove: (...c) => c.forEach(x => cls.delete(x)),
          contains: c => cls.has(c)
        },
        appendChild(ch) { this.children.push(ch); },
        querySelectorAll: () => [],
        remove() {}
      };
    };
    const getEl = id => { if (!els.has(id)) els.set(id, mk(id)); return els.get(id); };
    ['notif-permission-status', 'notif-admin-actions', 'toast-notification-container', 'notification-list', 'global-overdue-badge', 'dropdown-unread-count'].forEach(getEl);

    const publishedDocs = {};
    const pushRequests = [];
    const swalCalls = [];

    const notifCollection = {
      orderBy() { return this; },
      limit() { return this; },
      where(_f, _op, val) {
        return {
          async get() {
            const matched = Object.entries(publishedDocs)
              .filter(([, d]) => d.isTest === val)
              .map(([id, d]) => ({ id, data: () => d }));
            return { empty: matched.length === 0, forEach: fn => matched.forEach(fn) };
          }
        };
      },
      onSnapshot() { return () => {}; },
      doc(id) {
        return {
          async set(data) { publishedDocs[id] = { ...data }; },
          async update(data) { if (publishedDocs[id]) Object.assign(publishedDocs[id], data); },
          async delete() { delete publishedDocs[id]; }
        };
      }
    };

    const ctx = {
      console, setTimeout, clearTimeout, Date, Math, JSON, Array, Object, Promise, Error, Map, Set, RegExp, encodeURIComponent,
      localStorage: {
        getItem: k => (storage.has(k) ? storage.get(k) : null),
        setItem: (k, v) => storage.set(k, String(v)),
        removeItem: k => storage.delete(k)
      },
      navigator: { userAgent: 'Mozilla/5.0' },
      document: {
        visibilityState: 'visible',
        getElementById: getEl,
        querySelectorAll: () => [],
        createElement: () => mk('div'),
        addEventListener() {}
      },
      window: null,
      Notification: { permission: 'granted' },
      AudioContext: undefined,
      webkitAudioContext: undefined,
      Swal: {
        fire: o => { swalCalls.push(o); return Promise.resolve({ isConfirmed: true }); },
        close() {}
      },
      firebase: { firestore: { FieldValue: { serverTimestamp: () => 'TS' } } },
      firestoreDb: {
        collection: (c) => (c === 'notifications' ? notifCollection : { orderBy() { return this; }, limit() { return this; }, onSnapshot() { return () => {}; } }),
        batch: () => {
          const dels = [];
          return {
            delete(ref) { dels.push(ref); },
            async commit() { await Promise.all(dels.map(r => r.delete())); }
          };
        }
      },
      ResourceHubCore: { api: { async post(body) { pushRequests.push(body); return { status: 'success' }; } } },
      currentRole: role,
      currentEmail: `${role.toLowerCase()}@school.ac.th`,
      currentTeacher: `User(${role})`,
      isAdminLoggedIn: role === 'Admin' || role === 'Supervisor'
    };
    ctx.window = ctx;
    vm.createContext(ctx);
    vm.runInContext(hubSrc, ctx, { filename: 'notification-hub.js' });
    ctx.NotificationHub.updatePermissionUI();
    return { ctx, getEl, publishedDocs, pushRequests, swalCalls };
  };

  // 1. Visibility: ONLY strict Admin sees test buttons (Supervisor with logged_admin='true', Tech, Teacher MUST NOT)
  for (const nonAdmin of [
    { role: 'Teacher' },
    { role: 'Tech' },
    { role: 'Supervisor', loggedAdmin: 'true', legacyUserRole: 'admin' },
    { role: 'Executive' },
    { role: 'AV' },
    { role: 'Staff' }
  ]) {
    const env = buildContext(nonAdmin);
    assert.strictEqual(env.ctx.NotificationHub.isStrictAdmin(), false, `${nonAdmin.role} must NOT satisfy isStrictAdmin()`);
    assert(env.getEl('notif-admin-actions').classList.contains('hidden'), `${nonAdmin.role} must keep #notif-admin-actions hidden`);
    assert(!env.getEl('notif-permission-status').innerHTML.includes('ยิงทดสอบเตือน'), `${nonAdmin.role} must NOT render ยิงทดสอบเตือน button`);
    assert.strictEqual(env.ctx.NotificationHub.testDeviceNotification(), false, `${nonAdmin.role} blocked from testDeviceNotification`);
    assert.strictEqual(env.ctx.NotificationHub.testRoleNotification('tech'), false, `${nonAdmin.role} blocked from testRoleNotification`);
  }

  // 2. Admin sees all test buttons & can fire role-targeted test (Tech)
  const adminEnv = buildContext({ role: 'Admin', loggedAdmin: 'true' });
  assert.strictEqual(adminEnv.ctx.NotificationHub.isStrictAdmin(), true, 'Admin satisfies isStrictAdmin()');
  assert(!adminEnv.getEl('notif-admin-actions').classList.contains('hidden'), 'Admin sees #notif-admin-actions');
  assert(adminEnv.getEl('notif-permission-status').innerHTML.includes('ยิงทดสอบเตือน'), 'Admin sees ยิงทดสอบเตือน button');

  const tid = adminEnv.ctx.NotificationHub.testRoleNotification('tech', { message: 'ทดสอบช่างเฉพาะจุด' });
  assert(tid && tid.startsWith('FAC-TEST-TECH-'), 'Role-targeted test ID includes role tag');
  await new Promise(r => setTimeout(r, 20));

  const pubValues = Object.values(adminEnv.publishedDocs);
  assert.strictEqual(pubValues.length, 1);
  assert.deepStrictEqual(Array.from(pubValues[0].targetRoles), ['tech'], 'Published test notification carries targetRoles=["tech"]');
  assert.strictEqual(pubValues[0].isTest, true);
  assert.strictEqual(pubValues[0].body, 'ทดสอบช่างเฉพาะจุด');

  const pushReq = adminEnv.pushRequests.find(p => p.action === 'send_fcm_push');
  assert(pushReq, 'Role test triggers send_fcm_push');
  assert.strictEqual(pushReq.filterOptions.isTest, true);
  assert.deepStrictEqual(Array.from(pushReq.filterOptions.targetRoles), ['tech']);

  // Verify skipWebPush option suppresses FCM call
  const prevPushCount = adminEnv.pushRequests.length;
  adminEnv.ctx.NotificationHub.testRoleNotification('av', { skipWebPush: true });
  await new Promise(r => setTimeout(r, 15));
  assert.strictEqual(adminEnv.pushRequests.length, prevPushCount, 'skipWebPush=true must NOT trigger send_fcm_push');

  // 3. Recipient filtering on receiving clients: Tech accepts tech test, Teacher & Supervisor do NOT
  const techEnv = buildContext({ role: 'Tech' });
  const teacherEnv = buildContext({ role: 'Teacher' });
  const supEnv = buildContext({ role: 'Supervisor', loggedAdmin: 'true' });
  assert.strictEqual(techEnv.ctx.NotificationHub.isTargetRecipient(pubValues[0]), true, 'Tech client receives Tech role test');
  assert.strictEqual(teacherEnv.ctx.NotificationHub.isTargetRecipient(pubValues[0]), false, 'Teacher client ignores Tech role test');
  assert.strictEqual(supEnv.ctx.NotificationHub.isTargetRecipient(pubValues[0]), false, 'Supervisor client ignores Tech role test');

  // Default admin-only test without targetRoles ONLY reaches Admin
  const adminOnlyNotif = { ticketId: 'FAC-TEST-9999', isTest: true };
  assert.strictEqual(adminEnv.ctx.NotificationHub.isTargetRecipient(adminOnlyNotif), true);
  assert.strictEqual(supEnv.ctx.NotificationHub.isTargetRecipient(adminOnlyNotif), false);
  assert.strictEqual(teacherEnv.ctx.NotificationHub.isTargetRecipient(adminOnlyNotif), false);

  // 4. clearTestNotifications cleans up all isTest docs
  const cleared = await adminEnv.ctx.NotificationHub.clearTestNotifications();
  assert(cleared >= 2 && Object.keys(adminEnv.publishedDocs).length === 0, 'clearTestNotifications removes test docs from Firestore');

  console.log('PASS Role Test Controls: strict Admin-only visibility, role-targeted Firestore+FCM routing & cleanup');
}

(async () => {
  runStaticChecks();
  await runFirebaseAuthAndSessionTests();
  await runServerGuardTest();
  await runRoleTestNotificationChecks();
  console.log('\nALL V6 PHASE 4 REGRESSION TESTS PASSED!');
  process.exit(0);
})().catch(err => {
  console.error('REGRESSION TEST FAILED:', err);
  process.exit(1);
});
