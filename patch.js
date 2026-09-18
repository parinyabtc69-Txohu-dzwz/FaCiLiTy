const fs = require('fs');
let code = fs.readFileSync('Code.gs', 'utf8');

code = code.replace(
  "const userIds = validTargets.filter(id => id.startsWith('U'));",
  
    if (rawTargets.includes('BROADCAST')) {
      const msgPayload = typeof message === 'string' ? { "type": "text", "text": message } : message;
      function sanitizeFlex(obj) {
        if (Array.isArray(obj)) {
          obj.forEach(sanitizeFlex);
        } else if (typeof obj === 'object' && obj !== null) {
          for (let key in obj) {
            if (key === 'text' || key === 'altText') {
              if (obj[key] === undefined || obj[key] === null || obj[key] === '') obj[key] = '-';
              else obj[key] = String(obj[key]);
            } else sanitizeFlex(obj[key]);
          }
        }
      }
      sanitizeFlex(msgPayload);
      try {
        UrlFetchApp.fetch("https://api.line.me/v2/bot/message/broadcast", {
          method: "post",
          headers: headers,
          payload: JSON.stringify({ "messages": [msgPayload] }),
          muteHttpExceptions: true
        });
      } catch (e) { Logger.log("Broadcast error: " + e.message); }
      return;
    }

    const userIds = validTargets.filter(id => id.startsWith('U'));
  
);

code = code.replace(
  "sendLineMessage(lineMsg, lineTargets);",
  "sendLineMessage(lineMsg, ['BROADCAST']);"
);

fs.writeFileSync('Code.gs', code);
