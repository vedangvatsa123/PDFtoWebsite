const fs = require('fs');
const path = require('path');

const desktopDir = '/Users/vedang/Desktop/linkedin_viral_posts';
const jsonPath = path.join(desktopDir, 'cvinbio_social_schedule.json');
const bskyPath = path.join(__dirname, '../.github/scripts/bsky-post.mjs');
const bufferPath = path.join(__dirname, '../.github/scripts/buffer-schedule.mjs');
const bskyStatePath = path.join(__dirname, '../.github/scripts/bsky-state.json');
const bufferStatePath = path.join(__dirname, '../.github/scripts/buffer-state.json');

const githubImagesDir = path.join(__dirname, '../.github/images');
const publicImagesDir = path.join(__dirname, '../public/images/social');

if (!fs.existsSync(githubImagesDir)) fs.mkdirSync(githubImagesDir, { recursive: true });
if (!fs.existsSync(publicImagesDir)) fs.mkdirSync(publicImagesDir, { recursive: true });

const postsData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

// We will place the new campaign starting at index 100
const START_INDEX = 100;

// 1. Copy Images
for (let i = 0; i < postsData.length; i++) {
  const originalPath = postsData[i].image_path;
  const imgNum = String(START_INDEX + 1 + i).padStart(2, '0');
  const targetName = 'post_' + imgNum + '.png';
  
  fs.copyFileSync(originalPath, path.join(githubImagesDir, targetName));
  fs.copyFileSync(originalPath, path.join(publicImagesDir, targetName));
}

// 2. Format JS array strings
let postsJs = '';
for (const post of postsData) {
  const escaped = post.caption.replace(/\\/g, '\\\\').replace(/\`/g, '\\`');
  postsJs += '  `' + escaped + '`,\n';
}

// 3. Update bsky-post.mjs
let bskyContent = fs.readFileSync(bskyPath, 'utf8');
const bskyPostsRegex = /(const POSTS = \[\s*[\s\S]*?\n)(];)/;
bskyContent = bskyContent.replace(bskyPostsRegex, (match, p1, p2) => {
  let inner = p1;
  const currMatches = [...inner.matchAll(/`/g)];
  const currentCount = currMatches.length / 2;
  
  let padding = '';
  for (let i = currentCount; i < START_INDEX; i++) {
    padding += '  "",\n';
  }
  return inner + padding + postsJs + p2;
});
fs.writeFileSync(bskyPath, bskyContent);

// 4. Update buffer-schedule.mjs
let bufferContent = fs.readFileSync(bufferPath, 'utf8');

const updateArray = (content, varName) => {
  const regex = new RegExp('(const ' + varName + ' = \\[\\[\\s*\\S]*?\\n)(];)');
  return content.replace(regex, (match, p1, p2) => {
    let inner = p1;
    const currMatches = [...inner.matchAll(/`/g)];
    const currentCount = currMatches.length / 2;
    
    let padding = '';
    for (let i = currentCount; i < START_INDEX; i++) {
      padding += '  "",\n';
    }
    return inner + padding + postsJs + p2;
  });
};

// bufferContent = updateArray(bufferContent, 'POSTS');
// The regex above was a bit buggy, let's use string replace directly to be safe
const replaceArray = (content, arrayName) => {
  const startStr = 'const ' + arrayName + ' = [';
  const startIndex = content.indexOf(startStr);
  if (startIndex === -1) return content;
  
  const endBracketIndex = content.indexOf('];', startIndex);
  if (endBracketIndex === -1) return content;
  
  const arrayContent = content.substring(startIndex, endBracketIndex);
  const currMatches = [...arrayContent.matchAll(/`/g)];
  const currentCount = currMatches.length / 2;
  
  let padding = '';
  for (let i = currentCount; i < START_INDEX; i++) {
    padding += '  "",\n';
  }
  
  return content.substring(0, endBracketIndex) + (arrayContent.endsWith('\n') ? '' : '\n') + padding + postsJs + content.substring(endBracketIndex);
};

bufferContent = replaceArray(bufferContent, 'POSTS');
bufferContent = replaceArray(bufferContent, 'IG_POSTS');
bufferContent = replaceArray(bufferContent, 'FB_POSTS');

fs.writeFileSync(bufferPath, bufferContent);

// 5. Update states
fs.writeFileSync(bskyStatePath, JSON.stringify({ index: START_INDEX, lastPostedAt: null }, null, 2));
fs.writeFileSync(bufferStatePath, JSON.stringify({ linkedin: START_INDEX, instagram: START_INDEX, facebook: START_INDEX }, null, 2));

console.log('Successfully injected viral campaign at index 100!');
