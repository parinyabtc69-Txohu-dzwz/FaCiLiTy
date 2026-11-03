// ============================================================
// Firebase Chat System (Hybrid Mode: Firebase + Google Drive)
// ============================================================

const FirebaseChat = {
  // เริ่มดึงแชทแบบ Real-time
  listen: function(ticketId, callback) {
    const db = window.firestoreDb || (typeof firestoreDb !== 'undefined' ? firestoreDb : null);
    if (!db) {
      console.warn("Firestore is not ready yet for chat, returning empty");
      if (typeof callback === 'function') callback([]);
      return () => {};
    }
    
    let hasReceived = false;
    // Safety fallback: ถ้าผ่านไป 1.5 วินาที Firestore ยังไม่ callback ให้ส่ง [] เพื่อหยุด spinner ทันที
    const timer = setTimeout(() => {
      if (!hasReceived && typeof callback === 'function') {
        callback([]);
      }
    }, 1500);

    try {
      // ดึงแชทจาก collection 'chats' -> document (ticketId) -> collection 'messages'
      return db.collection('chats').doc(ticketId).collection('messages')
        .orderBy('timestamp', 'asc')
        .onSnapshot((snapshot) => {
          hasReceived = true;
          clearTimeout(timer);
          const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          if (typeof callback === 'function') callback(messages);
        }, (error) => {
          console.error("Chat Listen Error:", error);
          hasReceived = true;
          clearTimeout(timer);
          // เมื่อเกิด Error (เช่น ไม่มี permission หรือ index) ให้ส่ง [] เพื่อหยุด spinner ไม่ให้ค้าง
          if (typeof callback === 'function') callback([]);
        });
    } catch (err) {
      console.error("Chat Listen Init Error:", err);
      clearTimeout(timer);
      if (typeof callback === 'function') callback([]);
      return () => {};
    }
  },

  // ส่งข้อความ
  send: async function(ticketId, senderName, role, message, attachmentUrl = '') {
    const db = window.firestoreDb || (typeof firestoreDb !== 'undefined' ? firestoreDb : null);
    if (!db) throw new Error("Firebase is not initialized");
    
    const now = (typeof firebase !== 'undefined' && firebase.firestore && firebase.firestore.FieldValue) 
      ? firebase.firestore.FieldValue.serverTimestamp() 
      : new Date();

    const msgData = {
      senderName: senderName,
      role: role,
      message: message,
      attachmentUrl: attachmentUrl,
      timestamp: now,
      localTimestamp: Date.now() // เผื่อไว้เรียงลำดับฝั่ง client
    };

    await db.collection('chats').doc(ticketId).collection('messages').add(msgData);

    // ส่งแจ้งเตือนข้อความแชทเข้า LINE กลุ่มหลัก (ทำแบบ Background / Cooldown 10 วินาทีป้องกันสแปม)
    try {
      if (!window._chatNotifyThrottle) window._chatNotifyThrottle = {};
      const lastSent = window._chatNotifyThrottle[ticketId] || 0;
      const nowMs = Date.now();
      if (nowMs - lastSent > 10000) {
        window._chatNotifyThrottle[ticketId] = nowMs;
        if (typeof ResourceHubCore !== 'undefined' && ResourceHubCore.api && ResourceHubCore.api.post) {
          ResourceHubCore.api.post({
            action: 'notify_chat',
            ticketId: ticketId,
            senderName: senderName,
            role: role,
            message: message,
            attachmentUrl: attachmentUrl
          }).catch(err => console.warn('LINE chat notification warning:', err));
        }
      }
    } catch (notifyErr) {
      console.warn('LINE chat notify error:', notifyErr);
    }
  }
};
