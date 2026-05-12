const fs = require('fs');

const file = '.github/scripts/buffer-schedule.mjs';
let content = fs.readFileSync(file, 'utf8');

const regex = /const POSTS = \[[\s\S]*?\];\n\n\/\/ Pick the right content per platform/m;

const replacement = `const CONTENT_FILE = path.join(__dirname, 'buffer-content.json');
const bufferContent = JSON.parse(fs.readFileSync(CONTENT_FILE, 'utf8'));
const POSTS = bufferContent.linkedin;
const IG_POSTS = bufferContent.instagram;
const FB_POSTS = bufferContent.facebook;

// Pick the right content per platform`;

content = content.replace(regex, replacement);

const scheduleRegex = /\/\/ 3 posts\/day: 1 AM, 9 AM, 5 PM IST[\s\S]*?function generateSchedule\(startIndex\) {[\s\S]*?const slots = \[[\s\S]*?\];/m;

const newSchedule = `// 6 posts/day: 00:30, 04:30, 08:30, 12:30, 16:30, 20:30 UTC
function generateSchedule(startIndex) {
  const now = new Date();
  // Start from tomorrow
  let day = new Date(now);
  day.setUTCDate(day.getUTCDate() + 1);
  day.setUTCHours(0, 0, 0, 0);
  
  const slots = [
    { h: 0, m: 30, prevDay: false },
    { h: 4, m: 30, prevDay: false },
    { h: 8, m: 30, prevDay: false },
    { h: 12, m: 30, prevDay: false },
    { h: 16, m: 30, prevDay: false },
    { h: 20, m: 30, prevDay: false },
  ];`;

content = content.replace(scheduleRegex, newSchedule);

fs.writeFileSync(file, content);
console.log('Updated buffer-schedule.mjs');
