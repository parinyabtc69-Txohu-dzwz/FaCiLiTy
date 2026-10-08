// ============================================================
// Firebase Chat System (Hybrid Mode: Firebase + Google Drive)
// ============================================================



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
