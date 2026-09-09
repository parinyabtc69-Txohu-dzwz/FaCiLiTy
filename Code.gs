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
  LINE_CHANNEL_ACCESS_TOKEN: "/m/tnS6KiDY+44jNQDWM2LOTR2pX0qmiA7RT23sE7rGQjTSTcp3TpNlXJYootWAJCYogsOY/KEW4s3Ex5in2tKeaHTbT3l3f2Ro2ROefSj8tNk8yh6FRkH4ccnNGSr1Lx/O6/+b1cFIm9sLRLa2SQAdB04t89/1O/w1cDnyilFU=", // <-- เปลี่ยนเป็น Channel Access Token ของคุณ
  LINE_TARGET_ID: "Cb807a01a3cd43b8118ce271e8da5718a", // Default target ID
  LIFF_ID: "2011401549-8xNgb1CC", // LIFF ID สำหรับใช้งาน LINE Login
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
  const _x = "RGV2ZWxvcGVkIGJ5IFRhb2h4X2R6X3BhcmlueWEsIFVJIERlc2lnbiBCeSBEcmVhbV9QYXRpcGF0LCBBSSBBc3Npc3RhbnQ6IEFudGlncmF2aXR5";
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
      return ContentService.createTextOutput(JSON.stringify(getDashboardDataInternal(e.parameter.month)))
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
        
      // ── ผูกบัญชี LINE ────────────────────────
      case 'link_line_account':
        return handleLinkLineAccount(data.email, data.lineId, data.name, data.picture);

      // ── แจ้งซ่อม: เก็บรูปใน "รูปภาพแจ้งซ่อม" ──────────────
      case 'submit_repair':
        const sheetRep = db.getSheetByName(CONFIG.SHEET_NAME);
        const repFileUrl = uploadFileToDrive(data.file, CONFIG.FOLDER_REPAIR_REPORT);
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
        
        const lineRepMsg = {
          "type": "flex",
          "altText": `แจ้งซ่อมใหม่: ${data.subject}`,
          "contents": {
            "type": "bubble",
            "header": {
              "type": "box",
              "layout": "vertical",
              "backgroundColor": "#265D5A",
              "contents": [
                { "type": "text", "text": "🔔 แจ้งปัญหาใหม่", "weight": "bold", "color": "#ffffff", "size": "xl" }
              ]
            },
            "body": {
              "type": "box",
              "layout": "vertical",
              "spacing": "md",
              "contents": [
                { "type": "text", "text": data.subject, "weight": "bold", "size": "lg", "wrap": true, "color": "#1f2937" },
                { "type": "separator", "margin": "md" },
                { "type": "box", "layout": "baseline", "spacing": "sm", "contents": [{ "type": "text", "text": "ผู้แจ้ง", "color": "#aaaaaa", "size": "sm", "flex": 2 }, { "type": "text", "text": data.reporter, "wrap": true, "color": "#4b5563", "size": "sm", "flex": 5 }] },
                { "type": "box", "layout": "baseline", "spacing": "sm", "contents": [{ "type": "text", "text": "สถานที่", "color": "#aaaaaa", "size": "sm", "flex": 2 }, { "type": "text", "text": data.loc || '-', "wrap": true, "color": "#4b5563", "size": "sm", "flex": 5 }] },
                { "type": "box", "layout": "baseline", "spacing": "sm", "contents": [{ "type": "text", "text": "ปัญหา", "color": "#aaaaaa", "size": "sm", "flex": 2 }, { "type": "text", "text": data.detail, "wrap": true, "color": "#4b5563", "size": "sm", "flex": 5 }] },
                { "type": "box", "layout": "baseline", "spacing": "sm", "contents": [{ "type": "text", "text": "ด่วน", "color": "#aaaaaa", "size": "sm", "flex": 2 }, { "type": "text", "text": data.urgency || '-', "wrap": true, "color": "#4b5563", "size": "sm", "flex": 5 }] }
              ]
            },
            "footer": {
              "type": "box",
              "layout": "vertical",
              "spacing": "sm",
              "contents": [
                { "type": "button", "style": "primary", "color": "#265D5A", "action": { "type": "uri", "label": "เปิดดูในระบบ", "uri": "https://liff.line.me/" + CONFIG.LIFF_ID } }
              ]
            }
          }
        };
        
        notifyNewTask(lineRepMsg, data.reporter);
        
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
        
        const lineAvMsg = {
          "type": "flex",
          "altText": `แจ้งยืมโสตฯ: ${data.borrower}`,
          "contents": {
            "type": "bubble",
            "header": {
              "type": "box",
              "layout": "vertical",
              "backgroundColor": "#0d9488",
              "contents": [
                { "type": "text", "text": "📢 ขอยืมอุปกรณ์โสตฯ", "weight": "bold", "color": "#ffffff", "size": "xl" }
              ]
            },
            "body": {
              "type": "box",
              "layout": "vertical",
              "spacing": "md",
              "contents": [
                { "type": "text", "text": data.equipment, "weight": "bold", "size": "md", "wrap": true, "color": "#1f2937" },
                { "type": "separator", "margin": "md" },
                { "type": "box", "layout": "baseline", "spacing": "sm", "contents": [{ "type": "text", "text": "ผู้ยืม", "color": "#aaaaaa", "size": "sm", "flex": 2 }, { "type": "text", "text": data.borrower, "wrap": true, "color": "#4b5563", "size": "sm", "flex": 5 }] },
                { "type": "box", "layout": "baseline", "spacing": "sm", "contents": [{ "type": "text", "text": "วันที่", "color": "#aaaaaa", "size": "sm", "flex": 2 }, { "type": "text", "text": data.useDate, "wrap": true, "color": "#4b5563", "size": "sm", "flex": 5 }] },
                { "type": "box", "layout": "baseline", "spacing": "sm", "contents": [{ "type": "text", "text": "สถานที่", "color": "#aaaaaa", "size": "sm", "flex": 2 }, { "type": "text", "text": data.location, "wrap": true, "color": "#4b5563", "size": "sm", "flex": 5 }] }
              ]
            },
            "footer": {
              "type": "box",
              "layout": "vertical",
              "spacing": "sm",
              "contents": [
                { "type": "button", "style": "primary", "color": "#0d9488", "action": { "type": "uri", "label": "เปิดดูในระบบ", "uri": "https://liff.line.me/" + CONFIG.LIFF_ID } }
              ]
            }
          }
        };
        
        notifyNewTask(lineAvMsg, data.borrower);
        
        break;

      // ── แจ้งบั๊ก ─────────────────────────────────────────────
      case 'report_bug':
        const sheetBug = db.getSheetByName(CONFIG.BUG_SHEET_NAME);
        sheetBug.appendRow([timestamp, data.reporter, data.issue, data.page, "รอดำเนินการ"]);
        
        const lineBugMsg = {
          "type": "flex",
          "altText": `แจ้งปัญหาใหม่ (Bug): ${data.issue}`,
          "contents": {
            "type": "bubble",
            "header": {
              "type": "box",
              "layout": "vertical",
              "backgroundColor": "#dc2626",
              "contents": [
                { "type": "text", "text": "🐞 แจ้งปัญหาระบบ (Bug)", "weight": "bold", "color": "#ffffff", "size": "xl" }
              ]
            },
            "body": {
              "type": "box",
              "layout": "vertical",
              "spacing": "md",
              "contents": [
                { "type": "text", "text": data.issue, "weight": "bold", "size": "md", "wrap": true, "color": "#1f2937" },
                { "type": "separator", "margin": "md" },
                { "type": "box", "layout": "baseline", "spacing": "sm", "contents": [{ "type": "text", "text": "ผู้แจ้ง", "color": "#aaaaaa", "size": "sm", "flex": 2 }, { "type": "text", "text": data.reporter, "wrap": true, "color": "#4b5563", "size": "sm", "flex": 5 }] },
                { "type": "box", "layout": "baseline", "spacing": "sm", "contents": [{ "type": "text", "text": "หน้าจอ", "color": "#aaaaaa", "size": "sm", "flex": 2 }, { "type": "text", "text": data.page, "wrap": true, "color": "#4b5563", "size": "sm", "flex": 5 }] }
              ]
            },
            "footer": {
              "type": "box",
              "layout": "vertical",
              "spacing": "sm",
              "contents": [
                { "type": "button", "style": "primary", "color": "#dc2626", "action": { "type": "uri", "label": "เปิดดูในระบบ", "uri": "https://liff.line.me/" + CONFIG.LIFF_ID } }
              ]
            }
          }
        };
        notifyNewTask(lineBugMsg, data.reporter);
        
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
          const reporterLineId = getUserLineIdByName(reporterNameStr);
          
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
          
          const statusMsg = {
            "type": "flex",
            "altText": `งานซ่อมเสร็จสิ้น: ${subjectStr}`,
            "contents": {
              "type": "bubble",
              "header": {
                "type": "box",
                "layout": "vertical",
                "backgroundColor": "#059669",
                "contents": [
                  { "type": "text", "text": "✅ งานซ่อมเสร็จสิ้น", "weight": "bold", "color": "#ffffff", "size": "xl" }
                ]
              },
              "body": {
                "type": "box",
                "layout": "vertical",
                "spacing": "md",
                "contents": [
                  { "type": "text", "text": subjectStr, "weight": "bold", "size": "md", "wrap": true, "color": "#1f2937" },
                  { "type": "separator", "margin": "md" },
                  { "type": "box", "layout": "baseline", "spacing": "sm", "contents": [{ "type": "text", "text": "รายละเอียด", "color": "#aaaaaa", "size": "sm", "flex": 3 }, { "type": "text", "text": detailStr, "wrap": true, "color": "#4b5563", "size": "sm", "flex": 5 }] },
                  { "type": "box", "layout": "baseline", "spacing": "sm", "contents": [{ "type": "text", "text": "สถานะ", "color": "#aaaaaa", "size": "sm", "flex": 3 }, { "type": "text", "text": "เสร็จสิ้น", "wrap": true, "color": "#059669", "weight": "bold", "size": "sm", "flex": 5 }] }
                ]
              },
              "footer": {
                "type": "box",
                "layout": "vertical",
                "spacing": "sm",
                "contents": [
                  { "type": "button", "style": "primary", "color": "#059669", "action": { "type": "uri", "label": "เปิดดูในระบบ", "uri": "https://liff.line.me/" + CONFIG.LIFF_ID } }
                ]
              }
            }
          };
          notifyUpdateTask(statusMsg, reporterNameStr);
        }
        break;

      // ── ปิดงานซ่อม: เก็บรูปใน "รูปภาพผลการซ่อม" ────────────
      case 'update_task_proof':
        const sheetTaskProof = db.getSheetByName(CONFIG.SHEET_NAME);
        const targetRow = data.rowIndex + 2;
        const proofFileUrl = uploadFileToDrive(data.file, CONFIG.FOLDER_REPAIR_PROOF);
        const receiptUrl = uploadFileToDrive(data.receiptFile, CONFIG.FOLDER_RECEIPTS);
        
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
        const proofReporterLineId = getUserLineIdByName(proofReporter);
        
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
          
        const proofMsg = {
          "type": "flex",
          "altText": `งานซ่อมเสร็จสิ้น (พร้อมหลักฐาน): ${proofSubject}`,
          "contents": {
            "type": "bubble",
            "header": {
              "type": "box",
              "layout": "vertical",
              "backgroundColor": "#059669",
              "contents": [
                { "type": "text", "text": "✅ ปิดงานซ่อม (พร้อมหลักฐาน)", "weight": "bold", "color": "#ffffff", "size": "lg" }
              ]
            },
            "body": {
              "type": "box",
              "layout": "vertical",
              "spacing": "md",
              "contents": [
                { "type": "text", "text": proofSubject, "weight": "bold", "size": "md", "wrap": true, "color": "#1f2937" },
                { "type": "separator", "margin": "md" },
                { "type": "box", "layout": "baseline", "spacing": "sm", "contents": [{ "type": "text", "text": "การแก้ไข", "color": "#aaaaaa", "size": "sm", "flex": 3 }, { "type": "text", "text": data.fixDetail, "wrap": true, "color": "#4b5563", "size": "sm", "flex": 5 }] },
                { "type": "box", "layout": "baseline", "spacing": "sm", "contents": [{ "type": "text", "text": "ช่าง", "color": "#aaaaaa", "size": "sm", "flex": 3 }, { "type": "text", "text": data.technician, "wrap": true, "color": "#4b5563", "size": "sm", "flex": 5 }] }
              ]
            },
            "footer": {
              "type": "box",
              "layout": "vertical",
              "spacing": "sm",
              "contents": [
                { "type": "button", "style": "primary", "color": "#059669", "action": { "type": "uri", "label": "เปิดดูรูปหลักฐานในระบบ", "uri": "https://liff.line.me/" + CONFIG.LIFF_ID } },
                { "type": "button", "style": "primary", "color": "#f59e0b", "margin": "sm", "action": { "type": "uri", "label": "⭐ ประเมินความพึงพอใจ", "uri": "https://liff.line.me/" + CONFIG.LIFF_ID + "?action=survey&type=repair&row=" + targetRow } }
              ]
            }
          }
        };
        notifyUpdateTask(proofMsg, proofReporter);
        break;

      // ── อัพสถานะงานโสตฯ ─────────────────────────────────────
      case 'update_av_status':
        const sheetAvStatus = db.getSheetByName(CONFIG.AV_SHEET_NAME);
        const avTargetRow = data.rowIndex + 2;
        sheetAvStatus.getRange(avTargetRow, 6).setValue(data.status);
        sheetAvStatus.getRange(avTargetRow, 7).setValue(data.technician);
        
        // Notify AV completion
        if (data.status === 'เสร็จสิ้น/คืนเรียบร้อย') {
           const avSubject = sheetAvStatus.getRange(avTargetRow, 3).getValue();
           const avReporter = sheetAvStatus.getRange(avTargetRow, 2).getValue();
           const avMsg = {
            "type": "flex",
            "altText": `คืนอุปกรณ์เรียบร้อย: ${avSubject}`,
            "contents": {
              "type": "bubble",
              "header": {
                "type": "box",
                "layout": "vertical",
                "backgroundColor": "#059669",
                "contents": [
                  { "type": "text", "text": "✅ คืนอุปกรณ์เรียบร้อย", "weight": "bold", "color": "#ffffff", "size": "lg" }
                ]
              },
              "body": {
                "type": "box",
                "layout": "vertical",
                "spacing": "md",
                "contents": [
                  { "type": "text", "text": avSubject, "weight": "bold", "size": "md", "wrap": true, "color": "#1f2937" },
                  { "type": "separator", "margin": "md" },
                  { "type": "box", "layout": "baseline", "spacing": "sm", "contents": [{ "type": "text", "text": "เจ้าหน้าที่", "color": "#aaaaaa", "size": "sm", "flex": 3 }, { "type": "text", "text": data.technician, "wrap": true, "color": "#4b5563", "size": "sm", "flex": 5 }] }
                ]
              },
              "footer": {
                "type": "box",
                "layout": "vertical",
                "spacing": "sm",
                "contents": [
                  { "type": "button", "style": "primary", "color": "#f59e0b", "action": { "type": "uri", "label": "⭐ ประเมินความพึงพอใจ", "uri": "https://liff.line.me/" + CONFIG.LIFF_ID + "?action=survey&type=av&row=" + avTargetRow } }
                ]
              }
            }
          };
          notifyUpdateTask(avMsg, avReporter);
        } else if (data.status === 'จัดเตรียมแล้ว') {
           const avSubject = sheetAvStatus.getRange(avTargetRow, 3).getValue();
           const avReporter = sheetAvStatus.getRange(avTargetRow, 2).getValue();
           const avMsg = {
            "type": "flex",
            "altText": `เตรียมอุปกรณ์เรียบร้อย: ${avSubject}`,
            "contents": {
              "type": "bubble",
              "header": {
                "type": "box",
                "layout": "vertical",
                "backgroundColor": "#3b82f6",
                "contents": [
                  { "type": "text", "text": "🛠️ จัดเตรียมอุปกรณ์ให้แล้ว", "weight": "bold", "color": "#ffffff", "size": "lg" }
                ]
              },
              "body": {
                "type": "box",
                "layout": "vertical",
                "spacing": "md",
                "contents": [
                  { "type": "text", "text": "อุปกรณ์พร้อมให้มารับแล้วครับ", "weight": "regular", "size": "sm", "color": "#4b5563" },
                  { "type": "separator", "margin": "md" },
                  { "type": "text", "text": avSubject, "weight": "bold", "size": "md", "wrap": true, "color": "#1f2937" },
                  { "type": "box", "layout": "baseline", "spacing": "sm", "contents": [{ "type": "text", "text": "เจ้าหน้าที่", "color": "#aaaaaa", "size": "sm", "flex": 3 }, { "type": "text", "text": data.technician, "wrap": true, "color": "#4b5563", "size": "sm", "flex": 5 }] }
                ]
              }
            }
          };
          notifyUpdateTask(avMsg, avReporter);
        }
        break;

      // ── ประเมินความพึงพอใจ ──────────────────────────────────
      case 'submit_survey':
        const typeSur = data.type; // 'repair' or 'av'
        const rowSur = parseInt(data.row);
        let sheetSur = null;
        let ratingCol = 17, commentCol = 18;
        if (typeSur === 'repair') {
           sheetSur = db.getSheetByName(CONFIG.SHEET_NAME);
        } else if (typeSur === 'av') {
           sheetSur = db.getSheetByName(CONFIG.AV_SHEET_NAME);
           ratingCol = 13; commentCol = 14;
        }
        if (sheetSur && rowSur) {
           sheetSur.getRange(rowSur, ratingCol).setValue(data.rating);
           sheetSur.getRange(rowSur, commentCol).setValue(data.comment);
        }
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
        deleteRowById(sheetName, 0, delId);
        break;

      // ── ตั้งค่าระบบ ──────────────────────────────────────────
      case 'save_overdue_settings':
        let sheetSettings = db.getSheetByName('Settings');
        if (!sheetSettings) {
          sheetSettings = db.insertSheet('Settings');
          sheetSettings.appendRow(['Key', 'Value']);
        }
        
        let foundKey = false;
        const settingsData = sheetSettings.getDataRange().getValues();
        for (let i = 1; i < settingsData.length; i++) {
          if (settingsData[i][0] === 'overdue_days') {
            sheetSettings.getRange(i + 1, 2).setValue(data.days);
            foundKey = true;
            break;
          }
        }
        
        if (!foundKey) {
          sheetSettings.appendRow(['overdue_days', data.days]);
        }
        break;

      // ── เอกสาร: อัปโหลด → เก็บใน "เอกสารระบบ" ──────────────
      case 'add_document':
        let sheetAddDoc = db.getSheetByName(CONFIG.DOC_SHEET_NAME);
        if (!sheetAddDoc) {
          sheetAddDoc = db.insertSheet(CONFIG.DOC_SHEET_NAME);
          sheetAddDoc.appendRow(['docId', 'category', 'uploadDate', 'docName', 'uploader', 'fileUrl', 'fileExt', 'description']);
        }
        
        const addDocFileUrl = uploadFileToDrive(data.file, CONFIG.FOLDER_DOCUMENTS);

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
        deleteRowById(CONFIG.DOC_SHEET_NAME, 0, data.docId);
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
function uploadFileToDrive(fileData, folderName) {
  if (!fileData || !fileData.data) return "-";
  const folder = getOrCreateSubFolder(folderName);
  const blob = Utilities.newBlob(Utilities.base64Decode(fileData.data), fileData.type, fileData.name);
  const file = folder.createFile(blob);
  try { file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch (e) { Logger.log(e); }
  return file.getUrl();
}

function notifyNewTask(message, userToInclude) {
  let targets = getLineIdsByRoles(['admin', 'executive', 'tech', 'technician']);
  if (userToInclude) {
    let lineId = getUserLineIdByName(userToInclude);
    if (lineId && !targets.includes(lineId)) {
      targets.push(lineId);
    }
  }
  sendLineMessage(message, targets);
}

function notifyUpdateTask(message, userToInclude) {
  let targets = getLineIdsByRoles(['admin', 'executive']); // แอดมินทุกคน
  if (userToInclude) {
    let lineId = getUserLineIdByName(userToInclude);
    if (lineId && !targets.includes(lineId)) {
      targets.push(lineId);
    }
  }
  sendLineMessage(message, targets);
}

function deleteRowById(sheetName, idColIndex, idValue) {
  const sheet = getDB().getSheetByName(sheetName);
  if (!sheet) return;
  const values = sheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][idColIndex]) === String(idValue)) {
      sheet.deleteRow(i + 1);
      break;
    }
  }
}

function getDashboardDataInternal(monthStr) {
  const db = getDB();
  const bSheet   = db.getSheetByName(CONFIG.SHEET_NAME);
  const avSheet  = db.getSheetByName(CONFIG.AV_SHEET_NAME);
  const bugSheet = db.getSheetByName(CONFIG.BUG_SHEET_NAME);
  
  const bData = bSheet ? bSheet.getDataRange().getDisplayValues().slice(1) : [];
  let filteredBData = bData;
  if (monthStr) {
    filteredBData = bData.filter(r => {
      if (!r[0]) return false;
      const dateStr = r[0].toString().split(' ')[0];
      const parts = dateStr.split('/');
      if (parts.length !== 3) return false;
      const ym = parts[2] + "-" + parts[1].padStart(2, '0');
      return ym === monthStr;
    });
  }

  const building = {
    total:      filteredBData.length,
    pending:    filteredBData.filter(r => r[4] === "รอดำเนินการ").length,
    inProgress: filteredBData.filter(r => r[4] === "กำลังดำเนินการ").length,
    completed:  filteredBData.filter(r => r[4] === "เสร็จสิ้น").length
  };

  const avData = avSheet ? avSheet.getDataRange().getDisplayValues().slice(1) : [];
  let filteredAVData = avData;
  if (monthStr) {
    filteredAVData = avData.filter(r => {
      if (!r[0]) return false;
      const dateStr = r[0].toString().split(' ')[0];
      const parts = dateStr.split('/');
      if (parts.length !== 3) return false;
      const ym = parts[2] + "-" + parts[1].padStart(2, '0');
      return ym === monthStr;
    });
  }

  const av = {
    total:     filteredAVData.length,
    pending:   filteredAVData.filter(r => r[5] === "รอยืนยันการยืม").length,
    active:    filteredAVData.filter(r => r[5] === "กำลังใช้งาน" || r[5] === "จัดเตรียมแล้ว").length,
    completed: filteredAVData.filter(r => r[5] === "เสร็จสิ้น/คืนเรียบร้อย").length
  };

  let filteredBugs = 0;
  if (bugSheet) {
    const bugData = bugSheet.getDataRange().getDisplayValues().slice(1);
    if (monthStr) {
      filteredBugs = bugData.filter(r => {
        if (!r[0]) return false;
        const d = new Date(r[0]);
        if (isNaN(d.getTime())) return false;
        const ym = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, '0');
        return ym === monthStr;
      }).length;
    } else {
      filteredBugs = bugData.length;
    }
  }

  return { building, av, bugs: filteredBugs };
}

function getMasterDataInternal() {
  const db = getDB();
  
  let overdueDays = 3;
  const sheetSettings = db.getSheetByName('Settings');
  if (sheetSettings) {
    const settingsData = sheetSettings.getDataRange().getValues();
    for (let i = 1; i < settingsData.length; i++) {
      if (settingsData[i][0] === 'overdue_days') {
        overdueDays = parseInt(settingsData[i][1]) || 3;
        break;
      }
    }
  }

  return {
    locations: getSheetDataAsObjects(db, CONFIG.MASTER_LOC_SHEET),
    projects:  getSheetDataAsObjects(db, CONFIG.MASTER_PROJ_SHEET),
    mechanics: getSheetDataAsObjects(db, CONFIG.MASTER_MECH_SHEET),
    settings: { overdueDays: overdueDays }
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

// ค้นหา Line ID ของผู้แจ้งจากชื่อ
function getUserLineIdByName(name) {
  try {
    const db = getDB();
    const sheet = db.getSheetByName('Users');
    if (!sheet) return null;
    
    const data = sheet.getDataRange().getValues();
    const searchName = (name || '').toString().trim().toLowerCase();
    
    for (let i = 1; i < data.length; i++) {
      const sheetName = (data[i][1] || '').toString().trim().toLowerCase();
      if (sheetName === searchName && sheetName !== '') { 
        const lineId = (data[i][6] || '').toString().trim(); // Column G (6) = LineID
        if (lineId && (lineId.startsWith('U') || lineId.startsWith('C') || lineId.startsWith('R'))) {
          return lineId;
        }
      }
    }
    return null;
  } catch (e) {
    return null;
  }
}

// ดึง Line ID ตาม Role ที่กำหนด
function getLineIdsByRoles(targetRoles) {
  try {
    const db = getDB();
    const sheet = db.getSheetByName('Users');
    if (!sheet) return [];
    
    const data = sheet.getDataRange().getValues();
    let lineIds = [];
    
    for (let i = 1; i < data.length; i++) {
      const role = (data[i][2] || '').toString().trim().toLowerCase();
      const status = (data[i][3] || '').toString().trim().toLowerCase();
      if (status === 'approved' && targetRoles.includes(role)) {
        const lineId = (data[i][6] || '').toString().trim();
        if (lineId && (lineId.startsWith('U') || lineId.startsWith('C') || lineId.startsWith('R'))) {
          lineIds.push(lineId);
        }
      }
    }
    return [...new Set(lineIds)]; // ตัดค่าซ้ำ
  } catch (e) {
    return [];
  }
}

function handleLinkLineAccount(email, lineId, name, picture) {
  try {
    const ss = getDB();
    let sheet = ss.getSheetByName('Users');
    
    if (!sheet) {
      sheet = ss.insertSheet('Users');
      sheet.appendRow(['Email', 'Name', 'Role', 'Status', 'ProfilePicture', 'LastLogin', 'LineID']);
      sheet.getRange(1, 1, 1, 7).setFontWeight('bold').setBackground('#f3f4f6');
      sheet.setFrozenRows(1);
    }
    
    const data = sheet.getDataRange().getValues();
    const now = new Date();
    
    for (let i = 1; i < data.length; i++) {
      if ((data[i][0] || '').toString().trim().toLowerCase() === (email || '').trim().toLowerCase()) {
        const role = data[i][2] || 'Teacher';
        const status = data[i][3];
        const dbName = data[i][1];
        const dbPicture = data[i][4];
        
        if (status === 'approved') {
          sheet.getRange(i + 1, 7).setValue(lineId); // Column G (7) = LineID
          sheet.getRange(i + 1, 6).setValue(now); // Update LastLogin
          return ContentService.createTextOutput(JSON.stringify({ 
            status: 'success', 
            name: dbName || name,
            role: role,
            picture: dbPicture || picture,
            email: email,
            message: 'Linked successfully' 
          })).setMimeType(ContentService.MimeType.JSON);
        } else if (status === 'banned') {
          return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'บัญชีของคุณถูกระงับการใช้งาน กรุณาติดต่อแอดมิน' })).setMimeType(ContentService.MimeType.JSON);
        } else {
          return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'บัญชีของคุณกำลังรอการอนุมัติจากแอดมิน' })).setMimeType(ContentService.MimeType.JSON);
        }
      }
    }
    
    // ไม่พบบัญชี -> ลงทะเบียนใหม่อัตโนมัติเหมือน Google Login
    sheet.appendRow([email, name || 'LINE User', 'Teacher', 'approved', picture || '', now, lineId]);
    
    return ContentService.createTextOutput(JSON.stringify({ 
      status: 'success', 
      name: name || 'LINE User',
      role: 'Teacher',
      picture: picture || '',
      email: email,
      message: 'Registered and Linked successfully' 
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (e) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: e.message })).setMimeType(ContentService.MimeType.JSON);
  }
}

function sendLineMessage(message, targetId) {
  try {
    if (!CONFIG.LINE_CHANNEL_ACCESS_TOKEN || CONFIG.LINE_CHANNEL_ACCESS_TOKEN.includes("ใส่_")) return;
    
    let rawTargets = [];
    if (Array.isArray(targetId)) {
      rawTargets = targetId;
    } else if (typeof targetId === 'string' && targetId.trim() !== '') {
      rawTargets = [targetId.trim()];
    }

    // รวม LINE_TARGET_ID (กลุ่มหลัก) เข้าไปด้วยเสมอหากตั้งค่าไว้
    if (CONFIG.LINE_TARGET_ID && !CONFIG.LINE_TARGET_ID.includes("ใส่_")) {
      rawTargets.push(CONFIG.LINE_TARGET_ID.trim());
    }

    // คัดเฉพาะ ID ที่ไม่ว่างเปล่าและลบค่าซ้ำ
    const validTargets = [...new Set(rawTargets.filter(id => typeof id === 'string' && id.trim() !== ''))];
    if (validTargets.length === 0) return;

    const headers = {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + CONFIG.LINE_CHANNEL_ACCESS_TOKEN
    };

    // แยกประเภท User IDs (U...) กับ Group/Room IDs (C... หรือ R...)
    const userIds = validTargets.filter(id => id.startsWith('U'));
    const groupIds = validTargets.filter(id => !id.startsWith('U'));
    
    let allResponses = [];

    const msgPayload = typeof message === 'string' ? { "type": "text", "text": message } : message;

    // 1. ส่งถึง User IDs (ใช้ multicast ถ้ามีหลายคน หรือ push ถ้ามีคนเดียว)
    if (userIds.length > 0) {
      if (userIds.length === 1) {
        const res = UrlFetchApp.fetch("https://api.line.me/v2/bot/message/push", {
          method: "post",
          headers: headers,
          payload: JSON.stringify({
            "to": userIds[0],
            "messages": [msgPayload]
          }),
          muteHttpExceptions: true
        });
        allResponses.push(`[Push User] ${res.getResponseCode()}: ${res.getContentText()}`);
      } else {
        for (let i = 0; i < userIds.length; i += 500) {
          const chunk = userIds.slice(i, i + 500);
          const res = UrlFetchApp.fetch("https://api.line.me/v2/bot/message/multicast", {
            method: "post",
            headers: headers,
            payload: JSON.stringify({
              "to": chunk,
              "messages": [msgPayload]
            }),
            muteHttpExceptions: true
          });
          allResponses.push(`[Multicast Users] ${res.getResponseCode()}: ${res.getContentText()}`);
        }
      }
    }

    // 2. ส่งถึง Group/Room IDs (ผ่าน push เป็นรายกลุ่ม)
    for (const gid of groupIds) {
      const res = UrlFetchApp.fetch("https://api.line.me/v2/bot/message/push", {
        method: "post",
        headers: headers,
        payload: JSON.stringify({
          "to": gid,
          "messages": [msgPayload]
        }),
        muteHttpExceptions: true
      });
      allResponses.push(`[Push Group] ${res.getResponseCode()}: ${res.getContentText()}`);
    }
    
    // ==========================================
    // เขียน Logs ลงชีต "Logs" เพื่อการตรวจสอบ
    // ==========================================
    try {
      const db = getDB();
      let logSheet = db.getSheetByName('Logs');
      if (!logSheet) {
        logSheet = db.insertSheet('Logs');
        logSheet.appendRow(['Timestamp', 'Action', 'Targets', 'Responses', 'Message']);
        logSheet.getRange(1, 1, 1, 5).setFontWeight('bold').setBackground('#f3f4f6');
      }
      logSheet.appendRow([new Date(), 'LINE API', JSON.stringify(validTargets), allResponses.join(' | '), message]);
    } catch (logErr) {
      Logger.log("Failed to write log: " + logErr.message);
    }

  } catch (e) {
    Logger.log("Line Messaging API Error: " + e.message);
    try {
      const db = getDB();
      let logSheet = db.getSheetByName('Logs');
      if (!logSheet) { logSheet = db.insertSheet('Logs'); }
      logSheet.appendRow([new Date(), 'LINE API ERROR', '', e.message, '']);
    } catch (logErr) {}
  }
}

// ============================================================
// ฟังก์ชันตรวจสอบงานค้าง (Overdue Tasks)
// ── วิธีใช้: ให้ตั้ง Time-driven Trigger รันฟังก์ชันนี้ทุกวัน ──────
// ============================================================
function checkOverdueTasks() {
  const db = getDB();
  
  // 1. ดึงการตั้งค่า Overdue Days
  let overdueDays = 3;
  const sheetSettings = db.getSheetByName('Settings');
  if (sheetSettings) {
    const settingsData = sheetSettings.getDataRange().getValues();
    for (let i = 1; i < settingsData.length; i++) {
      if (settingsData[i][0] === 'overdue_days') {
        overdueDays = parseInt(settingsData[i][1]) || 3;
        break;
      }
    }
  }

  const now = new Date();
  now.setHours(0, 0, 0, 0); // รีเซ็ตเวลาเพื่อเปรียบเทียบแค่วันที่

  // 2. เช็คงานซ่อม
  const repSheet = db.getSheetByName(CONFIG.SHEET_NAME);
  if (repSheet) {
    const repData = repSheet.getDataRange().getValues();
    let overdueCount = 0;
    
    for (let i = 1; i < repData.length; i++) {
      const status = (repData[i][4] || '').toString().trim();
      if (status === 'รอดำเนินการ') {
        const dateStr = (repData[i][0] || '').toString().split(' ')[0]; // dd/MM/yyyy
        if (dateStr) {
          const parts = dateStr.split('/');
          if (parts.length === 3) {
            const taskDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
            taskDate.setHours(0, 0, 0, 0);
            const diffTime = Math.abs(now - taskDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
            
            if (diffDays >= overdueDays) {
              overdueCount++;
            }
          }
        }
      }
    }
    
    if (overdueCount > 0) {
      const msg = {
        "type": "flex",
        "altText": `แจ้งเตือน: มีงานซ่อมค้างเกินกำหนด ${overdueCount} งาน`,
        "contents": {
          "type": "bubble",
          "header": {
            "type": "box",
            "layout": "vertical",
            "backgroundColor": "#dc2626",
            "contents": [
              { "type": "text", "text": "⚠️ แจ้งเตือนงานค้าง (ซ่อม)", "weight": "bold", "color": "#ffffff", "size": "lg" }
            ]
          },
          "body": {
            "type": "box",
            "layout": "vertical",
            "spacing": "md",
            "contents": [
              { "type": "text", "text": `มีงานซ่อมค้างสถานะ "รอดำเนินการ" เกิน ${overdueDays} วัน จำนวน ${overdueCount} งาน`, "wrap": true, "color": "#1f2937", "size": "md" },
              { "type": "text", "text": "กรุณาเข้าสู่ระบบเพื่อตรวจสอบและจัดสรรงาน", "wrap": true, "color": "#6b7280", "size": "sm" }
            ]
          },
          "footer": {
            "type": "box",
            "layout": "vertical",
            "contents": [
              { "type": "button", "style": "primary", "color": "#dc2626", "action": { "type": "uri", "label": "เข้าสู่ระบบ", "uri": "https://liff.line.me/" + CONFIG.LIFF_ID } }
            ]
          }
        }
      };
      notifyUpdateTask(msg, null); // ส่งหา Admin
    }
  }

  // 3. เช็คงานโสตฯ
  const avSheet = db.getSheetByName(CONFIG.AV_SHEET_NAME);
  if (avSheet) {
    const avData = avSheet.getDataRange().getValues();
    let avOverdueCount = 0;
    
    for (let i = 1; i < avData.length; i++) {
      const status = (avData[i][5] || '').toString().trim();
      if (status === 'รอยืนยันการยืม') {
        const dateStr = (avData[i][0] || '').toString().split(' ')[0]; // dd/MM/yyyy
        if (dateStr) {
          const parts = dateStr.split('/');
          if (parts.length === 3) {
            const taskDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
            taskDate.setHours(0, 0, 0, 0);
            const diffTime = Math.abs(now - taskDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
            
            if (diffDays >= overdueDays) {
              avOverdueCount++;
            }
          }
        }
      }
    }
    
    if (avOverdueCount > 0) {
      const msg = {
        "type": "flex",
        "altText": `แจ้งเตือน: มีรายการยืมโสตฯค้างเกินกำหนด ${avOverdueCount} รายการ`,
        "contents": {
          "type": "bubble",
          "header": {
            "type": "box",
            "layout": "vertical",
            "backgroundColor": "#dc2626",
            "contents": [
              { "type": "text", "text": "⚠️ แจ้งเตือนงานค้าง (โสตฯ)", "weight": "bold", "color": "#ffffff", "size": "lg" }
            ]
          },
          "body": {
            "type": "box",
            "layout": "vertical",
            "spacing": "md",
            "contents": [
              { "type": "text", "text": `มีงานโสตฯค้างสถานะ "รอยืนยันการยืม" เกิน ${overdueDays} วัน จำนวน ${avOverdueCount} งาน`, "wrap": true, "color": "#1f2937", "size": "md" },
              { "type": "text", "text": "กรุณาเข้าสู่ระบบเพื่อตรวจสอบ", "wrap": true, "color": "#6b7280", "size": "sm" }
            ]
          },
          "footer": {
            "type": "box",
            "layout": "vertical",
            "contents": [
              { "type": "button", "style": "primary", "color": "#dc2626", "action": { "type": "uri", "label": "เข้าสู่ระบบ", "uri": "https://liff.line.me/" + CONFIG.LIFF_ID } }
            ]
          }
        }
      };
      notifyUpdateTask(msg, null); // ส่งหา Admin
    }
  }
}



