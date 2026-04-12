import { readFileSync, writeFileSync } from 'fs';

const csv = readFileSync('/Users/vedang/Documents/sg_my_tech_jobs.csv', 'utf-8');
const lines = csv.split('\n');
const header = lines[0];
const rows = lines.slice(1).filter(l => l.trim());

function parseCsvRow(row) {
  const f = []; let cur = ''; let inQ = false;
  for (let i = 0; i < row.length; i++) {
    if (row[i] === '"') { if (inQ && row[i+1] === '"') { cur += '"'; i++; } else inQ = !inQ; }
    else if (row[i] === ',' && !inQ) { f.push(cur); cur = ''; } else { cur += row[i]; }
  }
  f.push(cur); return f;
}
function escCsv(s) { if (!s) return ''; if (s.includes(',') || s.includes('"') || s.includes('\n')) return '"' + s.replace(/"/g, '""') + '"'; return s; }

// Specific fixes for the last 11
const FIXES = {
  'Design Systems Lead': { skills: 'design systems, figma, css, ux design', course: 'Google UX Design (Coursera)', courseUrl: 'https://www.coursera.org/professional-certificates/google-ux-design', exam: 'Google UX Design Certificate', examUrl: 'https://www.coursera.org/professional-certificates/google-ux-design' },
  'Senior/Lead Algorithm Engineer, Overseas Growth': { exam: 'AWS Machine Learning – Specialty', examUrl: 'https://aws.amazon.com/certification/certified-machine-learning-specialty/' },
  'Staff Engineer, Operations Automation': { skills: 'python, sql, automation, system design', course: 'Python for Everybody (Coursera)', courseUrl: 'https://www.coursera.org/specializations/python', exam: 'PCEP – Certified Entry-Level Python Programmer', examUrl: 'https://pythoninstitute.org/pcep' },
  'Lead Software Engineer, AI Platform': { exam: 'AWS Machine Learning – Specialty', examUrl: 'https://aws.amazon.com/certification/certified-machine-learning-specialty/' },
  'Engineering Manager II, Insurance Operations': { skills: 'system design, agile, software architecture', course: 'System Design Primer (GitHub)', courseUrl: 'https://github.com/donnemartin/system-design-primer', exam: 'Professional Scrum Master I (PSM I)', examUrl: 'https://www.scrum.org/assessments/professional-scrum-master-i-certification' },
  'Staff Product Designer': { skills: 'ux design, figma, prototyping, user research', course: 'Google UX Design (Coursera)', courseUrl: 'https://www.coursera.org/professional-certificates/google-ux-design', exam: 'Google UX Design Certificate', examUrl: 'https://www.coursera.org/professional-certificates/google-ux-design' },
  'Senior Integration Reliability Engineer, Technical Operations': { skills: 'system design, ruby, java, api integration', exam: 'Oracle Certified Professional Java SE', examUrl: 'https://education.oracle.com/java-se-programmer/pexam_1Z0-829' },
  'Senior Enterprise Software Specialist, Finance ERP - Public Service Division (PSD)': { skills: 'erp systems, sql, business analysis', course: 'SAP Learning Hub', courseUrl: 'https://learning.sap.com/', exam: 'SAP Certified Associate', examUrl: 'https://learning.sap.com/certifications' },
  'Principal Backend Software Engineer I': { exam: 'Oracle Certified Professional Java SE', examUrl: 'https://education.oracle.com/java-se-programmer/pexam_1Z0-829' },
  'AI Engineer, Digital Sales': { skills: 'python, machine learning, ai, analytics', course: 'ML Specialization (Stanford/Coursera)', courseUrl: 'https://www.coursera.org/specializations/machine-learning-introduction', exam: 'AWS Machine Learning – Specialty', examUrl: 'https://aws.amazon.com/certification/certified-machine-learning-specialty/' },
};

// Also catch the data/AI infra lead
const PARTIAL = {
  'Data&AI Infrastructure': { exam: 'Google Professional Data Engineer', examUrl: 'https://cloud.google.com/learn/certification/data-engineer' },
};

let fixed = 0;
const updated = rows.map(row => {
  const f = parseCsvRow(row);
  const title = f[3] || '';
  
  const fix = FIXES[title];
  if (fix) {
    fixed++;
    if (fix.skills) f[5] = fix.skills;
    if (fix.course) f[6] = fix.course;
    if (fix.courseUrl) f[7] = fix.courseUrl;
    if (fix.exam) f[8] = fix.exam;
    if (fix.examUrl) f[9] = fix.examUrl;
    return f.map(escCsv).join(',');
  }

  for (const [partial, pfix] of Object.entries(PARTIAL)) {
    if (title.includes(partial)) {
      fixed++;
      if (pfix.exam) f[8] = pfix.exam;
      if (pfix.examUrl) f[9] = pfix.examUrl;
      return f.map(escCsv).join(',');
    }
  }

  return row;
});

writeFileSync('/Users/vedang/Documents/sg_my_tech_jobs.csv', [header, ...updated].join('\n'));
console.log(`Fixed: ${fixed}`);
