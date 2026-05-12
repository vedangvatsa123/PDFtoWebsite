const fs = require('fs');
const file = '.github/scripts/bsky-post.mjs';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "const imgPath = path.join(IMG_DIR, `post_${imgNum}.png`);",
  `let imgPath = path.join(__dirname, '../../public/images/social', \`post_\${imgNum}.png\`);
  if (!fs.existsSync(imgPath)) {
    imgPath = path.join(__dirname, '..', 'images', \`post_\${imgNum}.png\`);
  }`
);

fs.writeFileSync(file, content);
console.log('Fixed bsky-post.mjs image path logic');
