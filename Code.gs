// [Optimization] Override Date toJSON to mimic getDisplayValues() output format
Date.prototype.toJSON = function() {
  return Utilities.formatDate(this, Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm:ss");
};
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
  USER_SHEET_NAME: "Users",
  MASTER_LOC_SHEET: "Master_Locations",
  MASTER_PROJ_SHEET: "Master_Projects",
  MASTER_MECH_SHEET: "Master_Mechanics",
  DOC_SHEET_NAME: "Documents",
  IT_SHEET_NAME: "IT_Repairs",
  AV_REPAIR_SHEET_NAME: "AV_Repairs",
  PROJECT_SHEET_NAME: "Facility_Projects",

  // โฟลเดอร์หลักของระบบ (parent)
  ROOT_FOLDER_ID: "1tkOHFwH4MC-eA_eNLThTcLVF3CRHQUXT",

  // ชื่อโฟลเดอร์ย่อยที่จะสร้างอัตโนมัติใน Google Drive
  FOLDER_REPAIR_REPORT: "รูปภาพแจ้งซ่อม",       // รูปที่ผู้แจ้งส่งมา
  FOLDER_REPAIR_PROOF:  "รูปภาพผลการซ่อม",       // รูปที่ช่างส่งตอนปิดงาน
  FOLDER_DOCUMENTS:     "เอกสารระบบ",             // เอกสารจากระบบจัดการเอกสาร
  FOLDER_RECEIPTS:      "เอกสารใบเสร็จ",          // ใบเสร็จเบิกจ่าย / ใบเสนอราคา
  FOLDER_IT_REPORT:     "รูปภาพแจ้งซ่อมไอที",
  FOLDER_AV_REPAIR:     "รูปภาพซ่อมโสตฯ",
  FOLDER_PROJECTS:      "เอกสารโครงการระยะยาว",
  LINE_CHANNEL_ACCESS_TOKEN: "/m/tnS6KiDY+44jNQDWM2LOTR2pX0qmiA7RT23sE7rGQjTSTcp3TpNlXJYootWAJCYogsOY/KEW4s3Ex5in2tKeaHTbT3l3f2Ro2ROefSj8tNk8yh6FRkH4ccnNGSr1Lx/O6/+b1cFIm9sLRLa2SQAdB04t89/1O/w1cDnyilFU=", // <-- เปลี่ยนเป็น Channel Access Token ของคุณ
  LINE_TARGET_ID: "C3b2a8a52adb5fa219ec51bb7fda15d5e", // Default target ID
  LIFF_ID: "2011401549-8xNgb1CC", // LIFF ID สำหรับใช้งาน LINE Login
  WEB_APP_URL: "https://parinyabtc69-txohu-dzwz.github.io/FaCiLiTy/", // URL ของระบบ (หน้าเว็บ Frontend)
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
      result = sheetTasks ? sheetTasks.getDataRange().getValues().slice(1) : [];
      break;
    
    case 'get_av_requests':
      const sheetAV = db.getSheetByName(CONFIG.AV_SHEET_NAME);
      result = sheetAV ? sheetAV.getDataRange().getValues().slice(1) : [];
      break;

    case 'get_dashboard':
      return ContentService.createTextOutput(JSON.stringify(getDashboardDataInternal(e.parameter.month)))
        .setMimeType(ContentService.MimeType.JSON);

    case 'get_master_data':
      return ContentService.createTextOutput(JSON.stringify(getMasterDataInternal()))
        .setMimeType(ContentService.MimeType.JSON);

    case 'get_documents':
      const sheetDocs = db.getSheetByName(CONFIG.DOC_SHEET_NAME);
      result = sheetDocs ? sheetDocs.getDataRange().getValues().slice(1) : [];
      break;

    case 'get_users':
      const sheetUsers = db.getSheetByName(CONFIG.USER_SHEET_NAME);
      result = sheetUsers ? sheetUsers.getDataRange().getValues().slice(1) : [];
      break;

    case 'get_adv_tasks':
      let itData = [];
      let avRepData = [];
      let projData = [];

      const sIt = db.getSheetByName(CONFIG.IT_SHEET_NAME);
      if (sIt) {
        const vals = sIt.getDataRange().getValues();
        if (vals.length > 1) itData = vals.slice(1);
      }

      const sAvRep = db.getSheetByName(CONFIG.AV_REPAIR_SHEET_NAME);
      if (sAvRep) {
        const vals = sAvRep.getDataRange().getValues();
        if (vals.length > 1) avRepData = vals.slice(1);
      }

      const sProj = db.getSheetByName(CONFIG.PROJECT_SHEET_NAME);
      if (sProj) {
        const vals = sProj.getDataRange().getValues();
        if (vals.length > 1) projData = vals.slice(1);
      }

      result = {
        it: itData.reverse(),
        av: avRepData.reverse(),
        project: projData.reverse()
      };
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
    
    // ── ตรวจสอบว่าเป็น Webhook จาก LINE หรือไม่ ────────────────────────
    if (data.events && Array.isArray(data.events)) {
      data.events.forEach(event => {
        if (event.type === 'message' && event.source && (event.source.type === 'group' || event.source.type === 'room') && event.message.text === 'id') {
          sendLineMessage('Group ID ของกลุ่มนี้คือ:\n' + event.source.groupId, event.source.groupId);
        }
      });
      return ContentService.createTextOutput("OK").setMimeType(ContentService.MimeType.TEXT);
    }
    
    switch (data.action) {
      // ── ระบบ Login ใหม่ (Google OAuth) ────────────────────────
      case 'google_login':
        return handleGoogleLogin(data.credential);
        
      // ── ผูกบัญชี LINE ────────────────────────
      case 'link_line_account':
        return handleLinkLineAccount(data.email, data.lineId, data.name, data.picture);

      // ── ประเมินความพึงพอใจ ────────────────────────
      case 'submit_survey':
        let surveySheetName = '';
        let surveyTypeLabel = '';
        if (data.type === 'repair') {
          surveySheetName = CONFIG.SHEET_NAME;
          surveyTypeLabel = 'งานซ่อมอาคาร';
        } else if (data.type === 'it_repair') {
          surveySheetName = CONFIG.IT_SHEET_NAME;
          surveyTypeLabel = 'งานซ่อมไอที';
        } else if (data.type === 'av') {
          surveySheetName = CONFIG.AV_SHEET_NAME;
          surveyTypeLabel = 'งานยืมโสตฯ';
        } else if (data.type === 'av_repair') {
          surveySheetName = CONFIG.AV_REPAIR_SHEET_NAME;
          surveyTypeLabel = 'งานซ่อมโสตฯ';
        }
        
        if (surveySheetName) {
          const surveySheet = db.getSheetByName(surveySheetName);
          if (surveySheet) {
            surveySheet.getRange(data.row, 19).setValue(data.rating); // Col S = Rating
            surveySheet.getRange(data.row, 20).setValue(data.comment || ""); // Col T = Comment
            
            // แจ้งเตือน Admin ว่ามีการประเมิน
            const starText = '⭐'.repeat(Number(data.rating) || 0);
            const surveyNotifMsg = createFlexMessageTemplate(
              `ผลประเมิน: ${surveyTypeLabel}`,
              `${starText} ผลประเมินความพึงพอใจ`,
              `${surveyTypeLabel} — ได้รับ ${data.rating}/5 ดาว`,
              "#f59e0b",
              [
                { label: "คะแนน", value: `${data.rating}/5 ดาว ${starText}` },
                { label: "ความคิดเห็น", value: data.comment || "(ไม่มีความคิดเห็น)" }
              ]
            );
            notifyTask('admin', surveyNotifMsg, `⭐ มีผลประเมินใหม่: ${data.rating}/5 ดาว`, '#f59e0b', {reporter: 'ผู้ใช้งาน', subject: surveyTypeLabel}, null);
          }
        }
        return ContentService.createTextOutput(JSON.stringify({ status: 'success', message: 'บันทึกการประเมินสำเร็จ' }))
          .setMimeType(ContentService.MimeType.JSON);

      // ── แจ้งซ่อม: เก็บรูปใน "รูปภาพแจ้งซ่อม" ──────────────
      case 'submit_repair':
        const sheetRep = db.getSheetByName(CONFIG.SHEET_NAME);
        const repFileUrl = uploadFileToDrive(data.file, CONFIG.FOLDER_REPAIR_REPORT);
        sheetRep.appendRow([timestamp, data.subject, data.detail, data.reporter, "รอดำเนินการ", repFileUrl, "", "", "", "", "", data.urgency || "", data.dept || "", data.loc || "", data.incidentDate || "", data.contact || ""]);
        
        // Email handled by notifyTask
        
        const lineRepMsg = createFlexMessageTemplate(
          `แจ้งซ่อมใหม่: ${data.subject}`,
          "🔔 แจ้งปัญหาใหม่",
          data.subject,
          "#265D5A",
          [
            { label: "ผู้แจ้ง", value: data.reporter },
            { label: "สถานที่", value: data.loc },
            { label: "ปัญหา", value: data.detail },
            { label: "ด่วน", value: data.urgency }
          ]
        );
        
        notifyTask('building', lineRepMsg, `🚨 แจ้งซ่อมอาคารสถานที่ใหม่`, '#265D5A', data, null);
        
        break;

      // ── แจ้งซ่อมระบบ IT ──────────────────────────────────────
      case 'submit_it_repair':
        let sheetIt = db.getSheetByName(CONFIG.IT_SHEET_NAME);
        if (!sheetIt) {
          sheetIt = db.insertSheet(CONFIG.IT_SHEET_NAME);
          sheetIt.appendRow(['Timestamp', 'Subject', 'Detail', 'Reporter', 'Status', 'Image_Report', 'Image_Proof', 'Fix_Detail', 'Technician', 'Cost', 'Receipt', 'Urgency', 'Department', 'Location', 'IncidentDate', 'Contact']);
        }
        const itFileUrl = uploadFileToDrive(data.file, CONFIG.FOLDER_IT_REPORT);
        sheetIt.appendRow([timestamp, data.subject, data.detail, data.reporter, "รอดำเนินการ", itFileUrl, "", "", "", "", "", data.urgency || "", data.dept || "", data.loc || "", data.incidentDate || "", data.contact || ""]);
        
        const lineItMsg = createFlexMessageTemplate(
          `แจ้งซ่อม IT ใหม่: ${data.subject}`,
          "💻 แจ้งปัญหาไอทีใหม่",
          data.subject || "-",
          "#0ea5e9",
          [
            { label: "ผู้แจ้ง", value: data.reporter || "-" },
            { label: "สถานที่", value: data.loc },
            { label: "ปัญหา", value: data.detail || "-" }
          ]
        );
        notifyTask('it', lineItMsg, `💻 แจ้งปัญหาไอทีใหม่`, '#0ea5e9', data, null);
        break;

      // ── แจ้งซ่อมโสตฯ ──────────────────────────────────────
      case 'submit_av_repair':
        let sheetAvRep = db.getSheetByName(CONFIG.AV_REPAIR_SHEET_NAME);
        if (!sheetAvRep) {
          sheetAvRep = db.insertSheet(CONFIG.AV_REPAIR_SHEET_NAME);
          sheetAvRep.appendRow(['Timestamp', 'Subject', 'Detail', 'Reporter', 'Status', 'Image_Report', 'Image_Proof', 'Fix_Detail', 'Technician', 'Cost', 'Receipt', 'Urgency', 'Department', 'Location', 'IncidentDate', 'Contact']);
        }
        const avRepFileUrl = uploadFileToDrive(data.file, CONFIG.FOLDER_AV_REPAIR);
        sheetAvRep.appendRow([timestamp, data.subject, data.detail, data.reporter, "รอดำเนินการ", avRepFileUrl, "", "", "", "", "", data.urgency || "", data.dept || "", data.loc || "", data.incidentDate || "", data.contact || ""]);
        
        const lineAvRepMsg = createFlexMessageTemplate(
          `แจ้งซ่อมโสตฯ ใหม่: ${data.subject}`,
          "🎥 แจ้งซ่อมโสตฯใหม่",
          data.subject || "-",
          "#f59e0b",
          [
            { label: "ผู้แจ้ง", value: data.reporter || "-" },
            { label: "สถานที่", value: data.loc },
            { label: "ปัญหา", value: data.detail || "-" }
          ]
        );
        notifyTask('av_repair', lineAvRepMsg, `📷 แจ้งซ่อมอุปกรณ์โสตฯ ใหม่`, '#f59e0b', data, null);
        break;

      // ── แจ้งโครงการระยะยาว ──────────────────────────────────────
      case 'submit_project':
        let sheetProjData = db.getSheetByName(CONFIG.PROJECT_SHEET_NAME);
        if (!sheetProjData) {
          sheetProjData = db.insertSheet(CONFIG.PROJECT_SHEET_NAME);
          sheetProjData.appendRow(['Timestamp', 'Subject', 'Detail', 'Reporter', 'Status', 'Document_Url', 'Proof_Url', 'Approval_Note', 'Approver', 'Cost', 'Receipt', 'Urgency', 'Department', 'Location', 'TargetDate', 'Contact']);
        }
        const projFileUrl = uploadFileToDrive(data.file, CONFIG.FOLDER_PROJECTS);
        sheetProjData.appendRow([timestamp, data.subject, data.detail, data.reporter, "รอผู้อำนวยการอนุมัติ", projFileUrl, "", "", "", "", "", data.urgency || "", data.dept || "", data.loc || "", data.targetDate || "", data.contact || ""]);
        
        const lineProjMsg = createFlexMessageTemplate(
          `แจ้งโครงการใหม่: ${data.subject}`,
          "🏗️ โครงการระยะยาวใหม่",
          data.subject || "-",
          "#8b5cf6",
          [
            { label: "ผู้เสนอ", value: data.reporter || "-" },
            { label: "สถานที่", value: data.loc },
            { label: "รายละเอียด", value: data.detail || "-" }
          ],
          [
            { label: "พิจารณาอนุมัติ", url: CONFIG.WEB_APP_URL }
          ]
        );
        notifyTask('project', lineProjMsg, `🏢 เสนอโครงการ / จัดซื้อใหม่`, '#8b5cf6', data, null);
        break;

      // ── ยืมโสตฯ ─────────────────────────────────────────────
      case 'submit_av':
        const sheetAvReq = db.getSheetByName(CONFIG.AV_SHEET_NAME);
        sheetAvReq.appendRow([timestamp, data.borrower, data.equipment, data.useDate, data.location, "รอยืนยันการยืม", "-", data.signature]);
        
        // Email handled by notifyTask
        
        const lineAvMsg = createFlexMessageTemplate(
          `แจ้งยืมโสตฯ: ${data.borrower}`,
          "📢 ขอยืมอุปกรณ์โสตฯ",
          data.equipment,
          "#0d9488",
          [
            { label: "ผู้ยืม", value: data.borrower },
            { label: "วันที่", value: data.useDate },
            { label: "สถานที่", value: data.location }
          ]
        );
        
        notifyTask('av', lineAvMsg, `🎤 แจ้งยืมอุปกรณ์โสตฯ ใหม่`, '#0d9488', data, null);
        
        break;

      // ── แจ้งบั๊ก ─────────────────────────────────────────────
      case 'report_bug':
        const sheetBug = db.getSheetByName(CONFIG.BUG_SHEET_NAME);
        sheetBug.appendRow([timestamp, data.reporter, data.issue, data.page, "รอดำเนินการ"]);
        
        const lineBugMsg = createFlexMessageTemplate(
          `แจ้งปัญหาใหม่ (Bug): ${data.issue}`,
          "🐞 แจ้งปัญหาระบบ (Bug)",
          data.issue,
          "#dc2626",
          [
            { label: "ผู้แจ้ง", value: data.reporter },
            { label: "หน้าจอ", value: data.page }
          ]
        );
        notifyTask('bug', lineBugMsg, `🐞 แจ้งปัญหาระบบใหม่`, '#ef4444', data, null);
        
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
            const bodyHtml = generateEmailHtml(
              `✅ งานซ่อมเสร็จสิ้น: ${subjectStr}`,
              "#059669",
              reporterNameStr,
              null,
              subjectStr,
              `อาการ: ${detailStr}<br>สถานะ: เสร็จสิ้น`
            );
            try {
              // MailApp block disabled
            } catch (e) { Logger.log(e.message); }
          }
          
          const statusMsg = createFlexMessageTemplate(
            `งานซ่อมเสร็จสิ้น: ${subjectStr}`,
            "✅ งานซ่อมเสร็จสิ้น",
            subjectStr,
            "#059669",
            [
              { label: "รายละเอียด", value: detailStr, flexLabel: 3, flexValue: 5 },
              { label: "สถานะ", value: "เสร็จสิ้น", flexLabel: 3, flexValue: 5 }
            ],
            [
              { label: "⭐ ประเมินความพึงพอใจ", url: CONFIG.WEB_APP_URL + "?action=survey&type=repair&row=" + statusTargetRow, color: "#f59e0b" }
            ]
          );
          notifyTask('building', statusMsg, `อัปเดตสถานะงานซ่อมอาคาร`, '#265D5A', {reporter: reporterNameStr, subject: subjectStr, status: 'เสร็จสิ้น'}, null);
        }
        break;

      // ── ปิดงานซ่อม: เก็บรูปใน "รูปภาพผลการซ่อม" ────────────
      case 'update_adv_task':
        let advSheetName = data.tabType === 'it' ? CONFIG.IT_SHEET_NAME : CONFIG.PROJECT_SHEET_NAME;
        const sheetAdv = db.getSheetByName(advSheetName);
        if (!sheetAdv) {
          return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Sheet not found' })).setMimeType(ContentService.MimeType.JSON);
        }
        
        const targetAdvRow = data.rowIndex + 2;
        sheetAdv.getRange(targetAdvRow, 5).setValue(data.status);
        
        if (data.file) {
          const proofUrl = uploadFileToDrive(data.file, CONFIG.FOLDER_REPAIR_PROOF);
          sheetAdv.getRange(targetAdvRow, 7).setValue(proofUrl);
        }
        if (data.fixDetail) {
          sheetAdv.getRange(targetAdvRow, 8).setValue(data.fixDetail);
        }
        if (data.technician) {
          sheetAdv.getRange(targetAdvRow, 9).setValue(data.technician);
        }
        if (data.cost) {
          const advCost = (!isNaN(data.cost) && Number(data.cost) > 0) ? Number(data.cost) : "-";
          sheetAdv.getRange(targetAdvRow, 10).setValue(advCost);
        }
        if (data.receiptFile) {
          const receiptUrlAdv = uploadFileToDrive(data.receiptFile, CONFIG.FOLDER_RECEIPTS);
          sheetAdv.getRange(targetAdvRow, 11).setValue(receiptUrlAdv);
        }
        
        // ส่งแจ้งเตือนกลับไปยังผู้แจ้ง (เฉพาะตอนปิดงาน)
        const isDoneStatus = data.status === 'เสร็จสิ้น' || data.status === 'อนุมัติ';
        if (isDoneStatus && data.technician) {
          const advSubject = sheetAdv.getRange(targetAdvRow, 2).getValue();
          const advReporter = sheetAdv.getRange(targetAdvRow, 4).getValue();
          const advReporterEmail = getUserEmailByName(advReporter);
          const isIT = data.tabType === 'it';
          const surveyType = isIT ? 'it_repair' : 'project';
          const taskLabel = isIT ? '💻 งานซ่อมไอที' : '📋 โครงการ';
          const advColor = isIT ? '#0ea5e9' : '#8b5cf6';
          
          if (advReporterEmail) {
            const advBodyHtml = generateEmailHtml(
              `✅ ${taskLabel}เสร็จสิ้น: ${advSubject}`,
              isIT ? "#0ea5e9" : "#8b5cf6",
              advReporter,
              null,
              advSubject,
              `การดำเนินการ: ${data.fixDetail}<br>ผู้รับผิดชอบ: ${data.technician}`
            );
            try {
              // MailApp block disabled
            } catch (e) { Logger.log(e.message); }
          }
          
          const advDoneMsg = createFlexMessageTemplate(
            `${taskLabel}เสร็จสิ้น: ${advSubject}`,
            `✅ ${taskLabel}เสร็จสิ้น`,
            advSubject,
            advColor,
            [
              { label: "การดำเนินการ", value: data.fixDetail, flexLabel: 3, flexValue: 5 },
              { label: "ผู้รับผิดชอบ", value: data.technician, flexLabel: 3, flexValue: 5 }
            ],
            [
              { label: "⭐ ประเมินความพึงพอใจ", url: CONFIG.WEB_APP_URL + "?action=survey&type=" + surveyType + "&row=" + targetAdvRow, color: "#f59e0b" }
            ]
          );
          notifyTask(isIT ? 'it' : 'admin', advDoneMsg, `${taskLabel}เสร็จสิ้น`, advColor, {reporter: advReporter, subject: advSubject, status: data.status}, null);
        }
        
        // Return success
        return ContentService.createTextOutput(JSON.stringify({ status: 'success' })).setMimeType(ContentService.MimeType.JSON);
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
          const bodyHtml = generateEmailHtml(
            `✅ งานซ่อมเสร็จสิ้น: ${proofSubject}`,
            "#059669",
            proofReporter,
            null,
            proofSubject,
            `อาการ: ${proofDetail}<br>การแก้ไข: ${data.fixDetail}<br>ช่าง: ${data.technician}`
          );
          try {
            // MailApp block disabled
          } catch (e) { Logger.log(e.message); }
          }
          
        const proofMsg = createFlexMessageTemplate(
          `งานซ่อมเสร็จสิ้น (พร้อมหลักฐาน): ${proofSubject}`,
          "✅ ปิดงานซ่อม (พร้อมหลักฐาน)",
          proofSubject,
          "#059669",
          [
            { label: "การแก้ไข", value: data.fixDetail, flexLabel: 3, flexValue: 5 },
            { label: "ช่าง", value: data.technician, flexLabel: 3, flexValue: 5 }
          ],
          [
            { label: "เปิดดูรูปหลักฐานในระบบ", url: CONFIG.WEB_APP_URL, color: "#059669" },
            { label: "⭐ ประเมินความพึงพอใจ", url: CONFIG.WEB_APP_URL + "?action=survey&type=repair&row=" + targetRow, color: "#f59e0b" }
          ]
        );
        // Determine taskType based on sheetName
        let advTaskType = 'building';
        let color = '#265D5A';
        if (data.sheetName === CONFIG.IT_SHEET_NAME) { advTaskType = 'it'; color = '#0ea5e9'; }
        else if (data.sheetName === CONFIG.AV_REPAIR_SHEET_NAME) { advTaskType = 'av_repair'; color = '#f59e0b'; }
        else if (data.sheetName === CONFIG.PROJECT_SHEET_NAME) { advTaskType = 'project'; color = '#8b5cf6'; }
        
        notifyTask(advTaskType, proofMsg, `อัปเดตสถานะงาน`, color, {reporter: proofReporter, subject: proofSubject, status: data.status || 'เสร็จสิ้น'}, null);
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
           const avMsg = createFlexMessageTemplate(
            `คืนอุปกรณ์เรียบร้อย: ${avSubject}`,
            "✅ คืนอุปกรณ์เรียบร้อย",
            avSubject,
            "#059669",
            [
              { label: "เจ้าหน้าที่", value: data.technician, flexLabel: 3, flexValue: 5 }
            ],
            [
              { label: "⭐ ประเมินความพึงพอใจ", url: CONFIG.WEB_APP_URL + "?action=survey&type=av&row=" + avTargetRow, color: "#f59e0b" }
            ]
          );
          notifyTask('av', avMsg, `อัปเดตสถานะงานยืมโสตฯ`, '#0d9488', {borrower: avReporter, subject: sheetAvStatus.getRange(avTargetRow, 3).getValue(), status: 'ใช้งานอยู่'}, null);
        } else if (data.status === 'จัดเตรียมแล้ว') {
           const avSubject = sheetAvStatus.getRange(avTargetRow, 3).getValue();
           const avReporter = sheetAvStatus.getRange(avTargetRow, 2).getValue();
           const avMsg = createFlexMessageTemplate(
            `เตรียมอุปกรณ์เรียบร้อย: ${avSubject}`,
            "🛠️ จัดเตรียมอุปกรณ์ให้แล้ว",
            avSubject,
            "#3b82f6",
            [
              { label: "สถานะ", value: "อุปกรณ์พร้อมให้มารับแล้วครับ", flexLabel: 3, flexValue: 5 },
              { label: "เจ้าหน้าที่", value: data.technician, flexLabel: 3, flexValue: 5 }
            ],
            []
          );
          notifyTask('av', avMsg, `อัปเดตสถานะงานยืมโสตฯ`, '#0d9488', {borrower: avReporter, subject: sheetAvStatus.getRange(avTargetRow, 3).getValue(), status: 'คืนเรียบร้อย'}, null);
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
        const sheetUpdateUser = db.getSheetByName(CONFIG.USER_SHEET_NAME);
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

function getContactsByRoles(targetRoles) {
  try {
    const db = getDB();
    const sheet = db.getSheetByName(CONFIG.USER_SHEET_NAME);
    if (!sheet) return { emails: [], lineIds: [] };
    
    const data = sheet.getDataRange().getValues();
    let emails = [];
    let lineIds = [];
    
    for (let i = 1; i < data.length; i++) {
      const role = (data[i][2] || '').toString().trim().toLowerCase();
      const status = (data[i][3] || '').toString().trim().toLowerCase();
      if (status === 'approved' && targetRoles.includes(role)) {
        const email = (data[i][0] || '').toString().trim();
        const lineId = (data[i][6] || '').toString().trim();
        if (email && email.includes('@')) emails.push(email);
        if (lineId && (lineId.startsWith('U') || lineId.startsWith('C') || lineId.startsWith('R'))) {
          lineIds.push(lineId);
        }
      }
    }
    return { emails: [...new Set(emails)], lineIds: [...new Set(lineIds)] };
  } catch(e) {
    return { emails: [], lineIds: [] };
  }
}

function getReporterContacts(name) {
  try {
    const db = getDB();
    const sheet = db.getSheetByName(CONFIG.USER_SHEET_NAME);
    if (!sheet || !name) return { email: null, lineId: null };
    
    const data = sheet.getDataRange().getValues();
    const searchName = name.toString().trim().toLowerCase();
    
    for (let i = 1; i < data.length; i++) {
      const rowName = (data[i][1] || '').toString().trim().toLowerCase();
      if (rowName === searchName) {
        return {
          email: (data[i][0] || '').toString().trim(),
          lineId: (data[i][6] || '').toString().trim()
        };
      }
    }
    return { email: null, lineId: null };
  } catch(e) {
    return { email: null, lineId: null };
  }
}
function createFlexMessageTemplate(altText, headerText, subjectText, color, detailsMap, buttonsArray) {
  const detailsContents = [];
  detailsMap.forEach(item => {
    if (item.value && item.value !== '-') {
      detailsContents.push({
        "type": "box", "layout": "baseline", "spacing": "sm", 
        "contents": [
          { "type": "text", "text": item.label, "color": "#aaaaaa", "size": "sm", "flex": item.flexLabel || 2 }, 
          { "type": "text", "text": String(item.value), "wrap": true, "color": "#4b5563", "size": "sm", "flex": item.flexValue || 5 }
        ]
      });
    }
  });

  const buttonsContents = [];
  if (buttonsArray && buttonsArray.length > 0) {
    buttonsArray.forEach((btn, index) => {
      const btnObj = {
        "type": "button", "style": "primary", "color": btn.color || color,
        "action": { "type": "uri", "label": btn.label, "uri": btn.url }
      };
      if (index > 0) btnObj.margin = "sm";
      buttonsContents.push(btnObj);
    });
  } else {
    buttonsContents.push({
      "type": "button", "style": "primary", "color": color, 
      "action": { "type": "uri", "label": "เปิดดูในระบบ", "uri": CONFIG.WEB_APP_URL }
    });
  }

  return {
    "type": "flex",
    "altText": altText,
    "contents": {
      "type": "bubble",
      "header": {
        "type": "box", "layout": "vertical", "backgroundColor": color,
        "contents": [{ "type": "text", "text": headerText, "weight": "bold", "color": "#ffffff", "size": "xl" }]
      },
      "body": {
        "type": "box", "layout": "vertical", "spacing": "md",
        "contents": [
          { "type": "text", "text": subjectText, "weight": "bold", "size": "lg", "wrap": true, "color": "#1f2937" },
          { "type": "separator", "margin": "md" },
          ...detailsContents
        ]
      },
      "footer": {
        "type": "box", "layout": "vertical", "spacing": "sm",
        "contents": buttonsContents
      }
    }
  };
}

function generateEmailHtml(title, color, reporter, loc, subject, detail) {
  return `
    <div style="font-family:sans-serif; max-width:600px; margin:0 auto; padding:20px; border:1px solid #e2e8f0; border-radius:12px;">
      <h2 style="color:${color}; border-bottom:2px solid ${color}; padding-bottom:10px;">${title}</h2>
      <p><strong>ผู้แจ้ง:</strong> ${reporter || '-'}</p>
      ${loc ? `<p><strong>สถานที่:</strong> ${loc}</p>` : ''}
      <p><strong>เรื่อง:</strong> ${subject || '-'}</p>
      <p><strong>รายละเอียด/สถานะ:</strong> ${detail || '-'}</p>
      <hr style="border:0; border-top:1px solid #e2e8f0; margin:20px 0;">
      <p style="text-align:center; color:#64748b; font-size:12px;">FaCiLiTy System Notification</p>
    </div>
  `;
}

function notifyTask(taskType, lineMsg, emailTitle, emailColor, dataObj, reporterNameOverride) {
  let targetRoles = [];
  
  if (taskType === 'project') {
    targetRoles = ['admin', 'executive'];
  } else if (taskType === 'bug') {
    targetRoles = ['admin', 'executive'];
  } else {
    // building, it, av, av_repair
    targetRoles = ['admin', 'executive', 'tech', 'av'];
  }
  
  const contacts = getContactsByRoles(targetRoles);
  let lineTargets = contacts.lineIds;
  let emailTargets = contacts.emails;
  
  const reporterName = reporterNameOverride || dataObj?.reporter || dataObj?.borrower || null;
  
  if (reporterName) {
    const reporter = getReporterContacts(reporterName);
    if (reporter.lineId && (reporter.lineId.startsWith('U') || reporter.lineId.startsWith('C') || reporter.lineId.startsWith('R')) && !lineTargets.includes(reporter.lineId)) {
      lineTargets.push(reporter.lineId);
    }
    if (reporter.email && reporter.email.includes('@') && !emailTargets.includes(reporter.email)) {
      emailTargets.push(reporter.email);
    }
  }
  
  // ปิด Broadcast ชั่วคราว ให้แจ้งเตือนเข้ากลุ่มอย่างเดียว
  // if (!lineTargets.includes('BROADCAST')) { lineTargets.push('BROADCAST'); }
  
  if (lineTargets.length > 0 && lineMsg) {
    sendLineMessage(lineMsg, lineTargets);
  }
  
  if (emailTargets.length > 0 && emailTitle) {
    const emailHtml = generateEmailHtml(
      emailTitle, 
      emailColor, 
      reporterName, 
      dataObj?.loc || null, 
      dataObj?.subject || dataObj?.borrower || 'System Update', 
      dataObj?.detail || dataObj?.status || 'มีการอัปเดตข้อมูล'
    );
    // sendEmailNotification(emailTitle, emailHtml, emailTargets);
  }
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
  const itSheet = db.getSheetByName(CONFIG.IT_SHEET_NAME);
  const avRepSheet = db.getSheetByName(CONFIG.AV_REPAIR_SHEET_NAME);
  const projSheet = db.getSheetByName(CONFIG.PROJECT_SHEET_NAME);
  
  const filterByMonth = (data) => {
    if (!monthStr) return data;
    return data.filter(r => {
      if (!r[0]) return false;
      const dateStr = r[0].toString().split(' ')[0];
      if (dateStr.includes('/')) {
        const parts = dateStr.split('/');
        if (parts.length === 3) {
          const ym = parts[2] + "-" + parts[1].padStart(2, '0');
          if (ym === monthStr) return true;
        }
      } else {
        const d = new Date(r[0]);
        if (!isNaN(d.getTime())) {
          const ym = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, '0');
          if (ym === monthStr) return true;
        }
      }
      return false;
    });
  };

  const calcRating = (filteredData) => {
    let sum = 0;
    let count = 0;
    filteredData.forEach(r => {
      const rating = parseInt(r[18]); // Col S is index 18
      if (!isNaN(rating) && rating > 0) {
        sum += rating;
        count++;
      }
    });
    return {
      avg: count > 0 ? (sum / count).toFixed(1) : "0.0",
      count: count
    };
  };

  const bData = bSheet ? bSheet.getDataRange().getValues().slice(1) : [];
  const filteredBData = filterByMonth(bData);
  const building = {
    total:      filteredBData.length,
    pending:    filteredBData.filter(r => r[4] === "รอดำเนินการ").length,
    inProgress: filteredBData.filter(r => r[4] === "กำลังดำเนินการ").length,
    completed:  filteredBData.filter(r => r[4] === "เสร็จสิ้น").length,
    rating:     calcRating(filteredBData)
  };

  const avData = avSheet ? avSheet.getDataRange().getValues().slice(1) : [];
  const filteredAVData = filterByMonth(avData);
  const av = {
    total:     filteredAVData.length,
    pending:   filteredAVData.filter(r => r[5] === "รอยืนยันการยืม").length,
    active:    filteredAVData.filter(r => r[5] === "กำลังใช้งาน" || r[5] === "จัดเตรียมแล้ว").length,
    completed: filteredAVData.filter(r => r[5] === "เสร็จสิ้น/คืนเรียบร้อย").length,
    rating:    calcRating(filteredAVData)
  };

  const itData = itSheet ? itSheet.getDataRange().getValues().slice(1) : [];
  const filteredITData = filterByMonth(itData);
  const it = {
    total:     filteredITData.length,
    pending:   filteredITData.filter(r => r[4] === "รอดำเนินการ").length,
    inProgress: filteredITData.filter(r => r[4] === "กำลังดำเนินการ").length,
    completed: filteredITData.filter(r => r[4] === "เสร็จสิ้น").length,
    rating:    calcRating(filteredITData)
  };

  const avRepData = avRepSheet ? avRepSheet.getDataRange().getValues().slice(1) : [];
  const filteredAVRepData = filterByMonth(avRepData);
  const avRep = {
    total:     filteredAVRepData.length,
    pending:   filteredAVRepData.filter(r => r[4] === "รอดำเนินการ").length,
    inProgress: filteredAVRepData.filter(r => r[4] === "กำลังดำเนินการ").length,
    completed: filteredAVRepData.filter(r => r[4] === "เสร็จสิ้น").length,
    rating:    calcRating(filteredAVRepData)
  };

  const projData = projSheet ? projSheet.getDataRange().getValues().slice(1) : [];
  const filteredProjData = filterByMonth(projData);
  const proj = {
    total:     filteredProjData.length,
    pending:   filteredProjData.filter(r => r[4] === "รอพิจารณาอนุมัติ").length,
    inProgress: filteredProjData.filter(r => r[4] === "กำลังดำเนินการ").length,
    completed: filteredProjData.filter(r => r[4] === "อนุมัติ" || r[4] === "เสร็จสิ้น").length,
    rating:    calcRating(filteredProjData)
  };

  let filteredBugs = 0;
  if (bugSheet) {
    const bugData = bugSheet.getDataRange().getValues().slice(1);
    filteredBugs = filterByMonth(bugData).length;
  }

  return { building, av, it, avRep, proj, bugs: filteredBugs };
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
  const data    = sheet.getDataRange().getValues();
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
  const f5 = getOrCreateSubFolder(CONFIG.FOLDER_IT_REPORT);
  const f6 = getOrCreateSubFolder(CONFIG.FOLDER_AV_REPAIR);
  const f7 = getOrCreateSubFolder(CONFIG.FOLDER_PROJECTS);
  Logger.log("สร้างโฟลเดอร์สำเร็จ:");
  Logger.log("  - " + CONFIG.FOLDER_REPAIR_REPORT + "   " + f1.getId());
  Logger.log("  - " + CONFIG.FOLDER_REPAIR_PROOF  + "   " + f2.getId());
  Logger.log("  - " + CONFIG.FOLDER_DOCUMENTS     + "   " + f3.getId());
  Logger.log("  - " + CONFIG.FOLDER_RECEIPTS      + "   " + f4.getId());
  Logger.log("  - " + CONFIG.FOLDER_IT_REPORT     + "   " + f5.getId());
  Logger.log("  - " + CONFIG.FOLDER_AV_REPAIR     + "   " + f6.getId());
  Logger.log("  - " + CONFIG.FOLDER_PROJECTS      + "   " + f7.getId());
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
    let sheet = ss.getSheetByName(CONFIG.USER_SHEET_NAME);
    
    if (!sheet) {
      sheet = ss.insertSheet('Users');
      sheet.appendRow(['Email', 'Name', 'Role', 'Status', 'ProfilePicture', 'LastLogin']);
      sheet.getRange(1, 1, 1, 6).setFontWeight('bold').setBackground('#f3f4f6');
      sheet.setFrozenRows(1);
    }

    const data = sheet.getDataRange().getValues();
    const now = new Date();

    for (let i = 1; i < data.length; i++) {
      if ((data[i][0] || '').toString().trim().toLowerCase() === (email || '').trim().toLowerCase()) {
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
function sendEmailNotification(subject, bodyHtml, targetEmails) {
  return; // ปิดการแจ้งเตือนอีเมลชั่วคราว
  try {
    let finalEmails = [];
    
    if (targetEmails && Array.isArray(targetEmails) && targetEmails.length > 0) {
      finalEmails = targetEmails;
    } else {
      const db = getDB();
      const sheet = db.getSheetByName(CONFIG.USER_SHEET_NAME);
      if (!sheet) return;
      
      const data = sheet.getDataRange().getValues();
      for (let i = 1; i < data.length; i++) {
        const email = (data[i][0] || '').toString().trim();
        const role = (data[i][2] || '').toString().trim().toLowerCase();
        
        if (role === 'admin' || role === 'staff' || role === 'technician' || role === 'tech' || role === 'executive') {
          if (email && email.includes('@')) {
            finalEmails.push(email);
          }
        }
      }
    }
    
    // Remove duplicates
    finalEmails = [...new Set(finalEmails)];
    
    if (finalEmails.length > 0) {
      // MailApp block disabled
    }
  } catch(e) {
    Logger.log("Email error: " + e.message);
  }
}

function getUserEmailByName(name) {
  try {
    const db = getDB();
    const sheet = db.getSheetByName(CONFIG.USER_SHEET_NAME);
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
    const sheet = db.getSheetByName(CONFIG.USER_SHEET_NAME);
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
    const sheet = db.getSheetByName(CONFIG.USER_SHEET_NAME);
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
    let sheet = ss.getSheetByName(CONFIG.USER_SHEET_NAME);
    
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
    
    let allResponses = [];
    const isBroadcast = validTargets.includes('BROADCAST');
    const msgPayload = typeof message === 'string' ? { "type": "text", "text": message } : message;

    // Sanitize Flex Message to prevent Line API crashes (empty strings or non-string values)
    function sanitizeFlex(obj) {
      if (Array.isArray(obj)) {
        obj.forEach(sanitizeFlex);
      } else if (typeof obj === 'object' && obj !== null) {
        for (let key in obj) {
          if (key === 'text' || key === 'altText') {
            if (obj[key] === undefined || obj[key] === null || obj[key] === '') {
              obj[key] = '-';
            } else {
              obj[key] = String(obj[key]);
            }
          } else {
            sanitizeFlex(obj[key]);
          }
        }
      }
    }
    sanitizeFlex(msgPayload);

    if (isBroadcast) {
      try {
        const res = UrlFetchApp.fetch("https://api.line.me/v2/bot/message/broadcast", {
          method: "post",
          headers: headers,
          payload: JSON.stringify({ "messages": [msgPayload] }),
          muteHttpExceptions: true
        });
        allResponses.push(`[Broadcast] ${res.getResponseCode()}: ${res.getContentText()}`);
      } catch (e) {
        allResponses.push(`[Broadcast Error] ${e.message}`);
      }
    }

    // ถ้า Broadcast แล้ว ไม่ต้องส่งหา User ส่วนตัวทีละคนอีก (ป้องกันการส่งซ้ำ)
    const userIds = isBroadcast ? [] : validTargets.filter(id => id.startsWith('U') && id !== 'BROADCAST');
  
    // ส่วน Group (C... หรือ R...) ต้องส่งแยกเสมอ เพราะ Broadcast ไม่เข้ากลุ่ม!
    const groupIds = validTargets.filter(id => !id.startsWith('U') && id !== 'BROADCAST');

    // Sanitize Flex Message to prevent Line API crashes (empty strings or non-string values)
    function sanitizeFlex(obj) {
      if (Array.isArray(obj)) {
        obj.forEach(sanitizeFlex);
      } else if (typeof obj === 'object' && obj !== null) {
        for (let key in obj) {
          if (key === 'text' || key === 'altText') {
            if (obj[key] === undefined || obj[key] === null || obj[key] === '') {
              obj[key] = '-';
            } else {
              obj[key] = String(obj[key]);
            }
          } else {
            sanitizeFlex(obj[key]);
          }
        }
      }
    }
    sanitizeFlex(msgPayload);

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
              { "type": "button", "style": "primary", "color": "#dc2626", "action": { "type": "uri", "label": "เข้าสู่ระบบ", "uri": CONFIG.WEB_APP_URL } }
            ]
          }
        }
      };
      notifyTask('building', msg, 'แจ้งเตือนงานเกินกำหนด', '#f43f5e', null, null);
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
              { "type": "button", "style": "primary", "color": "#dc2626", "action": { "type": "uri", "label": "เข้าสู่ระบบ", "uri": CONFIG.WEB_APP_URL } }
            ]
          }
        }
      };
      notifyTask('building', msg, 'แจ้งเตือนงานเกินกำหนด', '#f43f5e', null, null);
    }
  }
}




// ============================================================
// Phase B: ฟังก์ชันตัวช่วยนับงานค้าง (helper) + refactored checkOverdueTasks
// + setupDailyTrigger / removeDailyTrigger
// ============================================================

function _countOverdueTasks(sheet, statusCol, pendingStatuses, overdueDays) {
  if (!sheet) return 0;
  var data = sheet.getDataRange().getValues();
  var now = new Date();
  now.setHours(0, 0, 0, 0);
  var count = 0;
  for (var i = 1; i < data.length; i++) {
    var status = (data[i][statusCol] || '').toString().trim();
    if (pendingStatuses.indexOf(status) < 0) continue;
    var dateStr = (data[i][0] || '').toString().split(' ')[0];
    if (!dateStr) continue;
    var parts = dateStr.split('/');
    if (parts.length !== 3) continue;
    var taskDate = new Date(parts[2] + '-' + parts[1] + '-' + parts[0]);
    if (isNaN(taskDate.getTime())) continue;
    taskDate.setHours(0, 0, 0, 0);
    var diffDays = Math.round((now - taskDate) / (1000 * 60 * 60 * 24));
    if (diffDays >= overdueDays) count++;
  }
  return count;
}

function checkOverdueTasksV2() {
  var db = getDB();
  var overdueDays = 3;
  var sheetSettings = db.getSheetByName('Settings');
  if (sheetSettings) {
    var settingsData = sheetSettings.getDataRange().getValues();
    for (var s = 1; s < settingsData.length; s++) {
      if (settingsData[s][0] === 'overdue_days') {
        overdueDays = parseInt(settingsData[s][1]) || 3;
        break;
      }
    }
  }
  var pendingAll = ['รอดำเนินการ', 'กำลังดำเนินการ', 'กำลังแก้ไข'];
  var repCount   = _countOverdueTasks(db.getSheetByName(CONFIG.SHEET_NAME),           4, ['รอดำเนินการ'], overdueDays);
  var avCount    = _countOverdueTasks(db.getSheetByName(CONFIG.AV_SHEET_NAME),         5, ['รอยืนยันการยืม'], overdueDays);
  var itCount    = _countOverdueTasks(db.getSheetByName(CONFIG.IT_SHEET_NAME),         4, pendingAll, overdueDays);
  var avRepCount = _countOverdueTasks(db.getSheetByName(CONFIG.AV_REPAIR_SHEET_NAME),  4, pendingAll, overdueDays);
  var projCount  = _countOverdueTasks(db.getSheetByName(CONFIG.PROJECT_SHEET_NAME),    4, pendingAll, overdueDays);
  var totalOverdue = repCount + avCount + itCount + avRepCount + projCount;
  if (totalOverdue === 0) { Logger.log('checkOverdueTasksV2: ไม่มีงานค้าง'); return; }
  var details = [];
  if (repCount   > 0) details.push({ label: '🏢 ซ่อมอาคาร', value: repCount   + ' งาน' });
  if (avCount    > 0) details.push({ label: '🎤 ยืมโสตฯ',   value: avCount    + ' งาน' });
  if (itCount    > 0) details.push({ label: '💻 ซ่อมไอที',  value: itCount    + ' งาน' });
  if (avRepCount > 0) details.push({ label: '🔧 ซ่อมโสตฯ', value: avRepCount + ' งาน' });
  if (projCount  > 0) details.push({ label: '🏗️ โครงการ',   value: projCount  + ' งาน' });
  var overdueMsg = createFlexMessageTemplate(
    'แจ้งเตือน: มีงานค้าง ' + totalOverdue + ' รายการ',
    '🔔 แจ้งเตือนงานค้างประจำวัน',
    'มีงานค้างเกิน ' + overdueDays + ' วัน รวม ' + totalOverdue + ' รายการ',
    '#dc2626',
    details,
    [{ label: '👉 เข้าสู่ระบบเพื่อตรวจสอบ', url: CONFIG.WEB_APP_URL, color: '#dc2626' }]
  );
  notifyTask('building', overdueMsg, '🔔 งานค้าง ' + totalOverdue + ' รายการ (เกิน ' + overdueDays + ' วัน)', '#dc2626', null, null);
  Logger.log('checkOverdueTasksV2: แจ้งเตือนงานค้าง ' + totalOverdue + ' รายการ');
}

function setupDailyTrigger() {
  ScriptApp.getProjectTriggers().forEach(function(t) {
    if (t.getHandlerFunction() === 'checkOverdueTasksV2') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('checkOverdueTasksV2').timeBased().everyDays(1).atHour(7).create();
  Logger.log('setupDailyTrigger: Trigger ตั้งเวลา - รันทุกวัน 07:00 น.');
  SpreadsheetApp.getUi().alert('✅ ตั้งค่า Trigger สำเร็จ!\nระบบจะแจ้งเตือนงานค้างทุกวันเวลา 07:00 น. ผ่าน LINE');
}

function removeDailyTrigger() {
  var count = 0;
  ScriptApp.getProjectTriggers().forEach(function(t) {
    if (t.getHandlerFunction() === 'checkOverdueTasksV2') { ScriptApp.deleteTrigger(t); count++; }
  });
  Logger.log('removeDailyTrigger: ลบ trigger ' + count + ' รายการ');
}







