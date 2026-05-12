const fs = require('fs');
const file = '.github/scripts/bsky-post.mjs';
let content = fs.readFileSync(file, 'utf8');

const regex = /const POSTS = \[[\s\S]*?\];/;
const replacement = `const CONTENT_FILE = path.join(__dirname, 'buffer-content.json');
const bufferContent = JSON.parse(fs.readFileSync(CONTENT_FILE, 'utf8'));
const POSTS = bufferContent.linkedin;`;

content = content.replace(regex, replacement);
fs.writeFileSync(file, content);
console.log('Updated bsky-post.mjs');
