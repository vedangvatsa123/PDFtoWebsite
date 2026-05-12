const fs = require('fs');
const b = JSON.parse(fs.readFileSync('.github/scripts/buffer-content.json', 'utf8'));

function findDupes(arr, name) {
  const seen = new Set();
  const dupes = [];
  arr.forEach((text, i) => {
    if (!text || text.trim() === '') return; // ignore empty strings
    if (seen.has(text)) {
      dupes.push({ index: i, text: text.substring(0, 40) });
    } else {
      seen.add(text);
    }
  });
  console.log(`${name} has ${dupes.length} duplicates.`);
  if (dupes.length > 0) {
    console.log(dupes.slice(0, 5));
  }
}

findDupes(b.linkedin, 'linkedin');
findDupes(b.instagram, 'instagram');
findDupes(b.facebook, 'facebook');
