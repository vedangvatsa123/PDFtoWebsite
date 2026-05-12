const fs = require('fs');
const path = require('path');

const dataCardsDir = '/Users/vedang/Desktop/data_cards';
const jsonPath = path.join(dataCardsDir, 'data_cards_schedule.json');
const bskyPath = path.join(__dirname, '../.github/scripts/bsky-post.mjs');
const bufferPath = path.join(__dirname, '../.github/scripts/buffer-schedule.mjs');

const githubImagesDir = path.join(__dirname, '../.github/images');
const publicImagesDir = path.join(__dirname, '../public/images/social');

const postsData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

// Data cards start right after the leaked screenshots (post_101-110)
// So data cards will be post_111 through post_120
const START_IMG_NUM = 111;

// 1. Copy images
const fileMapping = [
  '1_75pct_resumes.png',
  '2_7seconds_cv.png',
  '3_250_applications.png',
  '4_240k_bad_hire.png',
  '5_85pct_networking.png',
  '6_63pct_entry_level.png',
  '7_92million_displaced.png',
  '8_6seconds_reject.png',
  '9_72pct_ghosted.png',
  '10_3of4_robot.png'
];

for (let i = 0; i < fileMapping.length; i++) {
  const imgNum = String(START_IMG_NUM + i).padStart(2, '0');
  const targetName = 'post_' + imgNum + '.png';
  const src = path.join(dataCardsDir, fileMapping[i]);
  
  fs.copyFileSync(src, path.join(githubImagesDir, targetName));
  fs.copyFileSync(src, path.join(publicImagesDir, targetName));
  console.log('Copied ' + fileMapping[i] + ' -> ' + targetName);
}

// 2. Build JS array entries
let postsJs = '';
for (const post of postsData) {
  const escaped = post.caption.replace(/\\/g, '\\\\').replace(/`/g, '\\`');
  postsJs += '  `' + escaped + '`,\n';
}

// 3. Append to bsky-post.mjs POSTS array
let bskyContent = fs.readFileSync(bskyPath, 'utf8');
// Find the closing ]; of the POSTS array
const bskyArrayEnd = bskyContent.indexOf('];\n\n// ── AT Protocol');
if (bskyArrayEnd !== -1) {
  bskyContent = bskyContent.substring(0, bskyArrayEnd) + postsJs + bskyContent.substring(bskyArrayEnd);
  fs.writeFileSync(bskyPath, bskyContent);
  console.log('Appended 10 data card posts to bsky-post.mjs');
} else {
  console.log('Could not find POSTS array end in bsky-post.mjs, trying fallback...');
  // Fallback: find last backtick-comma before ];
  const fallbackEnd = bskyContent.indexOf('];\n', bskyContent.indexOf('const POSTS'));
  if (fallbackEnd !== -1) {
    bskyContent = bskyContent.substring(0, fallbackEnd) + postsJs + bskyContent.substring(fallbackEnd);
    fs.writeFileSync(bskyPath, bskyContent);
    console.log('Appended 10 data card posts to bsky-post.mjs (fallback)');
  }
}

// 4. Append to buffer-schedule.mjs POSTS, IG_POSTS, FB_POSTS arrays
let bufferContent = fs.readFileSync(bufferPath, 'utf8');

const appendToArray = (content, marker) => {
  const idx = content.indexOf(marker);
  if (idx === -1) return content;
  // Find the ]; before the marker
  let searchFrom = idx;
  // Look backward from marker to find ];
  const before = content.substring(0, idx);
  const lastClose = before.lastIndexOf('];');
  if (lastClose === -1) return content;
  return content.substring(0, lastClose) + postsJs + content.substring(lastClose);
};

// For POSTS array, find the marker that comes after it
bufferContent = appendToArray(bufferContent, '// Instagram-optimized');
// For IG_POSTS
bufferContent = appendToArray(bufferContent, '// Facebook-optimized');
// For FB_POSTS
bufferContent = appendToArray(bufferContent, '// Pick the right content');

fs.writeFileSync(bufferPath, bufferContent);
console.log('Appended 10 data card posts to buffer-schedule.mjs (all 3 arrays)');

console.log('\nDone! Data cards injected as posts 111-120.');
