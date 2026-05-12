const fs = require('fs');

function removeLinks(text) {
  if (!text) return text;
  return text.replace(/https:\/\/www\.youtube\.com\/watch\?v=[A-Za-z0-9_-]+\n\n?/g, '');
}

const b = JSON.parse(fs.readFileSync('.github/scripts/buffer-content.json', 'utf8'));
b.linkedin = b.linkedin.map(removeLinks);
b.instagram = b.instagram.map(removeLinks);
b.facebook = b.facebook.map(removeLinks);
fs.writeFileSync('.github/scripts/buffer-content.json', JSON.stringify(b, null, 2));

const x = JSON.parse(fs.readFileSync('.github/scripts/x-content.json', 'utf8'));
x.engagement = x.engagement.map(item => {
  if (item.text) item.text = removeLinks(item.text);
  // Also set the correct img paths for the videos
  if (item.id === 'viral_001') item.img = '/images/social/post_121.mp4';
  if (item.id === 'viral_002') item.img = '/images/social/post_122.mp4';
  if (item.id === 'viral_003') item.img = '/images/social/post_123.mp4';
  return item;
});
fs.writeFileSync('.github/scripts/x-content.json', JSON.stringify(x, null, 2));

console.log('Fixed text and paths');
