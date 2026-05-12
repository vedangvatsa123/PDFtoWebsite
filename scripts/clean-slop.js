const fs = require('fs');

function cleanText(text) {
  if (!text) return text;
  return text.replace(/ — /g, ' - ')
             .replace(/ – /g, ' - ')
             .replace(/—/g, '-')
             .replace(/–/g, '-');
}

function cleanJsonFile(file) {
  let content = fs.readFileSync(file, 'utf8');
  // Handle literal unicode escapes too!
  content = content.replace(/\\u2014/g, '-').replace(/\\u2013/g, '-');
  fs.writeFileSync(file, content);
  console.log('Cleaned ' + file);
}

cleanJsonFile('.github/scripts/buffer-content.json');
cleanJsonFile('.github/scripts/x-content.json');
