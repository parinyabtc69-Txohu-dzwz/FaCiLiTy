const fs = require('fs');
let indexHtml = fs.readFileSync('src/index.html', 'utf8');

// First remove the broken injected scripts
indexHtml = indexHtml.replace(/<script src="https:\/\/www.gstatic.com\/firebasejs\/8.10.1\/firebase-app.js"><\/script>\s*<script src="https:\/\/www.gstatic.com\/firebasejs\/8.10.1\/firebase-firestore.js"><\/script>\s*<script src="https:\/\/www.gstatic.com\/firebasejs\/8.10.1\/firebase-storage.js"><\/script>\s*<script src="https:\/\/www.gstatic.com\/firebasejs\/8.10.1\/firebase-auth.js"><\/script>\s*/, '');
indexHtml = indexHtml.replace(/<!-- Firebase SDK -->\s*/, '');

// Now insert them OUTSIDE the <script> tags!
const correctScripts = `
      <!-- Firebase SDK -->
      <script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js"></script>
      <script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-firestore.js"></script>
      <script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-storage.js"></script>
      <script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-auth.js"></script>
      <script>
        <!-- INCLUDE_JS -->`;

indexHtml = indexHtml.replace(/<script>\s*<!-- INCLUDE_JS -->/, correctScripts);

fs.writeFileSync('src/index.html', indexHtml, 'utf8');
console.log('Fixed src/index.html injection');
