import { readFileSync } from 'fs';

const csv = readFileSync('/Users/vedang/Documents/sg_my_tech_jobs.csv', 'utf-8');
const lines = csv.split('\n').slice(1).filter(l => l.trim());

function parseCsvRow(row) {
  const f = []; let cur = ''; let inQ = false;
  for (let i = 0; i < row.length; i++) {
    if (row[i] === '"') { if (inQ && row[i+1] === '"') { cur += '"'; i++; } else inQ = !inQ; }
    else if (row[i] === ',' && !inQ) { f.push(cur); cur = ''; } else { cur += row[i]; }
  }
  f.push(cur); return f;
}

// Find ALL remaining issues by company
const issues = {};
for (const line of lines) {
  const f = parseCsvRow(line);
  const company = f[0], title = f[3] || '', skills = f[5] || '', exam = f[8] || '', course = f[6] || '';
  const tl = title.toLowerCase();
  const flags = [];

  // AWS SA for non-cloud
  if (exam.includes('AWS Solutions Architect') && !/cloud|aws|infra|platform|devops|sre|architect|system/i.test(tl) && !/aws/i.test(skills))
    flags.push('AWS SA exam mismatch');
  // Dev cert for non-dev
  if (/Meta Front-End|Meta Back-End|PCEP|JSNAD|Oracle.*Java/i.test(exam) && /manager|director|head|vp|chief|lead/i.test(tl) && !/engineering manager|tech lead|data lead|ml lead/i.test(tl))
    flags.push('Dev cert for manager');
  // Coding skills for non-coding
  if (/recruiter|marketing|sales(?!.*eng)|operations|hr|legal|finance|business.?dev|partnerships|account(?!.*eng)/i.test(tl) && /python|ruby|java|golang|react|node/i.test(skills))
    flags.push('Coding skills for non-coding role');
  // System Design Primer for non-design roles
  if (course.includes('System Design Primer') && /analyst|associate|coordinator|specialist|executive|support/i.test(tl))
    flags.push('System Design for non-arch role');

  if (flags.length > 0) {
    if (!issues[company]) issues[company] = [];
    issues[company].push({ title, skills: skills.substring(0, 60), flags: flags.join(', ') });
  }
}

console.log('Issues by company:\n');
const sorted = Object.entries(issues).sort((a, b) => b[1].length - a[1].length);
for (const [company, items] of sorted) {
  console.log(`${company} (${items.length} issues):`);
  items.forEach(i => console.log(`  "${i.title}" → ${i.flags}`));
  console.log('');
}
console.log(`Total: ${sorted.reduce((s, [, i]) => s + i.length, 0)} issues across ${sorted.length} companies`);
