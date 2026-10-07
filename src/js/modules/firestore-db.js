// ============================================================
// Firestore Database Helper Functions
// ============================================================

const FirestoreDB = {
  
  // Generate random ticket ID e.g. REP-A8B2C
  generateTicketId(prefix = 'REP') {
    const randomChars = Math.random().toString(36).substring(2, 7).toUpperCase();
    return `${prefix}-${randomChars}`;
  },

  // สร้าง Ticket ใหม่พร้อมอัพโหลดไฟล์
  async createTicket(type, data, fileObj = null) {
    if (!firestoreDb) throw new Error("Firebase is not initialized");
    
    let prefix = 'REP'; // Default
    if (type === 'av') prefix = 'AV';
    if (type === 'it') prefix = 'IT';
    if (type === 'project') prefix = 'PROJ';

    const ticketId = this.generateTicketId(prefix);
    const now = firebase.firestore.FieldValue.serverTimestamp();
    
    let fileUrl = '';
    if (fileObj && firebaseStorage) {
      const storageRef = firebaseStorage.ref(`tickets/${ticketId}/${fileObj.name}`);
      await storageRef.put(fileObj);
      fileUrl = await storageRef.getDownloadURL();
    }
    
    const ticketData = {
      ticketId: ticketId,
      type: type,
      status: 'รอมอบหมาย',
      createdAt: now,
      updatedAt: now,
      fileUrl: fileUrl,
      ...data
    };

    await firestoreDb.collection('tickets').doc(ticketId).set(ticketData);
    return ticketId;
  },

  // ดึง Ticket ทั้งหมดของผู้ใช้ (อ้างอิงจาก email)
  async getTicketsByReporter(email) {
    if (!firestoreDb) return [];
    const snapshot = await firestoreDb.collection('tickets')
      .where('reporterEmail', '==', email)
      .orderBy('createdAt', 'desc')
      .get();
    
    return snapshot.docs.map(doc => doc.data());
  },

  // ดึงข้อมูล Ticket ตาม ID
  async getTicketById(ticketId) {
    if (!firestoreDb) return null;
    const doc = await firestoreDb.collection('tickets').doc(ticketId).get();
    return doc.exists ? doc.data() : null;
  },

  // สมัครรับข้อมูลอัปเดตแชท (Real-time listener)
  listenForChatMessages(ticketId, callback) {
    if (!firestoreDb) return () => {};
    return firestoreDb.collection('tickets').doc(ticketId).collection('messages')
      .orderBy('timestamp', 'asc')
      .onSnapshot((snapshot) => {
        const messages = snapshot.docs.map(doc => doc.data());
        callback(messages);
      });
  },

  // สมัครรับข้อมูล Ticket (Real-time listener สำหรับดูสถานะอัปเดต)
  listenForTicketUpdates(ticketId, callback) {
    if (!firestoreDb) return () => {};
    return firestoreDb.collection('tickets').doc(ticketId)
      .onSnapshot((doc) => {
        if(doc.exists) callback(doc.data());
      });
  },

  // ส่งข้อความแชท
  async sendChatMessage(ticketId, senderName, senderEmail, message, fileObj = null) {
    if (!firestoreDb) throw new Error("Firebase is not initialized");
    
    let fileUrl = '';
    if (fileObj && firebaseStorage) {
      const fileName = Date.now() + '_' + fileObj.name;
      const storageRef = firebaseStorage.ref(`tickets/${ticketId}/chat/${fileName}`);
      await storageRef.put(fileObj);
      fileUrl = await storageRef.getDownloadURL();
    }
    
    const now = firebase.firestore.FieldValue.serverTimestamp();
    const msgData = {
      senderName,
      senderEmail,
      message,
      fileUrl,
      timestamp: now
    };
    
    await firestoreDb.collection('tickets').doc(ticketId).collection('messages').add(msgData);
  }
};
