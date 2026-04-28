const fs = require('fs');

const inFile = '/Users/vedang/PDFtoWebsite/scripts/cvinbio-jobs-export.csv';
const content = fs.readFileSync(inFile, 'utf8');
const lines = content.split('\n').filter(l => l.trim().length > 0);

const header = lines[0];
const dataLines = lines.slice(1);
const CHUNK_SIZE = 10000;

for (let i = 0; i < dataLines.length; i += CHUNK_SIZE) {
  const chunk = dataLines.slice(i, i + CHUNK_SIZE);
  const chunkText = [header, ...chunk].join('\n');
  const partNum = Math.floor(i / CHUNK_SIZE) + 1;
  const outName = `/Users/vedang/PDFtoWebsite/scripts/cvinbio-jobs-export-part${partNum}.csv`;
  fs.writeFileSync(outName, chunkText, 'utf8');
  console.log(`Created ${outName} (${chunk.length} rows)`);
}
