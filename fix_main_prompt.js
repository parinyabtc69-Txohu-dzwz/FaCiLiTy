const fs = require('fs');

let mainJs = fs.readFileSync('src/js/modules/main.js', 'utf8');

if (!mainJs.includes('promptTrackTicket')) {
  const promptFunc = `
// ติดตามสถานะงานจากหน้าแรก
window.promptTrackTicket = async function() {
  const ticketId = prompt("กรุณาระบุเลขที่ตั๋วงาน (เช่น REP-A8B2C):");
  if (ticketId && ticketId.trim() !== '') {
    // โหลดข้อมูลตั๋วมาเพื่อดึง token
    try {
      const doc = await firestoreDb.collection('tickets').doc(ticketId.trim()).get();
      if (doc.exists) {
        const token = doc.data().token;
        if (token) {
          nav('page-ticket', { id: ticketId.trim(), token: token });
        } else {
          alert('ไม่พบ Token ของตั๋วงานนี้');
        }
      } else {
        alert('ไม่พบเลขที่ตั๋วงานนี้ในระบบ');
      }
    } catch (err) {
      alert('เกิดข้อผิดพลาด: ' + err.message);
    }
  }
};
`;
  mainJs += '\n' + promptFunc;
  fs.writeFileSync('src/js/modules/main.js', mainJs, 'utf8');
}
