# Project Constants & Invariants

When working on the FaCiLiTy project (V6), ALWAYS enforce the following configuration values. If any file contains outdated versions of these, update them immediately:

1. **Google Apps Script Web App URL (`scriptURL`)**
   - **Value**: `https://script.google.com/macros/s/AKfycbz8v26S7km-uQ5wR2neO9oYs0_UvTJPXGdLhyYHt4pNM6AVZxouW4qiS1REDhlgjU8QPg/exec`
   - **Usage**: Used in `main.js` and `index.html` for fetching/posting data to the backend.

2. **LINE Group Notification Link**
   - **Value**: `https://line.me/ti/g/EkB7qqyTQy`
   - **Usage**: Used in the authentication page (`page-auth.html` or `main.js`) as the "เข้าร่วมกลุ่ม LINE แจ้งเตือน" button link. We do **NOT** use LINE for login anymore (only Google Login is used). The LINE button must purely be a link to this group.
