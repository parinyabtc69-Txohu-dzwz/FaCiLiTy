// ============================================================
// Firebase Client Configuration
// FaCiLiTy System (V7 Firebase Edition)
// ============================================================

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyAmpHXVA34dm12Hoxet55PjKkDD5Io-B48",
  authDomain: "facility-c7833.firebaseapp.com",
  projectId: "facility-c7833",
  storageBucket: "facility-c7833.firebasestorage.app",
  messagingSenderId: "642207526987",
  appId: "1:642207526987:web:253a2790f43062097c5dce"
};

// ตัวแปรส่วนกลางสำหรับ Firebase Services
let firebaseApp = null;
let firestoreDb = null;
let firebaseStorage = null;
let firebaseAuth = null;

// Global timeout helper for async operations to prevent network hanging
window.withTimeout = function(promise, ms = 3000) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('Operation_Timeout')), ms))
  ]);
};

function initFirebase() {
  if (typeof firebase === 'undefined') {
    console.warn('Firebase SDK ยังไม่ถูกโหลดในหน้าเว็บ');
    return false;
  }
  try {
    if (!firebase.apps.length) {
      firebaseApp = firebase.initializeApp(FIREBASE_CONFIG);
    } else {
      firebaseApp = firebase.app();
    }
    firestoreDb = firebase.firestore();
    firebaseStorage = firebase.storage();
    firebaseAuth = firebase.auth();
    
    // Attach to window for global access (some modules like track.js use window.firestoreDb)
    window.firebaseApp = firebaseApp;
    window.firestoreDb = firestoreDb;
    window.firebaseStorage = firebaseStorage;
    window.firebaseAuth = firebaseAuth;
    console.log('🔥 Firebase Services initialized successfully');

    // เรียก NotificationHub ทันทีที่ Firestore พร้อมใช้งาน
    if (window.NotificationHub && typeof window.NotificationHub.init === 'function') {
      window.NotificationHub.init();
    }
    return true;
  } catch (err) {
    console.error('Firebase initialization error:', err);
    return false;
  }
}
