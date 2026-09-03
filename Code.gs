/**
 * ResourceHub System
 * Developed by Taohx_dz_parinya
 */
const CLIENT_ID = '309538362014-2mn08g13ht4rnjj9e8j52r5c7204lsqu.apps.googleusercontent.com';

const CONFIG = { 
  SHEET_ID: "1i-XQ0lO571tIX7RvQR51V2AjuXrEwLfJP7Z7b8xuYDM",
  SHEET_NAME: "Tasks",             
  AV_SHEET_NAME: "AV_Requests",    
  BUG_SHEET_NAME: "System_Reports", 
  USER_SHEET_NAME: "Users_DB",
  MASTER_LOC_SHEET: "Master_Locations",
  MASTER_PROJ_SHEET: "Master_Projects",
  MASTER_MECH_SHEET: "Master_Mechanics",
  DOC_SHEET_NAME: "Documents",

  // โฟลเดอร์หลักของระบบ (parent)
  ROOT_FOLDER_ID: "1tkOHFwH4MC-eA_eNLThTcLVF3CRHQUXT",

  // ชื่อโฟลเดอร์ย่อยที่จะสร้างอัตโนมัติใน Google Drive
  FOLDER_REPAIR_REPORT: "รูปภาพแจ้งซ่อม",       // รูปที่ผู้แจ้งส่งมา
  FOLDER_REPAIR_PROOF:  "รูปภาพผลการซ่อม",       // รูปที่ช่างส่งตอนปิดงาน
  FOLDER_DOCUMENTS:     "เอกสารระบบ",             // เอกสารจากระบบจัดการเอกสาร
  FOLDER_RECEIPTS:      "เอกสารใบเสร็จ",          // ใบเสร็จเบิกจ่าย / ใบเสนอราคา
  LINE_CHANNEL_ACCESS_TOKEN: "ใส่_Channel_Access_Token_ที่นี่", // <-- เปลี่ยนเป็น Channel Access Token ของคุณ
  LINE_TARGET_ID: "ใส่_User_ID_หรือ_Group_ID_ที่นี่",           // <-- เปลี่ยนเป็น User ID หรือ Group ID ของคุณ
};

function getDB() {
  return SpreadsheetApp.openById(CONFIG.SHEET_ID);
}

// ============================================================
// Helper: ดึงโฟลเดอร์จากชื่อ ถ้าไม่มีจะสร้างให้อัตโนมัติ
// ============================================================
function getOrCreateSubFolder(folderName) {
  const root = DriveApp.getFolderById(CONFIG.ROOT_FOLDER_ID);
  const existing = root.getFoldersByName(folderName);
  if (existing.hasNext()) return existing.next();
  // ยังไม่มี → สร้างใหม่
  const newFolder = root.createFolder(folderName);
  Logger.log("สร้างโฟลเดอร์ใหม่: " + folderName + " | ID: " + newFolder.getId());
  return newFolder;
}

// ============================================================
// รองรับ CORS Preflight
// ============================================================
function doOptions(e) {
  return ContentService.createTextOutput("")
    .setMimeType(ContentService.MimeType.TEXT);
}

// ============================================================
// GET Requests
// ============================================================
function doGet(e) {
  if (!e || !e.parameter) {
    return ContentService.createTextOutput("พร้อมใช้งานแล้ว")
      .setMimeType(ContentService.MimeType.TEXT);
  }

  const action = e.parameter.action;
  const db = getDB();
  let result = [];

  switch (action) {
    case 'get_tasks':
      const sheetTasks = db.getSheetByName(CONFIG.SHEET_NAME);
      result = sheetTasks ? sheetTasks.getDataRange().getDisplayValues().slice(1) : [];
      break;
    
    case 'get_av_requests':
      const sheetAV = db.getSheetByName(CONFIG.AV_SHEET_NAME);
      result = sheetAV ? sheetAV.getDataRange().getDisplayValues().slice(1) : [];
      break;

    case 'get_dashboard':
      return ContentService.createTextOutput(JSON.stringify(getDashboardDataInternal()))
        .setMimeType(ContentService.MimeType.JSON);

    case 'get_master_data':
      return ContentService.createTextOutput(JSON.stringify(getMasterDataInternal()))
        .setMimeType(ContentService.MimeType.JSON);

    case 'get_documents':
      const sheetDocs = db.getSheetByName(CONFIG.DOC_SHEET_NAME);
      result = sheetDocs ? sheetDocs.getDataRange().getDisplayValues().slice(1) : [];
      break;

    case 'get_users':
      const sheetUsers = db.getSheetByName('Users');
      result = sheetUsers ? sheetUsers.getDataRange().getDisplayValues().slice(1) : [];
      break;
  }

  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============================================================
// POST Requests
// ============================================================
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'No payload found' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    const data = JSON.parse(e.postData.contents);
    const db = getDB();
    const timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm");
    switch (data.action) {
      // ── ระบบ Login ใหม่ (Google OAuth) ────────────────────────
      case 'google_login':
        return handleGoogleLogin(data.credential);

      // ── แจ้งซ่อม: เก็บรูปใน "รูปภาพแจ้งซ่อม" ──────────────
      case 'submit_repair':
        const sheetRep = db.getSheetByName(CONFIG.SHEET_NAME);
        let repFileUrl = "-";
        if (data.file && data.file.data) {
          const folder = getOrCreateSubFolder(CONFIG.FOLDER_REPAIR_REPORT);
          const blob = Utilities.newBlob(Utilities.base64Decode(data.file.data), data.file.type, data.file.name);
          const file = folder.createFile(blob);
          try { file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch (e) { Logger.log(e); }
          repFileUrl = file.getUrl();
        }
        sheetRep.appendRow([timestamp, data.subject, data.detail, data.reporter, "รอดำเนินการ", repFileUrl, "", "", "", "", "", data.urgency || "", data.dept || "", data.loc || "", data.incidentDate || "", data.contact || ""]);
        
        const repBody = `
          <div style="font-family: sans-serif; color: #333; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px;">
            <h2 style="color: #4f46e5; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">แจ้งซ่อมใหม่: ${data.subject}</h2>
            <p><strong>ผู้แจ้ง:</strong> ${data.reporter}</p>
            <p><strong>สถานที่:</strong> ${data.loc || '-'}</p>
            <p><strong>รายละเอียด:</strong> ${data.detail}</p>
            <p><strong>ความเร่งด่วน:</strong> ${data.urgency || '-'}</p>
            <p><strong>วันที่เกิดเหตุ:</strong> ${data.incidentDate || '-'}</p>
            <p><strong>ช่องทางติดต่อ:</strong> ${data.contact || '-'}</p>
            <p style="margin-top: 20px; font-size: 0.9em; color: #6b7280; text-align: center;">กรุณาเข้าสู่ระบบเพื่อดูรายละเอียดและรับงานซ่อม</p>
          </div>
        `;
        sendEmailNotification(`🔔 แจ้งซ่อมใหม่: ${data.subject}`, repBody);
        
        const lineRepMsg = `\n🔔 แจ้งซ่อมใหม่: ${data.subject}\nผู้แจ้ง: ${data.reporter}\nสถานที่: ${data.loc || '-'}\nรายละเอียด: ${data.detail}`;
        sendLineMessage(lineRepMsg);
        break;

      // ── ยืมโสตฯ ─────────────────────────────────────────────
      case 'submit_av':
        const sheetAvReq = db.getSheetByName(CONFIG.AV_SHEET_NAME);
        sheetAvReq.appendRow([timestamp, data.borrower, data.equipment, data.useDate, data.location, "รอยืนยันการยืม", "-", data.signature]);
        
        const avBody = `
          <div style="font-family: sans-serif; color: #333; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px;">
            <h2 style="color: #0d9488; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">ขอยืมอุปกรณ์โสตฯ: ${data.borrower}</h2>
            <p><strong>ผู้ยืม:</strong> ${data.borrower}</p>
            <p><strong>อุปกรณ์ที่ต้องการ:</strong> ${data.equipment}</p>
            <p><strong>วันที่ใช้งาน:</strong> ${data.useDate}</p>
            <p><strong>สถานที่:</strong> ${data.location}</p>
            <p style="margin-top: 20px; font-size: 0.9em; color: #6b7280; text-align: center;">กรุณาเข้าสู่ระบบเพื่อพิจารณาอนุมัติการยืม</p>
          </div>
        `;
        sendEmailNotification(`📢 ขอยืมอุปกรณ์โสตฯ: ${data.borrower}`, avBody);
        
        const lineAvMsg = `\n📢 แจ้งยืมอุปกรณ์โสตฯ\nผู้ยืม: ${data.borrower}\nอุปกรณ์ที่ต้องการ: ${data.equipment}\nวันที่ใช้งาน: ${data.useDate}\nสถานที่: ${data.location}`;
        sendLineMessage(lineAvMsg);
        break;

      // ── แจ้งบั๊ก ─────────────────────────────────────────────
      case 'report_bug':
        const sheetBug = db.getSheetByName(CONFIG.BUG_SHEET_NAME);
        sheetBug.appendRow([timestamp, data.reporter, data.issue, data.page, "รอดำเนินการ"]);
        break;

      // ── เพิ่มเติมรายละเอียดงานซ่อม ──────────────────────────
      case 'append_task_details':
        const sheetTaskDetails = db.getSheetByName(CONFIG.SHEET_NAME);
        sheetTaskDetails.getRange(data.rowIndex + 2, 3).setValue(data.newDetails);
        break;

      // ── อัพสถานะงานซ่อม ─────────────────────────────────────
      case 'update_task_status':
        const sheetTaskStatus = db.getSheetByName(CONFIG.SHEET_NAME);
        const statusTargetRow = data.rowIndex + 2;
        sheetTaskStatus.getRange(statusTargetRow, 5).setValue(data.status);
        
        if (data.status === 'เสร็จสิ้น') {
          const subjectStr = sheetTaskStatus.getRange(statusTargetRow, 2).getValue();
          const detailStr = sheetTaskStatus.getRange(statusTargetRow, 3).getValue();
          const reporterNameStr = sheetTaskStatus.getRange(statusTargetRow, 4).getValue();
          const reporterEmail = getUserEmailByName(reporterNameStr);
          
          if (reporterEmail) {
            const bodyHtml = `
              <div style="font-family: sans-serif; color: #333; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px;">
                <h2 style="color: #059669; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">✅ งานซ่อมเสร็จสิ้น: ${subjectStr}</h2>
                <p><strong>รายละเอียดอาการ:</strong> ${detailStr}</p>
                <p><strong>สถานะปัจจุบัน:</strong> เสร็จสิ้น</p>
                <p style="margin-top: 20px; font-size: 0.9em; color: #6b7280; text-align: center;">เข้าสู่ระบบเพื่อดูรายละเอียดเพิ่มเติม</p>
              </div>
            `;
            try {
              MailApp.sendEmail({
                to: reporterEmail,
                subject: `✅ งานซ่อมเสร็จสิ้น: ${subjectStr}`,
                htmlBody: bodyHtml
              });
            } catch (e) { Logger.log(e.message); }
          }
          
          sendLineMessage(`\n✅ งานซ่อมเสร็จสิ้น\nหัวข้อ: ${subjectStr}\nรายละเอียด: ${detailStr}\nสถานะปัจจุบัน: เสร็จสิ้น`);
        }
        break;

      // ── ปิดงานซ่อม: เก็บรูปใน "รูปภาพผลการซ่อม" ────────────
      case 'update_task_proof':
        const sheetTaskProof = db.getSheetByName(CONFIG.SHEET_NAME);
        const targetRow = data.rowIndex + 2;
        let proofFileUrl = "-";
        if (data.file && data.file.data) {
          const folder = getOrCreateSubFolder(CONFIG.FOLDER_REPAIR_PROOF);
          const blob = Utilities.newBlob(Utilities.base64Decode(data.file.data), data.file.type, data.file.name);
          const file = folder.createFile(blob);
          try { file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch (e) { Logger.log(e); }
          proofFileUrl = file.getUrl();
        }
        
        let receiptUrl = "-";
        if (data.receiptFile && data.receiptFile.data) {
          const folder = getOrCreateSubFolder(CONFIG.FOLDER_RECEIPTS);
          const blob = Utilities.newBlob(Utilities.base64Decode(data.receiptFile.data), data.receiptFile.type, data.receiptFile.name);
          const file = folder.createFile(blob);
          try { file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch (e) { Logger.log(e); }
          receiptUrl = file.getUrl();
        }
        
        sheetTaskProof.getRange(targetRow, 5).setValue("เสร็จสิ้น");
        sheetTaskProof.getRange(targetRow, 7).setValue(data.fixDetail);
        sheetTaskProof.getRange(targetRow, 8).setValue(data.technician);
        sheetTaskProof.getRange(targetRow, 9).setValue(proofFileUrl);
        
        const cost = (data.cost && !isNaN(data.cost)) ? Number(data.cost) : 0;
        sheetTaskProof.getRange(targetRow, 10).setValue(cost > 0 ? cost : "-");
        sheetTaskProof.getRange(targetRow, 11).setValue(receiptUrl);
        
        // Notify Reporter
        const proofSubject = sheetTaskProof.getRange(targetRow, 2).getValue();
        const proofDetail = sheetTaskProof.getRange(targetRow, 3).getValue();
        const proofReporter = sheetTaskProof.getRange(targetRow, 4).getValue();
        const proofReporterEmail = getUserEmailByName(proofReporter);
        
        if (proofReporterEmail) {
          const bodyHtml = `
            <div style="font-family: sans-serif; color: #333; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px;">
              <h2 style="color: #059669; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">✅ งานซ่อมเสร็จสิ้น: ${proofSubject}</h2>
              <p><strong>รายละเอียดอาการ:</strong> ${proofDetail}</p>
              <p><strong>การแก้ไขปัญหา:</strong> ${data.fixDetail}</p>
              <p><strong>ช่างผู้รับผิดชอบ:</strong> ${data.technician}</p>
              <p style="margin-top: 20px; font-size: 0.9em; color: #6b7280; text-align: center;">เข้าสู่ระบบเพื่อดูรายละเอียดเพิ่มเติมหรือหลักฐานการซ่อม</p>
            </div>
          `;
          try {
            MailApp.sendEmail({
              to: proofReporterEmail,
              subject: `✅ งานซ่อมเสร็จสิ้น: ${proofSubject}`,
              htmlBody: bodyHtml
            });
          } catch (e) { Logger.log(e.message); }
        }
          
        sendLineMessage(`\n✅ งานซ่อมเสร็จสิ้น (พร้อมหลักฐาน)\nหัวข้อ: ${proofSubject}\nการแก้ไขปัญหา: ${data.fixDetail}\nช่างผู้รับผิดชอบ: ${data.technician}`);
        break;

      // ── อัพสถานะงานโสตฯ ─────────────────────────────────────
      case 'update_av_status':
        const sheetAvStatus = db.getSheetByName(CONFIG.AV_SHEET_NAME);
        const avTargetRow = data.rowIndex + 2;
        sheetAvStatus.getRange(avTargetRow, 6).setValue(data.status);
        sheetAvStatus.getRange(avTargetRow, 7).setValue(data.technician);
        break;

      // ── Master Data: เพิ่ม ──────────────────────────────────
      case 'master_add':
        const type = data.type;
        const id = data.id || (type + '_' + new Date().getTime());

        if (type === 'location') {
          let sheetLoc = db.getSheetByName(CONFIG.MASTER_LOC_SHEET) || db.insertSheet(CONFIG.MASTER_LOC_SHEET);
          if (sheetLoc.getLastRow() === 0) sheetLoc.appendRow(['id', 'name', 'department']);
          sheetLoc.appendRow([id, data.name || '', data.department || '']);
        } 
        else if (type === 'project') {
          let sheetProj = db.getSheetByName(CONFIG.MASTER_PROJ_SHEET) || db.insertSheet(CONFIG.MASTER_PROJ_SHEET);
          if (sheetProj.getLastRow() === 0) sheetProj.appendRow(['id', 'name', 'department']);
          sheetProj.appendRow([id, data.name || '', data.department || '']);
        } 
        else if (type === 'mechanic') {
          let sheetMech = db.getSheetByName(CONFIG.MASTER_MECH_SHEET) || db.insertSheet(CONFIG.MASTER_MECH_SHEET);
          if (sheetMech.getLastRow() === 0) sheetMech.appendRow(['id', 'name', 'phone', 'skills', 'notes']);
          sheetMech.appendRow([id, data.name || '', data.phone || '', data.skills || '', data.notes || '']);
        }
        break;

      // ── Master Data: ลบ ─────────────────────────────────────
      case 'master_delete':
        const delType = data.type;
        const delId = data.id;
        const sheetName = delType === 'location' ? CONFIG.MASTER_LOC_SHEET 
                        : delType === 'project'  ? CONFIG.MASTER_PROJ_SHEET 
                        : CONFIG.MASTER_MECH_SHEET;
        const sheetDel = db.getSheetByName(sheetName);
        if (sheetDel) {
          const values = sheetDel.getDataRange().getValues();
          for (let i = 1; i < values.length; i++) {
            if (String(values[i][0]) === String(delId)) {
              sheetDel.deleteRow(i + 1);
              break;
            }
          }
        }
        break;

      // ── เอกสาร: อัปโหลด → เก็บใน "เอกสารระบบ" ──────────────
      case 'add_document':
        let sheetAddDoc = db.getSheetByName(CONFIG.DOC_SHEET_NAME);
        if (!sheetAddDoc) {
          sheetAddDoc = db.insertSheet(CONFIG.DOC_SHEET_NAME);
          sheetAddDoc.appendRow(['docId', 'category', 'uploadDate', 'docName', 'uploader', 'fileUrl', 'fileExt', 'description']);
        }
        
        let addDocFileUrl = "";
        if (data.file && data.file.data) {
          const folder = getOrCreateSubFolder(CONFIG.FOLDER_DOCUMENTS);
          const blob = Utilities.newBlob(Utilities.base64Decode(data.file.data), data.file.type, data.file.name);
          const file = folder.createFile(blob);
          try { file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch (e) { Logger.log(e); }
          addDocFileUrl = file.getUrl();
        }

        const docId = 'doc_' + new Date().getTime();
        sheetAddDoc.appendRow([
          docId,
          data.category   || 'ทั่วไป',
          timestamp,
          data.docName    || '',
          data.uploader   || 'Admin',
          addDocFileUrl,
          data.ext        || '',
          data.description|| ''
        ]);
        break;

      // ── เอกสาร: ลบ ──────────────────────────────────────────
      case 'delete_document':
        const sheetDelDoc = db.getSheetByName(CONFIG.DOC_SHEET_NAME);
        if (sheetDelDoc) {
          const values = sheetDelDoc.getDataRange().getValues();
          for (let i = 1; i < values.length; i++) {
            if (String(values[i][0]) === String(data.docId)) {
              sheetDelDoc.deleteRow(i + 1);
              break;
            }
          }
        }
        break;

      // ── จัดการผู้ใช้ ──────────────────────────────────────────
      case 'update_user':
        const sheetUpdateUser = db.getSheetByName('Users');
        if (sheetUpdateUser) {
          const values = sheetUpdateUser.getDataRange().getValues();
          for (let i = 1; i < values.length; i++) {
            if (String(values[i][0]) === String(data.email)) {
              sheetUpdateUser.getRange(i + 1, 3).setValue(data.role);
              sheetUpdateUser.getRange(i + 1, 4).setValue(data.status);
              break;
            }
          }
        }
        break;

      default:
        break;
    }

    return ContentService.createTextOutput(JSON.stringify({ status: 'success' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ============================================================
// Helper Functions
// ============================================================
function getDashboardDataInternal() {
  const db = getDB();
  const bSheet   = db.getSheetByName(CONFIG.SHEET_NAME);
  const avSheet  = db.getSheetByName(CONFIG.AV_SHEET_NAME);
  const bugSheet = db.getSheetByName(CONFIG.BUG_SHEET_NAME);
  
  const bData = bSheet ? bSheet.getDataRange().getDisplayValues().slice(1) : [];
  const building = {
    total:      bData.length,
    pending:    bData.filter(r => r[4] === "รอดำเนินการ").length,
    inProgress: bData.filter(r => r[4] === "กำลังดำเนินการ").length,
    completed:  bData.filter(r => r[4] === "เสร็จสิ้น").length
  };

  const avData = avSheet ? avSheet.getDataRange().getDisplayValues().slice(1) : [];
  const av = {
    total:     avData.length,
    pending:   avData.filter(r => r[5] === "รอยืนยันการยืม").length,
    active:    avData.filter(r => r[5] === "กำลังใช้งาน" || r[5] === "จัดเตรียมแล้ว").length,
    completed: avData.filter(r => r[5] === "เสร็จสิ้น/คืนเรียบร้อย").length
  };

  const bugs = bugSheet ? bugSheet.getLastRow() - 1 : 0;
  return { building, av, bugs: bugs > 0 ? bugs : 0 };
}

function getMasterDataInternal() {
  const db = getDB();
  return {
    locations: getSheetDataAsObjects(db, CONFIG.MASTER_LOC_SHEET),
    projects:  getSheetDataAsObjects(db, CONFIG.MASTER_PROJ_SHEET),
    mechanics: getSheetDataAsObjects(db, CONFIG.MASTER_MECH_SHEET)
  };
}

function getSheetDataAsObjects(db, sheetName) {
  const sheet = db.getSheetByName(sheetName);
  if (!sheet || sheet.getLastRow() <= 1) return [];
  const data    = sheet.getDataRange().getDisplayValues();
  const headers = data[0];
  return data.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, j) => { obj[h] = row[j]; });
    return obj;
  });
}

// ============================================================
// ฟังก์ชันรัน 1 ครั้งเพื่อสร้างโฟลเดอร์ทั้งหมดล่วงหน้า
// ── วิธีใช้: เลือกฟังก์ชันนี้ในหน้า Editor แล้วกด Run ──────
// ============================================================
function setupFolders() {
  const f1 = getOrCreateSubFolder(CONFIG.FOLDER_REPAIR_REPORT);
  const f2 = getOrCreateSubFolder(CONFIG.FOLDER_REPAIR_PROOF);
  const f3 = getOrCreateSubFolder(CONFIG.FOLDER_DOCUMENTS);
  const f4 = getOrCreateSubFolder(CONFIG.FOLDER_RECEIPTS);
  Logger.log("สร้างโฟลเดอร์สำเร็จ:");
  Logger.log("  - " + CONFIG.FOLDER_REPAIR_REPORT + "   " + f1.getId());
  Logger.log("  - " + CONFIG.FOLDER_REPAIR_PROOF  + "   " + f2.getId());
  Logger.log("  - " + CONFIG.FOLDER_DOCUMENTS     + "   " + f3.getId());
  Logger.log("  - " + CONFIG.FOLDER_RECEIPTS      + "   " + f4.getId());
}


// ============================================================
// Google OAuth Login
// ============================================================
function handleGoogleLogin(credential) {
  try {
    const url = "https://oauth2.googleapis.com/tokeninfo?id_token=" + credential;
    const res = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    
    if (res.getResponseCode() !== 200) {
      throw new Error("Invalid Token");
    }

    const payload = JSON.parse(res.getContentText());
    
    if (payload.aud !== CLIENT_ID) {
      throw new Error("Invalid Client ID");
    }

    const email = payload.email;
    const name = payload.name;
    const picture = payload.picture;

    const ss = getDB();
    let sheet = ss.getSheetByName('Users');
    
    if (!sheet) {
      sheet = ss.insertSheet('Users');
      sheet.appendRow(['Email', 'Name', 'Role', 'Status', 'ProfilePicture', 'LastLogin']);
      sheet.getRange(1, 1, 1, 6).setFontWeight('bold').setBackground('#f3f4f6');
      sheet.setFrozenRows(1);
    }

    const data = sheet.getDataRange().getValues();
    const now = new Date();

    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === email) {
        const role = data[i][2] || 'Teacher';
        const status = data[i][3];

        if (status === 'approved') {
          sheet.getRange(i + 1, 5).setValue(picture);
          sheet.getRange(i + 1, 6).setValue(now);
          
          return ContentService.createTextOutput(JSON.stringify({
            status: 'success',
            name: data[i][1] || name,
            role: role,
            picture: picture,
            email: email
          })).setMimeType(ContentService.MimeType.JSON);

        } else if (status === 'banned') {
          return ContentService.createTextOutput(JSON.stringify({ 
            status: 'error', 
            message: 'บัญชีของคุณถูกระงับการใช้งาน กรุณาติดต่อแอดมิน' 
          })).setMimeType(ContentService.MimeType.JSON);
        } else {
          return ContentService.createTextOutput(JSON.stringify({ 
            status: 'error', 
            message: 'บัญชีของคุณกำลังรอการอนุมัติจากแอดมิน' 
          })).setMimeType(ContentService.MimeType.JSON);
        }
      }
    }

    sheet.appendRow([email, name, 'Teacher', 'approved', picture, now]);
    
    return ContentService.createTextOutput(JSON.stringify({ 
      status: 'success', 
      name: name,
      role: 'Teacher',
      picture: picture,
      email: email
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ 
      status: 'error', 
      message: 'การตรวจสอบสิทธิ์ล้มเหลว: ' + err.toString() 
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// ============================================================
// Notification Helpers
// ============================================================
function sendEmailNotification(subject, bodyHtml) {
  try {
    const db = getDB();
    const sheet = db.getSheetByName('Users');
    if (!sheet) return;
    
    const data = sheet.getDataRange().getValues();
    let adminEmails = [];
    
    // Column 0 = Email, Column 2 = Role
    // Column 0 = Email, Column 2 = Role
    for (let i = 1; i < data.length; i++) {
      const email = (data[i][0] || '').toString().trim();
      const role = (data[i][2] || '').toString().trim().toLowerCase();
      
      if (role === 'admin' || role === 'staff' || role === 'technician') {
        if (email && email.includes('@')) {
          adminEmails.push(email);
        }
      }
    }
    
    // Remove duplicates
    adminEmails = [...new Set(adminEmails)];
    
    if (adminEmails.length > 0) {
      MailApp.sendEmail({
        to: adminEmails.join(','),
        subject: subject,
        htmlBody: bodyHtml
      });
    }
  } catch(e) {
    Logger.log("Email error: " + e.message);
  }
}

function getUserEmailByName(name) {
  try {
    const db = getDB();
    const sheet = db.getSheetByName('Users');
    if (!sheet) return null;
    
    const data = sheet.getDataRange().getValues();
    const searchName = (name || '').toString().trim().toLowerCase();
    
    for (let i = 1; i < data.length; i++) {
      const sheetName = (data[i][1] || '').toString().trim().toLowerCase();
      if (sheetName === searchName && sheetName !== '') { // Column 1 = Name
        const email = (data[i][0] || '').toString().trim(); // Column 0 = Email
        if (email && email.includes('@')) {
          return email;
        }
      }
    }
    return null;
  } catch (e) {
    return null;
  }
}

function sendLineMessage(message) {
  try {
    if (!CONFIG.LINE_CHANNEL_ACCESS_TOKEN || CONFIG.LINE_CHANNEL_ACCESS_TOKEN === "ใส่_Channel_Access_Token_ที่นี่") return;
    if (!CONFIG.LINE_TARGET_ID || CONFIG.LINE_TARGET_ID === "ใส่_User_ID_หรือ_Group_ID_ที่นี่") return;
    
    const url = "https://api.line.me/v2/bot/message/push";
    const options = {
      method: "post",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + CONFIG.LINE_CHANNEL_ACCESS_TOKEN
      },
      payload: JSON.stringify({
        "to": CONFIG.LINE_TARGET_ID,
        "messages": [
          {
            "type": "text",
            "text": message
          }
        ]
      }),
      muteHttpExceptions: true
    };
    UrlFetchApp.fetch(url, options);
  } catch (e) {
    Logger.log("Line Messaging API Error: " + e.message);
  }
}


