const fs = require('fs');
const file = '.github/scripts/bsky-post.mjs';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "if (!fs.existsSync(imgPath)) {",
  "if (imgPath.endsWith('.mp4')) { console.warn('⚠️ Bluesky script does not support video upload, skipping...'); imgPath = null; }\n  if (imgPath && !fs.existsSync(imgPath)) {"
);

fs.writeFileSync(file, content);
console.log('Patched bsky-post.mjs to skip mp4');
