const fs = require('fs');
let content = fs.readFileSync('index.html', 'utf8');

const overlayStart = '<!-- MAINTENANCE OVERLAY -->';
const overlayEnd = '<!-- END MAINTENANCE OVERLAY -->\n';

let startIndex = content.indexOf(overlayStart);
let endIndex = content.indexOf(overlayEnd);

if (startIndex !== -1 && endIndex !== -1) {
    endIndex += overlayEnd.length;
    content = content.substring(0, startIndex) + content.substring(endIndex);
    fs.writeFileSync('index.html', content, 'utf8');
    console.log("Maintenance overlay removed successfully.");
} else {
    console.log("Overlay not found.");
}
