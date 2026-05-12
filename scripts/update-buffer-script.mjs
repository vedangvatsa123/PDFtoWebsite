import fs from 'fs';
import path from 'path';

let content = fs.readFileSync('/Users/vedang/PDFtoWebsite/.github/scripts/buffer-schedule.mjs', 'utf8');

// Replace the const arrays with reading from json
const replacement = `const CONTENT_FILE = path.join(__dirname, 'buffer-content.json');
const bufferContent = JSON.parse(fs.readFileSync(CONTENT_FILE, 'utf8'));
const POSTS = bufferContent.linkedin;
const IG_POSTS = bufferContent.instagram;
const FB_POSTS = bufferContent.facebook;
`;

content = content.replace(/const POSTS = \[[\s\S]*?\];\s*const IG_POSTS = \[[\s\S]*?\];\s*const FB_POSTS = \[[\s\S]*?\];/, replacement);

fs.writeFileSync('/Users/vedang/PDFtoWebsite/.github/scripts/buffer-schedule.mjs', content);
console.log('buffer-schedule.mjs updated');
