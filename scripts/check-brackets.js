const fs = require('fs');
const content = fs.readFileSync('src/app/admin/page.tsx', 'utf8');
const lines = content.split('\n');

let start = -1;
let end = -1;
for (let i=0; i<lines.length; i++) {
  if (lines[i].includes('{socialData && (')) start = i;
  if (start !== -1 && i > start && lines[i].includes(')}')) {
    if (lines[i].trim() === ')}') {
      end = i;
      break;
    }
  }
}

const block = lines.slice(start, end + 1).join('\n');
console.log(`Block length: ${block.length} characters`);

// Strip string literals, regex, and comments to count brackets accurately.
// For JSX, it's tricky, but we can use a library if needed.
// Let's just try to parse it with Babel.
