const fs = require('fs');
const content = fs.readFileSync('/Users/vedang/PDFtoWebsite/scripts/cvinbio-jobs-export.csv', 'utf8');

// Parse CSV
const lines = content.split('\n').filter(l => l.trim().length > 0);
const headers = lines[0].split(',');
let badSalaries = new Set();
let badLocations = new Set();
let badTitles = new Set();
let weirdCompanies = new Set();

// Simple CSV parser ignoring commas inside quotes
function parseCsvLine(text) {
  const result = [];
  let inQuote = false;
  let current = '';
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"' && text[i+1] === '"') {
      current += '"';
      i++;
    } else if (char === '"') {
      inQuote = !inQuote;
    } else if (char === ',' && !inQuote) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

for (let i = 1; i < lines.length; i++) {
  const cols = parseCsvLine(lines[i]);
  if (cols.length < 14) continue;
  
  const title = cols[3] || '';
  const loc = cols[4] || '';
  const company = cols[1] || '';
  const salary = cols[10] || '';
  
  // Salary anomalies
  if (salary) {
    // Has weird characters?
    if (/[&<>{}]/.test(salary) || salary.length > 50) {
      badSalaries.add(salary);
    }
  }
  
  // Location anomalies
  if (loc.length > 50 || /<|&/.test(loc)) {
    badLocations.add(loc);
  }
  
  // Title anomalies
  if (/<|&/.test(title)) {
    badTitles.add(title);
  }
}

console.log("--- Suspicious Salaries ---");
console.log(Array.from(badSalaries).slice(0, 10));
console.log("--- Suspicious Locations ---");
console.log(Array.from(badLocations).slice(0, 10));
console.log("--- Suspicious Titles (HTML entities) ---");
console.log(Array.from(badTitles).slice(0, 10));

