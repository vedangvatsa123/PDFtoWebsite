const fs = require('fs');
const file = '.github/scripts/x-post.mjs';
let content = fs.readFileSync(file, 'utf8');

// Skip uploadMedia if it's an mp4
content = content.replace("if (!fs.existsSync(imgPath)) { console.warn(`  ⚠️ Image not found: ${imgPath}`); resolve(null); return; }", 
  "if (!fs.existsSync(imgPath)) { console.warn(`  ⚠️ Image not found: ${imgPath}`); resolve(null); return; }\n    if (imgPath.endsWith('.mp4')) { console.warn(`  ⚠️ Twitter script does not support chunked mp4 upload, skipping media...`); resolve(null); return; }");

fs.writeFileSync(file, content);
console.log('Patched x-post.mjs to skip mp4');
