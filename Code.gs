// ============================================================================
// ResourceHub (FaCiLiTy) - Google Apps Script Backend
// พัฒนาโดย: Taohx_dz_parinya | UI Design: Dream_Patipat | AI Assistant: Antigravity
// ============================================================================

// [Optimization] แปลง Date ใน JSON ให้ตรงกับรูปแบบ getDisplayValues() ของ Google Sheets
Date.prototype.toJSON = function() {
  return Utilities.formatDate(this, Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm:ss");
};

// ============================================================================
// 📦 หมวดที่ 1: การตั้งค่าระบบหลัก (Configuration & Constants)
// ============================================================================
const CLIENT_ID = '309538362014-2mn08g13ht4rnjj9e8j52r5c7204lsqu.apps.googleusercontent.com';

const CONFIG = {
  // ── ID ของ Google Spreadsheet ฐานข้อมูลหลัก ──────────────────────────────
  SHEET_ID: "1i-XQ0lO571tIX7RvQR51V2AjuXrEwLfJP7Z7b8xuYDM",
  
  // ── ชื่อแท็บชีตต่างๆ ───────────────────────────────────────────────────
  SHEET_NAME: "Tasks",                 // งานซ่อมอาคารสถานที่ทั่วไป
  AV_SHEET_NAME: "AV_Requests",        // งานขอยืมอุปกรณ์โสตฯ
  BUG_SHEET_NAME: "System_Reports",    // รายงานแจ้งปัญหาในระบบ
  USER_SHEET_NAME: "Users",            // รายชื่อและสิทธิ์ผู้ใช้งาน
  MASTER_LOC_SHEET: "Master_Locations",// ข้อมูลหลัก: รายชื่อสถานที่
  MASTER_PROJ_SHEET: "Master_Projects", // ข้อมูลหลัก: รายชื่อโครงการ
  MASTER_MECH_SHEET: "Master_Mechanics",// ข้อมูลหลัก: รายชื่อช่างภายนอก
  DOC_SHEET_NAME: "Documents",         // คลังเอกสารระบบ
  IT_SHEET_NAME: "IT_Repairs",         // งานแจ้งซ่อมไอที
  AV_REPAIR_SHEET_NAME: "AV_Repairs",  // งานแจ้งซ่อมอุปกรณ์โสตฯ
  PROJECT_SHEET_NAME: "Facility_Projects", // เอกสารโครงการระยะยาว

  // ── โฟลเดอร์หลักใน Google Drive (Root Folder) ──────────────────────────
  ROOT_FOLDER_ID: "1tkOHFwH4MC-eA_eNLThTcLVF3CRHQUXT",

  // ── โฟลเดอร์ย่อยที่จะสร้างและจัดเก็บไฟล์รูป/เอกสารอัตโนมัติ ───────────────
  FOLDER_REPAIR_REPORT: "รูปภาพแจ้งซ่อม",       // รูปที่ผู้แจ้งส่งมาตอนแจ้งซ่อมอาคาร
  FOLDER_REPAIR_PROOF:  "รูปภาพผลการซ่อม",       // รูปที่ช่างแนบส่งตอนปิดงาน
  FOLDER_DOCUMENTS:     "เอกสารระบบ",             // เอกสารในระบบจัดการเอกสาร
  FOLDER_RECEIPTS:      "เอกสารใบเสร็จ",          // ใบเสร็จเบิกจ่าย / ใบเสนอราคา
  FOLDER_IT_REPORT:     "รูปภาพแจ้งซ่อมไอที",     // รูปแจ้งซ่อมอุปกรณ์ไอที
  FOLDER_AV_REPAIR:     "รูปภาพซ่อมโสตฯ",         // รูปแจ้งซ่อมอุปกรณ์โสตฯ
  FOLDER_PROJECTS:      "เอกสารโครงการระยะยาว",   // เอกสารประกอบโครงการ

  // ── การตั้งค่า LINE Messaging API ──────────────────────────────────────
  LINE_CHANNEL_ACCESS_TOKEN: "/m/tnS6KiDY+44jNQDWM2LOTR2pX0qmiA7RT23sE7rGQjTSTcp3TpNlXJYootWAJCYogsOY/KEW4s3Ex5in2tKeaHTbT3l3f2Ro2ROefSj8tNk8yh6FRkH4ccnNGSr1Lx/O6/+b1cFIm9sLRLa2SQAdB04t89/1O/w1cDnyilFU=",
  LINE_TARGET_ID: "C3b2a8a52adb5fa219ec51bb7fda15d5e", // รหัส Group ID ของ LINE กลุ่มหลัก
  LIFF_ID: "2011401549-8xNgb1CC",                      // LIFF ID สำหรับ LINE Login
  WEB_APP_URL: "https://parinyabtc69-txohu-dzwz.github.io/FaCiLiTy/", // URL เว็บไซต์ Frontend
};

// ── เปิด/ปิด การแจ้งเตือนเข้า LINE กลุ่มหลัก (true = เปิด, false = ปิด) ───────
var ENABLE_LINE_GROUP_NOTIFY = (typeof ENABLE_LINE_GROUP_NOTIFY !== 'undefined') ? ENABLE_LINE_GROUP_NOTIFY : true;

// ── การเชื่อมต่อ Database (Cache instance ในการรันเดียวกัน) ───────────────────
let _globalDB = null;
function getDB() {
  if (!_globalDB) _globalDB = SpreadsheetApp.openById(CONFIG.SHEET_ID);
  return _globalDB;
}

// ── ตัวช่วยส่งข้อมูลกลับในรูปแบบ JSON (DRY Helper) ───────────────────────────
function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ── ตัวช่วยคำนวณตำแหน่งแถวของชีต (รองรับชีตที่เรียงลำดับกลับด้าน) ──────────────
function calculateTargetRow(sheet, sheetName, rowIndex) {
  const isReversed = (sheetName !== CONFIG.SHEET_NAME && sheetName !== CONFIG.AV_SHEET_NAME);
  if (isReversed) {
    const totalRows = sheet.getDataRange().getValues().length;
    return totalRows - rowIndex;
  }
  return rowIndex + 2;
}

// ── อ่านค่าคอนฟิกจากชีต Settings (เช่น จำนวนวันนับงานค้าง) ─────────────────────
function getSettingValue(key, defaultVal) {
  try {
    const db = getDB();
    const sheet = db.getSheetByName('Settings');
    if (!sheet) return defaultVal;
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]).trim() === key) {
        return data[i][1] !== undefined ? data[i][1] : defaultVal;
      }
    }
  } catch (e) {
    Logger.log("getSettingValue error: " + e.message);
  }
  return defaultVal;
}

// ============================================================================
// ⚡ หมวดที่ 2: ระบบจัดการแคชและการทำงานเบื้องหลัง (Cache & Keep-Alive)
// ============================================================================
const CACHE_TTL = 120; // แคชข้อมูล 120 วินาที (2 นาที)

// ดึงข้อมูลจาก CacheService ถ้าไม่มีค่อยดึงจากชีตจริง
function getCachedOrFetch(cacheKey, fetchFn) {
  try {
    const cache = CacheService.getScriptCache();
    const cached = cache.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const data = fetchFn();
    try {
      const serialized = JSON.stringify(data);
      if (serialized.length < 100000) { // ไม่เกิน 100KB ตามขีดจำกัดของ CacheService
        cache.put(cacheKey, serialized, CACHE_TTL);
      }
    } catch(se) { Logger.log('Cache put error: ' + se.message); }
    return data;
  } catch(e) {
    Logger.log('Cache error: ' + e.message);
    return fetchFn();
  }
}

// เคลียร์แคชเมื่อมีการอัปเดตหรือเพิ่มข้อมูลใหม่
function invalidateDataCaches(action) {
  try {
    const cache = CacheService.getScriptCache();
    let keysToRemove = [];
    
    if (action) {
      if (action.includes('master_')) keysToRemove.push('master_data');
      else if (action.includes('av_status') || action === 'submit_av') keysToRemove.push('av_requests');
      else if (action.includes('adv_task') || action.includes('_it') || action.includes('_project') || action.includes('_av_repair')) keysToRemove.push('adv_tasks');
      else if (action.includes('task') || action === 'submit_repair') keysToRemove.push('tasks');
      else keysToRemove.push('tasks', 'av_requests', 'adv_tasks', 'master_data');
    } else {
      keysToRemove.push('tasks', 'av_requests', 'adv_tasks', 'master_data');
    }

    // ล้างแคชแดชบอร์ด
    keysToRemove.push('dashboard_');
    const now = new Date();
    for (let i = 0; i < 3; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      keysToRemove.push('dashboard_' + d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'));
    }
    cache.removeAll(keysToRemove);
  } catch(e) {
    Logger.log('Cache invalidation error: ' + e.message);
  }
}

// Keep-Alive ป้องกัน Google Apps Script เข้าสู่โหมด Cold Start
function keepAlive() {
  const db = getDB();
  const sheet = db.getSheets()[0];
  console.log('KeepAlive ping OK - ' + new Date().toLocaleString() + ' | Sheet: ' + (sheet ? sheet.getName() : 'ok'));
}

function setupKeepAliveTrigger() {
  ScriptApp.getProjectTriggers().forEach(t => {
    if (t.getHandlerFunction() === 'keepAlive') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('keepAlive').timeBased().everyMinutes(10).create();
  console.log('keepAlive Trigger ตั้งค่าเรียบร้อย - ทุก 10 นาที');
}

// รองรับ CORS Preflight
function doOptions(e) {
  return ContentService.createTextOutput("").setMimeType(ContentService.MimeType.TEXT);
}

// ============================================================================
// 🌐 หมวดที่ 3: ระบบจัดเส้นทาง API ฝั่ง GET (doGet Router)
// ============================================================================
function doGet(e) {
  if (!e || !e.parameter || !e.parameter.action) {
    return ContentService.createTextOutput("พร้อมใช้งานแล้ว").setMimeType(ContentService.MimeType.TEXT);
  }

  const action = e.parameter.action;
  const db = getDB();

  try {
    switch (action) {
      // 1. ดึงงานซ่อมอาคารทั่วไป
      case 'get_tasks': {
        const result = getCachedOrFetch('tasks', () => {
          const sheet = db.getSheetByName(CONFIG.SHEET_NAME);
          return sheet ? sheet.getDataRange().getValues().slice(1) : [];
        });
        return jsonResponse(result);
      }
      
      // 2. ดึงรายการขอยืมอุปกรณ์โสตฯ
      case 'get_av_requests': {
        const result = getCachedOrFetch('av_requests', () => {
          const sheet = db.getSheetByName(CONFIG.AV_SHEET_NAME);
          return sheet ? sheet.getDataRange().getValues().slice(1) : [];
        });
        return jsonResponse(result);
      }

      // 3. ดึงข้อมูลสรุปแดชบอร์ด
      case 'get_dashboard': {
        const monthParam = e.parameter.month || '';
        const dashKey = 'dashboard_' + monthParam;
        const dashData = getCachedOrFetch(dashKey, () => getDashboardDataInternal(monthParam));
        return jsonResponse(dashData);
      }

      // 4. ดึงข้อมูลหลัก (Master Data: สถานที่, โครงการ, ช่าง)
      case 'get_master_data':
        return jsonResponse(getCachedOrFetch('master_data', getMasterDataInternal));

      // 5. ดึงรายการเอกสารระบบ
      case 'get_documents': {
        const result = getCachedOrFetch('documents', () => {
          const sheet = db.getSheetByName(CONFIG.DOC_SHEET_NAME);
          return sheet ? sheet.getDataRange().getValues().slice(1) : [];
        });
        return jsonResponse(result);
      }

      // 6. ดึงรายชื่อผู้ใช้งานทั้งหมด
      case 'get_users': {
        const sheet = db.getSheetByName(CONFIG.USER_SHEET_NAME);
        const result = sheet ? sheet.getDataRange().getValues().slice(1) : [];
        return jsonResponse(result);
      }

      // 7. ดึงงานขั้นสูง (IT, ซ่อมโสตฯ, โครงการ)
      case 'get_adv_tasks': {
        const result = getCachedOrFetch('adv_tasks', () => {
          let itData = [], avRepData = [], projData = [];
          const sIt = db.getSheetByName(CONFIG.IT_SHEET_NAME);
          if (sIt) { const v = sIt.getDataRange().getValues(); if (v.length > 1) itData = v.slice(1); }
          const sAvRep = db.getSheetByName(CONFIG.AV_REPAIR_SHEET_NAME);
          if (sAvRep) { const v = sAvRep.getDataRange().getValues(); if (v.length > 1) avRepData = v.slice(1); }
          const sProj = db.getSheetByName(CONFIG.PROJECT_SHEET_NAME);
          if (sProj) { const v = sProj.getDataRange().getValues(); if (v.length > 1) projData = v.slice(1); }
          return { it: itData.reverse(), av: avRepData.reverse(), project: projData.reverse() };
        });
        return jsonResponse(result);
      }

      default:
        return jsonResponse([]);
    }
  } catch(err) {
    return jsonResponse({ error: err.message });
  }
}

// ============================================================================
// 🌐 หมวดที่ 4: ระบบจัดเส้นทาง API ฝั่ง POST (doPost Router)
// ============================================================================
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonResponse({ status: 'error', message: 'No payload found' });
    }

    const data = JSON.parse(e.postData.contents);
    const db = getDB();
    const timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm");
    
    // ── ตรวจสอบกรณีเป็น Webhook จาก LINE (พิมพ์คำว่า id ในกลุ่มเพื่อดู Group ID) ─
    if (data.events && Array.isArray(data.events)) {
      data.events.forEach(event => {
        if (event.type === 'message' && event.source && (event.source.type === 'group' || event.source.type === 'room') && event.message.text === 'id') {
          sendLineMessage('Group ID ของกลุ่มนี้คือ:\n' + event.source.groupId, event.source.groupId);
        }
      });
      return ContentService.createTextOutput("OK").setMimeType(ContentService.MimeType.TEXT);
    }
    
    // ── ล้าง Cache เมื่อมีการเปลี่ยนแปลงข้อมูล ──────────────────────────────────
    const noInvalidateActions = ['google_login', 'link_line_account', 'report_bug'];
    if (!noInvalidateActions.includes(data.action)) {
      invalidateDataCaches(data.action);
    }
    
    switch (data.action) {
      // ── ระบบ Login ด้วย Google OAuth ───────────────────────────────────────
      case 'google_login':
        return handleGoogleLogin(data.credential);
        
      // ── เชื่อมโยงบัญชี LINE ────────────────────────────────────────────────
      case 'link_line_account':
        return handleLinkLineAccount(data.email, data.lineId, data.name, data.picture);

      // ── บันทึกแบบประเมินความพึงพอใจ ────────────────────────────────────────
      case 'submit_survey': {
        let surveySheetName = '';
        let surveyTypeLabel = '';
        if (data.type === 'repair') { surveySheetName = CONFIG.SHEET_NAME; surveyTypeLabel = 'งานซ่อมอาคาร'; }
        else if (data.type === 'it_repair') { surveySheetName = CONFIG.IT_SHEET_NAME; surveyTypeLabel = 'งานซ่อมไอที'; }
        else if (data.type === 'av') { surveySheetName = CONFIG.AV_SHEET_NAME; surveyTypeLabel = 'งานยืมโสตฯ'; }
        else if (data.type === 'av_repair') { surveySheetName = CONFIG.AV_REPAIR_SHEET_NAME; surveyTypeLabel = 'งานซ่อมโสตฯ'; }
        
        if (surveySheetName) {
          const surveySheet = db.getSheetByName(surveySheetName);
          if (surveySheet) {
            surveySheet.getRange(data.row, 19).setValue(data.rating); // Col S = Rating
            surveySheet.getRange(data.row, 20).setValue(data.comment || ""); // Col T = Comment
            
            const starText = '⭐'.repeat(Number(data.rating) || 0);
            const surveyNotifMsg = createFlexMessageTemplate(
              `ผลประเมินใหม่: ${data.rating}/5 ดาว (${surveyTypeLabel})`,
              "⭐ ผลประเมินความพึงพอใจ",
              surveyTypeLabel,
              "#f59e0b",
              [
                { label: "คะแนนที่ได้", value: `${data.rating} / 5 ดาว (${starText})` },
                { label: "ความคิดเห็น", value: data.comment || "ไม่มีข้อคิดเห็นเพิ่มเติม" }
              ],
              null,
              null
            );
            notifyTask('admin', surveyNotifMsg, `⭐ มีผลประเมินใหม่: ${data.rating}/5 ดาว`, '#f59e0b', {reporter: 'ผู้ใช้งาน', subject: surveyTypeLabel}, null);
          }
        }
        return jsonResponse({ status: 'success' });
      }

      // ── แจ้งซ่อมอาคารสถานที่ใหม่ ───────────────────────────────────────────
      case 'submit_repair': {
        const sheetRep = db.getSheetByName(CONFIG.SHEET_NAME);
        const repFileUrl = uploadFileToDrive(data.file, CONFIG.FOLDER_REPAIR_REPORT);
        sheetRep.appendRow([timestamp, data.subject, data.detail, data.reporter, "รอดำเนินการ", repFileUrl, "", "", "", "", "", data.urgency || "", data.dept || "", data.loc || "", data.incidentDate || "", data.contact || ""]);
        
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
          ],
          null,
          data.ticketId
        );
        notifyTask('building', lineRepMsg, `🚨 แจ้งซ่อมอาคารสถานที่ใหม่`, '#265D5A', data, null);
        break;
      }

      // ── แจ้งซ่อมระบบ IT ใหม่ ──────────────────────────────────────────────
      case 'submit_it_repair': {
        let sheetIt = db.getSheetByName(CONFIG.IT_SHEET_NAME) || db.insertSheet(CONFIG.IT_SHEET_NAME);
        if (sheetIt.getLastRow() === 0) {
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
          ],
          null,
          data.ticketId
        );
        notifyTask('it', lineItMsg, `💻 แจ้งปัญหาไอทีใหม่`, '#0ea5e9', data, null);
        break;
      }

      // ── แจ้งซ่อมอุปกรณ์โสตฯ ใหม่ ────────────────────────────────────────────
      case 'submit_av_repair': {
        let sheetAvRep = db.getSheetByName(CONFIG.AV_REPAIR_SHEET_NAME) || db.insertSheet(CONFIG.AV_REPAIR_SHEET_NAME);
        if (sheetAvRep.getLastRow() === 0) {
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
          ],
          null,
          data.ticketId
        );
        notifyTask('av_repair', lineAvRepMsg, `📷 แจ้งซ่อมอุปกรณ์โสตฯ ใหม่`, '#f59e0b', data, null);
        break;
      }

      // ── แจ้งโครงการระยะยาว / จัดซื้อ ───────────────────────────────────────
      case 'submit_project': {
        let sheetProjData = db.getSheetByName(CONFIG.PROJECT_SHEET_NAME) || db.insertSheet(CONFIG.PROJECT_SHEET_NAME);
        if (sheetProjData.getLastRow() === 0) {
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
          null,
          data.ticketId
        );
        notifyTask('project', lineProjMsg, `🏢 เสนอโครงการ / จัดซื้อใหม่`, '#8b5cf6', data, null);
        break;
      }

      // ── ขอยืมอุปกรณ์โสตทัศนูปกรณ์ ──────────────────────────────────────────
      case 'submit_av': {
        const sheetAvReq = db.getSheetByName(CONFIG.AV_SHEET_NAME);
        sheetAvReq.appendRow([timestamp, data.borrower, data.equipment, data.useDate, data.location, "รอยืนยันการยืม", "-", data.signature]);
        
        const lineAvMsg = createFlexMessageTemplate(
          `แจ้งยืมโสตฯ: ${data.borrower}`,
          "📢 ขอยืมอุปกรณ์โสตฯ",
          data.equipment,
          "#0d9488",
          [
            { label: "ผู้ยืม", value: data.borrower },
            { label: "วันที่", value: data.useDate },
            { label: "สถานที่", value: data.location }
          ],
          null,
          data.ticketId
        );
        notifyTask('av', lineAvMsg, `🎤 แจ้งยืมอุปกรณ์โสตฯ ใหม่`, '#0d9488', data, null);
        break;
      }

      // ── แจ้งปัญหาระบบ (Bug) ────────────────────────────────────────────────
      case 'report_bug': {
        const sheetBug = db.getSheetByName(CONFIG.BUG_SHEET_NAME);
        sheetBug.appendRow([timestamp, data.reporter, data.issue, data.page, "รอดำเนินการ"]);
        const lineBugMsg = createFlexMessageTemplate(
          `รายงานบั๊ก: ${data.issue}`,
          "🐞 พบปัญหาในระบบ",
          data.issue,
          "#ef4444",
          [
            { label: "ผู้รายงาน", value: data.reporter },
            { label: "หน้าที่พบ", value: data.page }
          ],
          null,
          null
        );
        notifyTask('bug', lineBugMsg, `🐞 แจ้งปัญหาระบบใหม่`, '#ef4444', data, null);
        break;
      }

      // ── เพิ่มเติมรายละเอียดงานซ่อม ─────────────────────────────────────────
      case 'append_task_details': {
        const sheet = db.getSheetByName(CONFIG.SHEET_NAME);
        sheet.getRange(data.rowIndex + 2, 3).setValue(data.newDetails);
        break;
      }

      // ── อัปเดตสถานะงานซ่อม ─────────────────────────────────────────────────
      case 'update_task_status': {
        let statusSheetName = data.sheetName || CONFIG.SHEET_NAME;
        if (statusSheetName === 'Task') statusSheetName = CONFIG.SHEET_NAME;
        const sheet = db.getSheetByName(statusSheetName);
        if (!sheet) return jsonResponse({ status: 'error', message: 'Sheet not found: ' + statusSheetName });

        const statusTargetRow = calculateTargetRow(sheet, statusSheetName, data.rowIndex);

        if (data.status) sheet.getRange(statusTargetRow, 5).setValue(data.status);
        if (data.fixDetail) {
          const detailCol = (statusSheetName === CONFIG.SHEET_NAME) ? 7 : 8;
          sheet.getRange(statusTargetRow, detailCol).setValue(data.fixDetail);
        }
        if (data.technician) {
          const techCol = (statusSheetName === CONFIG.SHEET_NAME) ? 8 : (statusSheetName === CONFIG.AV_SHEET_NAME ? 7 : 9);
          sheet.getRange(statusTargetRow, techCol).setValue(data.technician);
        }
        
        // ถ้าสถานะเปลี่ยนเป็นเสร็จสิ้น แจ้งเตือนผู้แจ้งและกลุ่ม
        if (data.status === 'เสร็จสิ้น') {
          const subjectStr = sheet.getRange(statusTargetRow, 2).getValue();
          const detailStr = sheet.getRange(statusTargetRow, 3).getValue();
          const reporterNameStr = sheet.getRange(statusTargetRow, 4).getValue();
          
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
            ],
            data.ticketId
          );
          notifyTask('building', statusMsg, `อัปเดตสถานะงานซ่อมอาคาร`, '#265D5A', {reporter: reporterNameStr, subject: subjectStr, status: 'เสร็จสิ้น'}, null);
        }
        return jsonResponse({ status: 'success', message: 'อัปเดตสถานะสำเร็จ' });
      }

      // ── อนุมัติ / มอบหมายช่างรับงาน ────────────────────────────────────────
      case 'approve_task': {
        const appSheetName = data.sheetName || CONFIG.SHEET_NAME;
        const sheetApprove = db.getSheetByName(appSheetName);
        if (!sheetApprove) return jsonResponse({ status: 'error', message: 'Sheet not found' });
        
        const approveTargetRow = calculateTargetRow(sheetApprove, appSheetName, data.rowIndex);

        if (data.status) sheetApprove.getRange(approveTargetRow, 5).setValue(data.status);

        if (appSheetName === CONFIG.SHEET_NAME || appSheetName === CONFIG.AV_SHEET_NAME) {
          if (data.technician) sheetApprove.getRange(approveTargetRow, 8).setValue(data.technician);
          if (data.urgency) sheetApprove.getRange(approveTargetRow, 12).setValue(data.urgency);
        } else {
          if (data.technician) sheetApprove.getRange(approveTargetRow, 9).setValue(data.technician);
          if (data.urgency) sheetApprove.getRange(approveTargetRow, 6).setValue(data.urgency);
        }
        
        // แจ้งเตือนช่างที่ได้รับมอบหมาย
        if (data.technician) {
          try {
            const taskSubject = sheetApprove.getRange(approveTargetRow, 2).getValue();
            const taskReporter = sheetApprove.getRange(approveTargetRow, 4).getValue();
            const techEmail = getUserEmailByName(data.technician);
            
            if (techEmail) {
              const emailHtml = generateEmailHtml(
                "👷 แจ้งมอบหมายงาน",
                "#f59e0b",
                taskReporter,
                null,
                taskSubject,
                "มีการมอบหมายงานให้คุณ กรุณาตรวจสอบในระบบ<br>ความเร่งด่วน: " + (data.urgency || "-")
              );
              MailApp.sendEmail({
                to: techEmail,
                subject: "แจ้งมอบหมายงาน: " + taskSubject,
                htmlBody: emailHtml
              });
            }
            
            const assignMsg = createFlexMessageTemplate(
              "มีการมอบหมายงานให้: " + data.technician,
              "👷 แจ้งมอบหมายงาน",
              taskSubject,
              "#f59e0b",
              [
                { label: "ช่างที่รับผิดชอบ", value: data.technician, flexLabel: 4, flexValue: 4 },
                { label: "ความเร่งด่วน", value: data.urgency || "-", flexLabel: 4, flexValue: 4 }
              ],
              null,
              data.ticketId
            );
            notifyTask('building', assignMsg, null, null, null, null);
          } catch(e) { Logger.log("Error notifying tech: " + e.message); }
        }

        return jsonResponse({ status: 'success' });
      }

      // ── แก้ไขการมอบหมายช่าง ───────────────────────────────────────────────
      case 'edit_assignment': {
        let editSheetName = data.sheetName || CONFIG.SHEET_NAME;
        if (editSheetName === 'Task') editSheetName = CONFIG.SHEET_NAME;
        const sheetEdit = db.getSheetByName(editSheetName);
        if (!sheetEdit) return jsonResponse({ status: 'error', message: 'Sheet not found: ' + editSheetName });
        
        const editTargetRow = calculateTargetRow(sheetEdit, editSheetName, data.rowIndex);

        if (editSheetName === CONFIG.SHEET_NAME) {
          if (data.technician) sheetEdit.getRange(editTargetRow, 8).setValue(data.technician);
          if (data.urgency) sheetEdit.getRange(editTargetRow, 12).setValue(data.urgency);
        } else if (editSheetName === CONFIG.AV_SHEET_NAME) {
          if (data.technician) sheetEdit.getRange(editTargetRow, 7).setValue(data.technician);
        } else {
          if (data.technician) sheetEdit.getRange(editTargetRow, 9).setValue(data.technician);
          if (data.urgency) sheetEdit.getRange(editTargetRow, 7).setValue(data.urgency);
        }

        if (data.technician) {
          try {
            const taskSubject = sheetEdit.getRange(editTargetRow, 2).getValue();
            const taskReporter = sheetEdit.getRange(editTargetRow, 4).getValue();
            const taskDetail = sheetEdit.getRange(editTargetRow, 3).getValue();
            const techEmail = data.technicianEmail || getUserEmailByName(data.technician);
            
            if (techEmail) {
              const emailHtml = generateEmailHtml(
                "👷 มอบหมายงานซ่อมให้คุณ",
                "#265D5A",
                taskReporter,
                null,
                taskSubject,
                `คุณได้รับมอบหมายงาน: <b>${taskSubject}</b><br>รายละเอียด: ${taskDetail}<br>ความเร่งด่วน: ${data.urgency || 'ตามคิว'}<br>กรุณาตรวจสอบรายละเอียดในระบบ`
              );
              MailApp.sendEmail({
                to: techEmail,
                subject: "🔔 แจ้งเตือนมอบหมายงาน: " + taskSubject,
                htmlBody: emailHtml
              });
            }
            
            const editAssignMsg = createFlexMessageTemplate(
              "มอบหมายงานให้: " + data.technician,
              "👷 เปลี่ยนแปลงช่างรับผิดชอบ",
              taskSubject,
              "#265D5A",
              [
                { label: "ช่างผู้รับผิดชอบ", value: data.technician, flexLabel: 3, flexValue: 5 },
                { label: "ความเร่งด่วน", value: data.urgency || "ทั่วไป", flexLabel: 3, flexValue: 5 }
              ],
              null,
              data.ticketId
            );
            notifyTask('building', editAssignMsg, null, null, null, null);
          } catch(e) { Logger.log("Error notifying tech on edit: " + e.message); }
        }

        return jsonResponse({ status: 'success' });
      }

      // ── อัปเดตงานขั้นสูง (IT, ซ่อมโสตฯ, โครงการ) ──────────────────────────
      case 'update_adv_task': {
        let advSheetName = CONFIG.PROJECT_SHEET_NAME;
        if (data.tabType === 'it') advSheetName = CONFIG.IT_SHEET_NAME;
        else if (data.tabType === 'av-repair' || data.tabType === 'av_repair' || data.tabType === 'av') advSheetName = CONFIG.AV_REPAIR_SHEET_NAME;
        
        const sheetAdv = db.getSheetByName(advSheetName);
        if (!sheetAdv) return jsonResponse({ status: 'error', message: 'Sheet not found' });
        
        const targetAdvRow = calculateTargetRow(sheetAdv, advSheetName, data.rowIndex);
        sheetAdv.getRange(targetAdvRow, 5).setValue(data.status);
        
        if (data.file) {
          const proofUrl = uploadFileToDrive(data.file, CONFIG.FOLDER_REPAIR_PROOF);
          sheetAdv.getRange(targetAdvRow, 7).setValue(proofUrl);
        }
        if (data.fixDetail) sheetAdv.getRange(targetAdvRow, 8).setValue(data.fixDetail);
        if (data.technician) sheetAdv.getRange(targetAdvRow, 9).setValue(data.technician);
        if (data.cost) {
          const advCost = (!isNaN(data.cost) && Number(data.cost) > 0) ? Number(data.cost) : "-";
          sheetAdv.getRange(targetAdvRow, 10).setValue(advCost);
        }
        if (data.receiptFile) {
          const receiptUrlAdv = uploadFileToDrive(data.receiptFile, CONFIG.FOLDER_RECEIPTS);
          sheetAdv.getRange(targetAdvRow, 11).setValue(receiptUrlAdv);
        }
        
        // ส่งแจ้งเตือนเมื่อปิดงาน
        const isDoneStatus = data.status === 'เสร็จสิ้น' || data.status === 'อนุมัติ';
        if (isDoneStatus && data.technician) {
          const advSubject = sheetAdv.getRange(targetAdvRow, 2).getValue();
          const advReporter = sheetAdv.getRange(targetAdvRow, 4).getValue();
          const isIT = data.tabType === 'it';
          const isAVRep = data.tabType === 'av-repair' || data.tabType === 'av_repair' || data.tabType === 'av';
          const surveyType = isIT ? 'it_repair' : (isAVRep ? 'av_repair' : 'project');
          const taskLabel = isIT ? '💻 งานซ่อมไอที' : (isAVRep ? '📷 งานซ่อมโสตฯ' : '📋 โครงการ');
          const advColor = isIT ? '#0ea5e9' : (isAVRep ? '#f59e0b' : '#8b5cf6');
          
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
            ],
            data.ticketId
          );
          notifyTask(isIT ? 'it' : (isAVRep ? 'av_repair' : 'admin'), advDoneMsg, `${taskLabel}เสร็จสิ้น`, advColor, {reporter: advReporter, subject: advSubject, status: data.status}, null);
        }
        
        return jsonResponse({ status: 'success' });
      }

      // ── ลบงานขั้นสูง ───────────────────────────────────────────────────────
      case 'delete_adv_task': {
        let sName = CONFIG.SHEET_NAME;
        if (data.tabType === 'it') sName = CONFIG.IT_SHEET_NAME;
        else if (data.tabType === 'project') sName = CONFIG.PROJECT_SHEET_NAME;
        else if (data.tabType === 'av' || data.tabType === 'av-repair') sName = CONFIG.AV_REPAIR_SHEET_NAME;
        else if (data.tabType === 'av_request') sName = CONFIG.AV_SHEET_NAME;
        
        const sheet = db.getSheetByName(sName);
        if (sheet) {
          const targetRow = calculateTargetRow(sheet, sName, data.rowIndex);
          sheet.deleteRow(targetRow);
        }
        return jsonResponse({ status: 'success' });
      }

      // ── จัดเก็บงานเข้า Archive ─────────────────────────────────────────────
      case 'archive_adv_task': {
        let sName = CONFIG.SHEET_NAME;
        if (data.tabType === 'it') sName = CONFIG.IT_SHEET_NAME;
        else if (data.tabType === 'project') sName = CONFIG.PROJECT_SHEET_NAME;
        else if (data.tabType === 'av' || data.tabType === 'av-repair') sName = CONFIG.AV_REPAIR_SHEET_NAME;
        else if (data.tabType === 'av_request') sName = CONFIG.AV_SHEET_NAME;
        
        const sheet = db.getSheetByName(sName);
        if (sheet) {
          const targetRow = calculateTargetRow(sheet, sName, data.rowIndex);
          const rowData = sheet.getRange(targetRow, 1, 1, sheet.getLastColumn()).getValues()[0];
          let archiveSheet = db.getSheetByName("Archive") || db.insertSheet("Archive");
          archiveSheet.appendRow(rowData);
          sheet.deleteRow(targetRow);
        }
        return jsonResponse({ status: 'success' });
      }

      // ── ปิดงานซ่อมพร้อมแนบรูปหลักฐานและใบเสร็จ ─────────────────────────────
      case 'update_task_proof': {
        const sheetTaskProof = db.getSheetByName(CONFIG.SHEET_NAME);
        const proofVals = sheetTaskProof.getDataRange().getValues();
        const targetRow = proofVals.length - data.rowIndex;
        const proofFileUrl = uploadFileToDrive(data.file, CONFIG.FOLDER_REPAIR_PROOF);
        const receiptUrl = uploadFileToDrive(data.receiptFile, CONFIG.FOLDER_RECEIPTS);
        
        sheetTaskProof.getRange(targetRow, 5).setValue("เสร็จสิ้น");
        sheetTaskProof.getRange(targetRow, 7).setValue(data.fixDetail);
        sheetTaskProof.getRange(targetRow, 8).setValue(data.technician);
        sheetTaskProof.getRange(targetRow, 9).setValue(proofFileUrl);
        
        const cost = (data.cost && !isNaN(data.cost)) ? Number(data.cost) : 0;
        sheetTaskProof.getRange(targetRow, 10).setValue(cost > 0 ? cost : "-");
        sheetTaskProof.getRange(targetRow, 11).setValue(receiptUrl);
        
        const proofSubject = sheetTaskProof.getRange(targetRow, 2).getValue();
        const proofReporter = sheetTaskProof.getRange(targetRow, 4).getValue();
        
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
          ],
          data.ticketId
        );
        
        let advTaskType = 'building';
        let color = '#265D5A';
        if (data.sheetName === CONFIG.IT_SHEET_NAME) { advTaskType = 'it'; color = '#0ea5e9'; }
        else if (data.sheetName === CONFIG.AV_REPAIR_SHEET_NAME) { advTaskType = 'av_repair'; color = '#f59e0b'; }
        else if (data.sheetName === CONFIG.PROJECT_SHEET_NAME) { advTaskType = 'project'; color = '#8b5cf6'; }
        
        notifyTask(advTaskType, proofMsg, `อัปเดตสถานะงาน`, color, {reporter: proofReporter, subject: proofSubject, status: data.status || 'เสร็จสิ้น'}, null);
        break;
      }

      // ── อัปเดตสถานะงานยืมอุปกรณ์โสตฯ ──────────────────────────────────────
      case 'update_av_status': {
        const sheetAvStatus = db.getSheetByName(CONFIG.AV_SHEET_NAME);
        const avTargetRow = data.rowIndex + 2;
        sheetAvStatus.getRange(avTargetRow, 6).setValue(data.status);
        sheetAvStatus.getRange(avTargetRow, 7).setValue(data.technician);
        
        if (data.status === 'เสร็จสิ้น/คืนเรียบร้อย') {
          const avSubject = sheetAvStatus.getRange(avTargetRow, 3).getValue();
          const avReporter = sheetAvStatus.getRange(avTargetRow, 2).getValue();
          const avMsg = createFlexMessageTemplate(
            `คืนอุปกรณ์เรียบร้อย: ${avSubject}`,
            "✅ คืนอุปกรณ์เรียบร้อย",
            avSubject,
            "#059669",
            [{ label: "เจ้าหน้าที่", value: data.technician, flexLabel: 3, flexValue: 5 }],
            [{ label: "⭐ ประเมินความพึงพอใจ", url: CONFIG.WEB_APP_URL + "?action=survey&type=av&row=" + avTargetRow, color: "#f59e0b" }]
          );
          notifyTask('av', avMsg, `อัปเดตสถานะงานยืมโสตฯ`, '#0d9488', {borrower: avReporter, subject: avSubject, status: 'ใช้งานอยู่'}, null);
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
          notifyTask('av', avMsg, `อัปเดตสถานะงานยืมโสตฯ`, '#0d9488', {borrower: avReporter, subject: avSubject, status: 'คืนเรียบร้อย'}, null);
        }
        break;
      }

      // ── เพิ่ม Master Data ─────────────────────────────────────────────────
      case 'master_add': {
        const type = data.type;
        const id = data.id || (type + '_' + new Date().getTime());

        if (type === 'location') {
          let sheetLoc = db.getSheetByName(CONFIG.MASTER_LOC_SHEET) || db.insertSheet(CONFIG.MASTER_LOC_SHEET);
          if (sheetLoc.getLastRow() === 0) sheetLoc.appendRow(['id', 'name', 'department']);
          sheetLoc.appendRow([id, data.name || '', data.department || '']);
        } else if (type === 'project') {
          let sheetProj = db.getSheetByName(CONFIG.MASTER_PROJ_SHEET) || db.insertSheet(CONFIG.MASTER_PROJ_SHEET);
          if (sheetProj.getLastRow() === 0) sheetProj.appendRow(['id', 'name', 'department']);
          sheetProj.appendRow([id, data.name || '', data.department || '']);
        } else if (type === 'mechanic') {
          let sheetMech = db.getSheetByName(CONFIG.MASTER_MECH_SHEET) || db.insertSheet(CONFIG.MASTER_MECH_SHEET);
          if (sheetMech.getLastRow() === 0) sheetMech.appendRow(['id', 'name', 'phone', 'skills', 'notes']);
          sheetMech.appendRow([id, data.name || '', data.phone || '', data.skills || '', data.notes || '']);
        }
        break;
      }

      // ── ลบ Master Data ────────────────────────────────────────────────────
      case 'master_delete': {
        const sheetName = data.type === 'location' ? CONFIG.MASTER_LOC_SHEET 
                        : data.type === 'project'  ? CONFIG.MASTER_PROJ_SHEET 
                        : CONFIG.MASTER_MECH_SHEET;
        deleteRowById(sheetName, 0, data.id);
        break;
      }

      // ── บันทึกการตั้งค่าระบบ (Overdue Days) ────────────────────────────────
      case 'save_overdue_settings': {
        let sheetSettings = db.getSheetByName('Settings') || db.insertSheet('Settings');
        if (sheetSettings.getLastRow() === 0) sheetSettings.appendRow(['Key', 'Value']);
        
        let foundKey = false;
        const settingsData = sheetSettings.getDataRange().getValues();
        for (let i = 1; i < settingsData.length; i++) {
          if (settingsData[i][0] === 'overdue_days') {
            sheetSettings.getRange(i + 1, 2).setValue(data.days);
            foundKey = true;
            break;
          }
        }
        if (!foundKey) sheetSettings.appendRow(['overdue_days', data.days]);
        break;
      }

      // ── เพิ่มเอกสารใหม่เข้าระบบ ──────────────────────────────────────────
      case 'add_document': {
        let sheetAddDoc = db.getSheetByName(CONFIG.DOC_SHEET_NAME) || db.insertSheet(CONFIG.DOC_SHEET_NAME);
        if (sheetAddDoc.getLastRow() === 0) {
          sheetAddDoc.appendRow(['docId', 'category', 'uploadDate', 'docName', 'uploader', 'fileUrl', 'fileExt', 'description']);
        }
        const addDocFileUrl = uploadFileToDrive(data.file, CONFIG.FOLDER_DOCUMENTS);
        sheetAddDoc.appendRow([
          'doc_' + new Date().getTime(),
          data.category || 'ทั่วไป',
          timestamp,
          data.docName || '',
          data.uploader || 'Admin',
          addDocFileUrl,
          data.ext || '',
          data.description || ''
        ]);
        break;
      }

      // ── ลบเอกสาร ──────────────────────────────────────────────────────────
      case 'delete_document':
        deleteRowById(CONFIG.DOC_SHEET_NAME, 0, data.docId);
        break;

      // ── อัปเดตสิทธิ์หรือสถานะผู้ใช้งาน ─────────────────────────────────────
      case 'update_user': {
        const sheetUser = db.getSheetByName(CONFIG.USER_SHEET_NAME);
        if (sheetUser) {
          const values = sheetUser.getDataRange().getValues();
          for (let i = 1; i < values.length; i++) {
            if (String(values[i][0]) === String(data.email)) {
              sheetUser.getRange(i + 1, 3).setValue(data.role);
              sheetUser.getRange(i + 1, 4).setValue(data.status);
              break;
            }
          }
        }
        break;
      }

      default:
        break;
    }

    return jsonResponse({ status: 'success' });

  } catch (err) {
    return jsonResponse({ status: 'error', message: err.message });
  }
}

// ============================================================================
// 📁 หมวดที่ 5: ฟังก์ชันจัดการไฟล์และ Google Drive (File & Drive Helpers)
// ============================================================================

// ค้นหาหรือสร้างโฟลเดอร์ย่อยใน Google Drive
function getOrCreateSubFolder(folderName) {
  const root = DriveApp.getFolderById(CONFIG.ROOT_FOLDER_ID);
  const existing = root.getFoldersByName(folderName);
  if (existing.hasNext()) return existing.next();
  const newFolder = root.createFolder(folderName);
  Logger.log("สร้างโฟลเดอร์ใหม่: " + folderName + " | ID: " + newFolder.getId());
  return newFolder;
}

// อัปโหลดไฟล์ Base64 เข้า Google Drive และเปิดสิทธิ์ดูสาธารณะ
function uploadFileToDrive(fileData, folderName) {
  if (!fileData || !fileData.data) return "-";
  const folder = getOrCreateSubFolder(folderName);
  const blob = Utilities.newBlob(Utilities.base64Decode(fileData.data), fileData.type, fileData.name);
  const file = folder.createFile(blob);
  try { file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch (e) { Logger.log(e); }
  return file.getUrl();
}

// ลบแถวข้อมูลตาม ID ในคอลัมน์ที่กำหนด
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

// สร้างโฟลเดอร์ทั้งหมดล่วงหน้าใน Google Drive
function setupFolders() {
  const folders = [
    CONFIG.FOLDER_REPAIR_REPORT,
    CONFIG.FOLDER_REPAIR_PROOF,
    CONFIG.FOLDER_DOCUMENTS,
    CONFIG.FOLDER_RECEIPTS,
    CONFIG.FOLDER_IT_REPORT,
    CONFIG.FOLDER_AV_REPAIR,
    CONFIG.FOLDER_PROJECTS
  ];
  Logger.log("เริ่มสร้างโฟลเดอร์ระบบ:");
  folders.forEach(fName => {
    const f = getOrCreateSubFolder(fName);
    Logger.log(`  - ${fName} : ${f.getId()}`);
  });
}

// ============================================================================
// 👥 หมวดที่ 6: ระบบผู้ใช้งานและการค้นหาข้อมูล (User Management & Contacts)
// ============================================================================

// เข้าสู่ระบบด้วย Google OAuth
function handleGoogleLogin(credential) {
  try {
    const url = "https://oauth2.googleapis.com/tokeninfo?id_token=" + credential;
    const res = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    if (res.getResponseCode() !== 200) throw new Error("Invalid Token");

    const payload = JSON.parse(res.getContentText());
    if (payload.aud !== CLIENT_ID) throw new Error("Invalid Client ID");

    const email = payload.email;
    const name = payload.name;
    const picture = payload.picture;

    const ss = getDB();
    let sheet = ss.getSheetByName(CONFIG.USER_SHEET_NAME) || ss.insertSheet(CONFIG.USER_SHEET_NAME);
    if (sheet.getLastRow() === 0) {
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
          sheet.getRange(i + 1, 5, 1, 2).setValues([[picture, now]]);
          return jsonResponse({ status: 'success', name: data[i][1] || name, role: role, picture: picture, email: email });
        } else if (status === 'banned') {
          return jsonResponse({ status: 'error', message: 'บัญชีของคุณถูกระงับการใช้งาน กรุณาติดต่อแอดมิน' });
        } else {
          return jsonResponse({ status: 'error', message: 'บัญชีของคุณกำลังรอการอนุมัติจากแอดมิน' });
        }
      }
    }

    // ผู้ใช้ใหม่: เพิ่มข้อมูลและตั้งสถานะเริ่มต้นเป็น Teacher (อนุมัติทันที)
    sheet.appendRow([email, name, 'Teacher', 'approved', picture, now]);
    return jsonResponse({ status: 'success', name: name, role: 'Teacher', picture: picture, email: email });

  } catch (err) {
    return jsonResponse({ status: 'error', message: 'การตรวจสอบสิทธิ์ล้มเหลว: ' + err.toString() });
  }
}

// เชื่อมต่อบัญชี LINE LIFF เข้ากับระบบ
function handleLinkLineAccount(email, lineId, name, picture) {
  try {
    const ss = getDB();
    let sheet = ss.getSheetByName(CONFIG.USER_SHEET_NAME) || ss.insertSheet(CONFIG.USER_SHEET_NAME);
    if (sheet.getLastRow() === 0) {
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
          sheet.getRange(i + 1, 7).setValue(lineId); // Col G = LineID
          sheet.getRange(i + 1, 6).setValue(now);
          return jsonResponse({ status: 'success', name: dbName || name, role: role, picture: dbPicture || picture, email: email, message: 'Linked successfully' });
        } else if (status === 'banned') {
          return jsonResponse({ status: 'error', message: 'บัญชีของคุณถูกระงับการใช้งาน กรุณาติดต่อแอดมิน' });
        } else {
          return jsonResponse({ status: 'error', message: 'บัญชีของคุณกำลังรอการอนุมัติจากแอดมิน' });
        }
      }
    }
    
    sheet.appendRow([email, name || 'LINE User', 'Teacher', 'approved', picture || '', now, lineId]);
    return jsonResponse({ status: 'success', name: name || 'LINE User', role: 'Teacher', picture: picture || '', email: email, message: 'Registered and Linked successfully' });
  } catch (e) {
    return jsonResponse({ status: 'error', message: e.message });
  }
}

// ดึงรายชื่ออีเมลและ LINE ID ของกลุ่ม Role ที่กำหนด
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

// ดึงข้อมูลติดต่อของผู้แจ้ง (อีเมลและ LINE ID) จากชื่อผู้แจ้ง
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

// ค้นหาอีเมลของช่าง/ผู้ใช้จากชื่อ
function getUserEmailByName(name) {
  try {
    const db = getDB();
    const sheet = db.getSheetByName(CONFIG.USER_SHEET_NAME);
    if (!sheet) return null;
    
    const data = sheet.getDataRange().getValues();
    const searchName = (name || '').toString().trim().toLowerCase();
    
    for (let i = 1; i < data.length; i++) {
      const rowName = (data[i][1] || '').toString().trim().toLowerCase();
      if (rowName === searchName && rowName !== '') {
        const email = (data[i][0] || '').toString().trim();
        if (email && email.includes('@')) return email;
      }
    }
    return null;
  } catch (e) {
    return null;
  }
}

// ค้นหา Line ID ของผู้ใช้จากชื่อ
function getUserLineIdByName(name) {
  try {
    const contacts = getReporterContacts(name);
    return contacts.lineId;
  } catch (e) {
    return null;
  }
}

// ============================================================================
// 📊 หมวดที่ 7: ข้อมูลแดชบอร์ดและ Master Data (Dashboard & Master Internal)
// ============================================================================
function getDashboardDataInternal(monthStr) {
  const db = getDB();
  const bSheet   = db.getSheetByName(CONFIG.SHEET_NAME);
  const avSheet  = db.getSheetByName(CONFIG.AV_SHEET_NAME);
  const bugSheet = db.getSheetByName(CONFIG.BUG_SHEET_NAME);
  const itSheet  = db.getSheetByName(CONFIG.IT_SHEET_NAME);
  const avRepSheet = db.getSheetByName(CONFIG.AV_REPAIR_SHEET_NAME);
  const projSheet  = db.getSheetByName(CONFIG.PROJECT_SHEET_NAME);
  
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
  const overdueDays = parseInt(getSettingValue('overdue_days', 3)) || 3;

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

// ============================================================================
// 💬 หมวดที่ 8: ระบบแจ้งเตือน (LINE Messaging API & Email Notifications)
// ============================================================================

// สร้างเทมเพลต LINE Flex Message
function createFlexMessageTemplate(altText, headerText, subjectText, color, detailsMap, buttonsArray, ticketId) {
  const detailsContents = [];
  if (Array.isArray(detailsMap)) {
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
  }

  let targetUrl = ticketId ? (CONFIG.WEB_APP_URL + (CONFIG.WEB_APP_URL.includes('?') ? '&' : '?') + 'ticketId=' + encodeURIComponent(ticketId)) : CONFIG.WEB_APP_URL;
  if (targetUrl && targetUrl.startsWith('http') && !targetUrl.includes('openExternalBrowser')) {
    targetUrl += (targetUrl.includes('?') ? '&' : '?') + 'openExternalBrowser=1';
  }

  const buttonsContents = [];
  if (buttonsArray && buttonsArray.length > 0) {
    buttonsArray.forEach((btn, index) => {
      let btnUri = (btn.url && btn.url !== CONFIG.WEB_APP_URL) ? btn.url : targetUrl;
      if (btnUri && btnUri.startsWith('http') && !btnUri.includes('openExternalBrowser')) {
        btnUri += (btnUri.includes('?') ? '&' : '?') + 'openExternalBrowser=1';
      }
      const btnObj = {
        "type": "button", "style": "primary", "color": btn.color || color,
        "action": { "type": "uri", "label": btn.label, "uri": btnUri }
      };
      if (index > 0) btnObj.margin = "sm";
      buttonsContents.push(btnObj);
    });
  } else {
    buttonsContents.push({
      "type": "button", "style": "primary", "color": color, 
      "action": { "type": "uri", "label": "เปิดดูในระบบ", "uri": targetUrl }
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

// ตรวจสอบและทำความสะอาด Flex Message ป้องกัน LINE API เกิด Error จากค่าว่าง
function sanitizeFlexPayload(obj) {
  if (Array.isArray(obj)) {
    obj.forEach(sanitizeFlexPayload);
  } else if (typeof obj === 'object' && obj !== null) {
    for (let key in obj) {
      if (key === 'text' || key === 'altText') {
        if (obj[key] === undefined || obj[key] === null || obj[key] === '') {
          obj[key] = '-';
        } else {
          obj[key] = String(obj[key]);
        }
      } else {
        sanitizeFlexPayload(obj[key]);
      }
    }
  }
}

// สร้างรูปแบบ HTML สำหรับส่งอีเมลแจ้งเตือน
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

// ศูนย์กลางสั่งกระจายแจ้งเตือน (รวบรวมผู้รับทั้งรายบุคคลและ LINE กลุ่มหลัก)
function notifyTask(taskType, lineMsg, emailTitle, emailColor, dataObj, reporterNameOverride) {
  let targetRoles = [];
  
  if (taskType === 'project' || taskType === 'bug') {
    targetRoles = ['admin', 'executive'];
  } else {
    // building, it, av, av_repair
    targetRoles = ['admin', 'executive', 'tech', 'av'];
  }
  
  const contacts = getContactsByRoles(targetRoles);
  let lineTargets = contacts.lineIds;
  
  const reporterName = reporterNameOverride || dataObj?.reporter || dataObj?.borrower || null;
  if (reporterName) {
    const reporter = getReporterContacts(reporterName);
    if (reporter.lineId && (reporter.lineId.startsWith('U') || reporter.lineId.startsWith('C') || reporter.lineId.startsWith('R')) && !lineTargets.includes(reporter.lineId)) {
      lineTargets.push(reporter.lineId);
    }
  }
  
  // รวม LINE Group หลักเข้าไปในรายการส่งเสมอ (หากเปิดใช้งาน)
  if (ENABLE_LINE_GROUP_NOTIFY && CONFIG.LINE_TARGET_ID && !CONFIG.LINE_TARGET_ID.includes("ใส่_")) {
    const mainGroupId = CONFIG.LINE_TARGET_ID.trim();
    if (!lineTargets.includes(mainGroupId)) {
      lineTargets.push(mainGroupId);
    }
  }

  // ส่งข้อความแจ้งเตือนผ่าน LINE
  if (lineTargets.length > 0 && lineMsg) {
    sendLineMessage(lineMsg, lineTargets);
  }
}

// ส่งข้อความผ่าน LINE Messaging API (รองรับทั้งผู้ใช้รายคน, กลุ่ม และ Broadcast)
function sendLineMessage(message, targetId) {
  try {
    if (!CONFIG.LINE_CHANNEL_ACCESS_TOKEN || CONFIG.LINE_CHANNEL_ACCESS_TOKEN.includes("ใส่_")) return;
    
    let rawTargets = [];
    if (Array.isArray(targetId)) {
      rawTargets = targetId;
    } else if (typeof targetId === 'string' && targetId.trim() !== '') {
      rawTargets = [targetId.trim()];
    }

    // รวม LINE_TARGET_ID (กลุ่มหลัก) เข้าไปด้วยเสมอหากเปิดใช้งาน
    if (ENABLE_LINE_GROUP_NOTIFY && CONFIG.LINE_TARGET_ID && !CONFIG.LINE_TARGET_ID.includes("ใส่_")) {
      rawTargets.push(CONFIG.LINE_TARGET_ID.trim());
    }

    // คัดเฉพาะ ID ที่ไม่ว่างเปล่าและตัดค่าซ้ำ
    const validTargets = [...new Set(rawTargets.filter(id => typeof id === 'string' && id.trim() !== ''))];
    if (validTargets.length === 0) return;

    const headers = {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + CONFIG.LINE_CHANNEL_ACCESS_TOKEN
    };

    let allResponses = [];
    const isBroadcast = validTargets.includes('BROADCAST');
    const msgPayload = typeof message === 'string' ? { "type": "text", "text": message } : message;

    // ตรวจสอบความถูกต้องของ Flex Message
    sanitizeFlexPayload(msgPayload);

    // ── 1. กรณี Broadcast ──────────────────────────────────────────────
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

    // ── 2. ส่งรายบุคคล (User ID ขึ้นต้นด้วย U) ──────────────────────────
    const userIds = isBroadcast ? [] : validTargets.filter(id => id.startsWith('U') && id !== 'BROADCAST');
    if (userIds.length > 0) {
      if (userIds.length === 1) {
        const res = UrlFetchApp.fetch("https://api.line.me/v2/bot/message/push", {
          method: "post",
          headers: headers,
          payload: JSON.stringify({ "to": userIds[0], "messages": [msgPayload] }),
          muteHttpExceptions: true
        });
        allResponses.push(`[Push User] ${res.getResponseCode()}: ${res.getContentText()}`);
      } else {
        for (let i = 0; i < userIds.length; i += 500) {
          const chunk = userIds.slice(i, i + 500);
          const res = UrlFetchApp.fetch("https://api.line.me/v2/bot/message/multicast", {
            method: "post",
            headers: headers,
            payload: JSON.stringify({ "to": chunk, "messages": [msgPayload] }),
            muteHttpExceptions: true
          });
          allResponses.push(`[Multicast Users] ${res.getResponseCode()}: ${res.getContentText()}`);
        }
      }
    }

    // ── 3. ส่งเข้ากลุ่ม (Group ID ขึ้นต้นด้วย C หรือ Room ID ขึ้นต้นด้วย R) ──
    const groupIds = validTargets.filter(id => !id.startsWith('U') && id !== 'BROADCAST');
    for (const gid of groupIds) {
      const res = UrlFetchApp.fetch("https://api.line.me/v2/bot/message/push", {
        method: "post",
        headers: headers,
        payload: JSON.stringify({ "to": gid, "messages": [msgPayload] }),
        muteHttpExceptions: true
      });
      allResponses.push(`[Push Group] ${res.getResponseCode()}: ${res.getContentText()}`);
    }
    
    // ── บันทึกประวัติการส่งลงแท็บ Logs ใน Google Sheets ─────────────────
    try {
      const db = getDB();
      let logSheet = db.getSheetByName('Logs') || db.insertSheet('Logs');
      if (logSheet.getLastRow() === 0) {
        logSheet.appendRow(['Timestamp', 'Action', 'Targets', 'Responses', 'Message']);
        logSheet.getRange(1, 1, 1, 5).setFontWeight('bold').setBackground('#f3f4f6');
      }
      logSheet.appendRow([new Date(), 'LINE API', JSON.stringify(validTargets), allResponses.join(' | '), typeof message === 'string' ? message : JSON.stringify(message)]);
    } catch (logErr) {
      Logger.log("Failed to write log: " + logErr.message);
    }

  } catch (e) {
    Logger.log("Line Messaging API Error: " + e.message);
    try {
      const db = getDB();
      let logSheet = db.getSheetByName('Logs') || db.insertSheet('Logs');
      logSheet.appendRow([new Date(), 'LINE API ERROR', '', e.message, '']);
    } catch (logErr) {}
  }
}

// ============================================================================
// ⏰ หมวดที่ 9: ระบบตรวจสอบงานค้างและการตั้งเวลาอัตโนมัติ (Overdue Tasks & Triggers)
// ============================================================================

// ฟังก์ชันตัวช่วยนับงานค้างตามจำนวนวันที่กำหนด
function _countOverdueTasks(sheet, statusCol, pendingStatuses, overdueDays) {
  if (!sheet) return 0;
  const data = sheet.getDataRange().getValues();
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  let count = 0;
  for (let i = 1; i < data.length; i++) {
    const status = (data[i][statusCol] || '').toString().trim();
    if (pendingStatuses.indexOf(status) < 0) continue;
    const dateStr = (data[i][0] || '').toString().split(' ')[0];
    if (!dateStr) continue;
    const parts = dateStr.split('/');
    if (parts.length !== 3) continue;
    const taskDate = new Date(parts[2] + '-' + parts[1] + '-' + parts[0]);
    if (isNaN(taskDate.getTime())) continue;
    taskDate.setHours(0, 0, 0, 0);
    const diffDays = Math.round((now - taskDate) / (1000 * 60 * 60 * 24));
    if (diffDays >= overdueDays) count++;
  }
  return count;
}

// ตรวจสอบงานค้างทั้งหมดและส่งแจ้งเตือนเข้า LINE กลุ่ม
function checkOverdueTasksV2() {
  const db = getDB();
  const overdueDays = parseInt(getSettingValue('overdue_days', 3)) || 3;
  const pendingAll = ['รอดำเนินการ', 'กำลังดำเนินการ', 'กำลังแก้ไข'];

  const repCount   = _countOverdueTasks(db.getSheetByName(CONFIG.SHEET_NAME),           4, ['รอดำเนินการ'], overdueDays);
  const avCount    = _countOverdueTasks(db.getSheetByName(CONFIG.AV_SHEET_NAME),         5, ['รอยืนยันการยืม'], overdueDays);
  const itCount    = _countOverdueTasks(db.getSheetByName(CONFIG.IT_SHEET_NAME),         4, pendingAll, overdueDays);
  const avRepCount = _countOverdueTasks(db.getSheetByName(CONFIG.AV_REPAIR_SHEET_NAME),  4, pendingAll, overdueDays);
  const projCount  = _countOverdueTasks(db.getSheetByName(CONFIG.PROJECT_SHEET_NAME),    4, pendingAll, overdueDays);
  const totalOverdue = repCount + avCount + itCount + avRepCount + projCount;

  if (totalOverdue === 0) {
    Logger.log('checkOverdueTasksV2: ไม่มีงานค้าง');
    return;
  }

  const details = [];
  if (repCount   > 0) details.push({ label: '🏢 ซ่อมอาคาร', value: repCount   + ' งาน' });
  if (avCount    > 0) details.push({ label: '🎤 ยืมโสตฯ',   value: avCount    + ' งาน' });
  if (itCount    > 0) details.push({ label: '💻 ซ่อมไอที',  value: itCount    + ' งาน' });
  if (avRepCount > 0) details.push({ label: '🔧 ซ่อมโสตฯ', value: avRepCount + ' งาน' });
  if (projCount  > 0) details.push({ label: '🏗️ โครงการ',   value: projCount  + ' งาน' });

  const overdueMsg = createFlexMessageTemplate(
    'แจ้งเตือน: มีงานค้าง ' + totalOverdue + ' รายการ',
    '🔔 แจ้งเตือนงานค้างประจำวัน',
    'มีงานค้างเกิน ' + overdueDays + ' วัน รวม ' + totalOverdue + ' รายการ',
    '#dc2626',
    details,
    [{ label: '👉 เข้าสู่ระบบเพื่อตรวจสอบ', url: CONFIG.WEB_APP_URL, color: '#dc2626' }]
  );

  notifyTask('building', overdueMsg, '🔔 งานค้าง ' + totalOverdue + ' รายการ (เกิน ' + overdueDays + ' วัน)', '#dc2626', null, null);
  Logger.log('checkOverdueTasksV2: แจ้งเตือนงานค้าง ' + totalOverdue + ' รายการ เรียบร้อย');
}

// Wrapper ให้ฟังก์ชันเดิมชี้มาที่ V2 เสมอ ป้องกัน Trigger เดิมทำงานผิดพลาด
function checkOverdueTasks() {
  return checkOverdueTasksV2();
}

// ตั้งค่า Trigger อัตโนมัติ รันตรวจงานค้างทุกวันเวลา 07:00 น.
function setupDailyTrigger() {
  ScriptApp.getProjectTriggers().forEach(t => {
    if (t.getHandlerFunction() === 'checkOverdueTasksV2' || t.getHandlerFunction() === 'checkOverdueTasks') {
      ScriptApp.deleteTrigger(t);
    }
  });
  ScriptApp.newTrigger('checkOverdueTasksV2').timeBased().everyDays(1).atHour(7).create();
  Logger.log('setupDailyTrigger: Trigger ตั้งเวลา - รันทุกวัน 07:00 น.');
  SpreadsheetApp.getUi().alert('✅ ตั้งค่า Trigger สำเร็จ!\nระบบจะแจ้งเตือนงานค้างทุกวันเวลา 07:00 น. ผ่าน LINE');
}

// ลบ Trigger งานค้างทั้งหมด
function removeDailyTrigger() {
  let count = 0;
  ScriptApp.getProjectTriggers().forEach(t => {
    if (t.getHandlerFunction() === 'checkOverdueTasksV2' || t.getHandlerFunction() === 'checkOverdueTasks') {
      ScriptApp.deleteTrigger(t);
      count++;
    }
  });
  Logger.log('removeDailyTrigger: ลบ trigger ' + count + ' รายการ');
}
