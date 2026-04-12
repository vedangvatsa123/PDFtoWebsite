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

// Flags for bad mapping:
// 1. Generic fallback skills that don't match the title
// 2. Non-eng roles with eng-specific skills
// 3. Mismatched exam for role type
const issues = [];

for (const line of lines) {
  const f = parseCsvRow(line);
  const company = f[0], title = (f[3] || '').toLowerCase(), skills = f[5] || '', course = f[6] || '', exam = f[8] || '';

  const flags = [];

  // Check: generic "ruby, java, golang" for non-coding roles
  if (/manager|director|lead|head|recruiter|account|sales|operations|strategy|marketing|people|talent|hr|finance|legal|compliance|business|partnerships/i.test(title) 
      && /ruby|java|golang|rust|python|react|node|c\+\+|scala/i.test(skills)
      && !/engineering manager|tech lead|data|ml|platform|infrastructure|security/i.test(title)) {
    flags.push('Non-eng role has coding skills');
  }

  // Check: "software engineering" as sole skill (too vague)
  if (skills === 'software engineering' && !/recruiter/i.test(title)) {
    flags.push('Vague "software engineering" skill');
  }

  // Check: AWS SA exam for non-cloud roles
  if (exam.includes('AWS Solutions Architect') && !/cloud|aws|infra|platform|devops|sre|architect|system/i.test(title) && !/aws/i.test(skills)) {
    flags.push('AWS SA exam for non-cloud role');
  }

  // Check: System Design Primer for junior/entry roles
  if (course.includes('System Design Primer') && /intern|junior|associate|new grad|entry/i.test(title)) {
    flags.push('System Design for junior role');
  }

  // Check: Developer cert for manager/director roles
  if (/Meta Front-End|Meta Back-End|PCEP|JSNAD|Oracle.*Java/i.test(exam) && /manager|director|head|vp|chief/i.test(title) && !/engineering manager|tech lead/i.test(title)) {
    flags.push('Developer cert for management role');
  }

  // Check: skills that are clearly wrong for the title
  if (/recruiter|recruiting|talent/i.test(title) && /ruby|java|python|react/i.test(skills)) {
    flags.push('Coding skills for recruiter role');
  }

  if (/account manager|customer success|sales/i.test(title) && skills === 'javascript') {
    flags.push('JS skill for non-tech role');
  }

  if (flags.length > 0) {
    issues.push({ company, title: f[3], skills, course, exam, flags });
  }
}

console.log(`Found ${issues.length} rows with potential mapping issues:\n`);
const byFlag = {};
for (const i of issues) {
  for (const flag of i.flags) {
    if (!byFlag[flag]) byFlag[flag] = [];
    byFlag[flag].push(i);
  }
}

for (const [flag, items] of Object.entries(byFlag)) {
  console.log(`\n=== ${flag} (${items.length} rows) ===`);
  items.slice(0, 5).forEach(i => {
    console.log(`  ${i.company} | ${i.title}`);
    console.log(`    Skills: ${i.skills}`);
    console.log(`    Course: ${i.course} | Exam: ${i.exam}`);
  });
  if (items.length > 5) console.log(`  ... and ${items.length - 5} more`);
}
