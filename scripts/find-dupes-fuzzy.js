const fs = require('fs');
const b = JSON.parse(fs.readFileSync('.github/scripts/buffer-content.json', 'utf8'));

function findFuzzyDupes(arr, name) {
  const seen = new Set();
  const dupes = [];
  arr.forEach((text, i) => {
    if (!text || text.trim() === '') return;
    // Normalize string: lower case, remove punctuation, spaces, urls
    const normalized = text.toLowerCase()
      .replace(/cvin\.bio.*/g, '')
      .replace(/[^a-z0-9]/g, '');
    
    // Use first 30 chars of normalized text for matching
    const key = normalized.substring(0, 30);
    
    if (seen.has(key)) {
      dupes.push({ index: i, text: text.substring(0, 40) });
    } else {
      seen.add(key);
    }
  });
  console.log(`${name} has ${dupes.length} duplicates.`);
  if (dupes.length > 0) {
    console.log(dupes);
  }
  return dupes.length;
}

const n1 = findFuzzyDupes(b.linkedin, 'linkedin');
const n2 = findFuzzyDupes(b.instagram, 'instagram');
const n3 = findFuzzyDupes(b.facebook, 'facebook');

if (n1 + n2 + n3 > 0) {
    console.log('Writing clean version...');
    // Deduplicate logic
    const cleanB = { linkedin: [], instagram: [], facebook: [] };
    
    ['linkedin', 'instagram', 'facebook'].forEach(platform => {
      const seen = new Set();
      b[platform].forEach((text, i) => {
        if (!text || text.trim() === '') {
            cleanB[platform].push(text);
            return;
        }
        const normalized = text.toLowerCase()
          .replace(/cvin\.bio.*/g, '')
          .replace(/[^a-z0-9]/g, '');
        const key = normalized.substring(0, 30);
        
        if (!seen.has(key)) {
          seen.add(key);
          cleanB[platform].push(text);
        } else {
          // It's a duplicate, we should remove it, BUT if we remove it, the indices of ALL arrays shift.
          // Wait, if we remove it from linkedin, we must remove the same index from instagram and facebook to keep image indices matching!
        }
      });
    });
}

