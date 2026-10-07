// ============================================================
// Firebase Chat System (Hybrid Mode: Firebase + Google Drive)
// ============================================================

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyAmpHXVA34dm12Hoxet55PjKkDD5Io-B48",
  authDomain: "facility-c7833.firebaseapp.com",
  projectId: "facility-c7833",
  storageBucket: "facility-c7833.firebasestorage.app",
  messagingSenderId: "642207526987",
  appId: "1:642207526987:web:253a2790f43062097c5dce"
};

let firebaseApp = null;
let firestoreDb = null;

function initFirebaseChat() {
  if (typeof firebase === 'undefined') {
    console.warn('Firebase SDK ไม่ได้ถูกโหลด');
    return false;
  }
  try {
    if (!firebase.apps.length) {
      firebaseApp = firebase.initializeApp(FIREBASE_CONFIG);
    } else {
      firebaseApp = firebase.app();
    }
    firestoreDb = firebase.firestore();
    console.log('🔥 Firebase Chat Initialized (Hybrid Mode)');
    return true;
  } catch (err) {
    console.error('Firebase initialization error:', err);
    return false;
  }
}

const FirebaseChat = {
  // เริ่มดึงแชทแบบ Real-time
  listen: function(ticketId, callback) {
    if (!firestoreDb) return () => {};
    
    // ดึงแชทจาก collection 'chats' -> document (ticketId) -> collection 'messages'
    return firestoreDb.collection('chats').doc(ticketId).collection('messages')
      .orderBy('timestamp', 'asc')
      .onSnapshot((snapshot) => {
        const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        callback(messages);
      }, (error) => {
        console.error("Chat Listen Error:", error);
      });
  },

  // ส่งข้อความ
  send: async function(ticketId, senderName, role, message, attachmentUrl = '') {
    if (!firestoreDb) throw new Error("Firebase is not initialized");
    
    const now = firebase.firestore.FieldValue.serverTimestamp();
    const msgData = {
      senderName: senderName,
      role: role,
      message: message,
      attachmentUrl: attachmentUrl,
      timestamp: now,
      localTimestamp: Date.now() // เผื่อไว้เรียงลำดับฝั่ง client
    };

    await firestoreDb.collection('chats').doc(ticketId).collection('messages').add(msgData);
  }
};
