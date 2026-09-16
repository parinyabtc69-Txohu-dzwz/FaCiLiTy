const fs = require('fs');
let code = fs.readFileSync('Code.gs', 'utf8');

// The corrupted block starts precisely at:
// // ============================================================
// // Phase B:
const splitStr = "// ============================================================\r\n// Phase B:";
const parts = code.split(splitStr);

if (parts.length > 1) {
  const goodCode = parts[0];
  const newCode = `// ============================================================
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
    [{ label: '👉 เข้าสู่ระบบเพื่อตรวจสอบ', url: 'https://liff.line.me/' + CONFIG.LIFF_ID + '?openExternalBrowser=1', color: '#dc2626' }]
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
  SpreadsheetApp.getUi().alert('✅ ตั้งค่า Trigger สำเร็จ!\\nระบบจะแจ้งเตือนงานค้างทุกวันเวลา 07:00 น. ผ่าน LINE');
}

function removeDailyTrigger() {
  var count = 0;
  ScriptApp.getProjectTriggers().forEach(function(t) {
    if (t.getHandlerFunction() === 'checkOverdueTasksV2') { ScriptApp.deleteTrigger(t); count++; }
  });
  Logger.log('removeDailyTrigger: ลบ trigger ' + count + ' รายการ');
}
`;
  
  fs.writeFileSync('Code.gs', goodCode + newCode, 'utf8');
  console.log("Fixed!");
} else {
  console.log("Could not find the split string.");
}
