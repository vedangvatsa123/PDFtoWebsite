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

// Role-appropriate mappings
const ROLE_MAPS = {
  // Engineering Managers / Directors / Leads
  eng_manager: {
    skills: 'system design, software architecture, agile',
    course: 'System Design Primer (GitHub)', courseUrl: 'https://github.com/donnemartin/system-design-primer',
    exam: 'Professional Scrum Master I (PSM I)', examUrl: 'https://www.scrum.org/assessments/professional-scrum-master-i-certification',
  },
  // Sales Engineer / Solutions Engineer / Pre-sales
  sales_eng: {
    skills: 'system design, cloud computing, solution architecture',
    course: 'System Design Primer (GitHub)', courseUrl: 'https://github.com/donnemartin/system-design-primer',
    exam: 'AWS Cloud Practitioner', examUrl: 'https://aws.amazon.com/certification/certified-cloud-practitioner/',
  },
  // Technical Account Manager
  tam: {
    skills: 'technical consulting, system design, project management',
    course: 'Google Project Management (Coursera)', courseUrl: 'https://www.coursera.org/professional-certificates/google-project-management',
    exam: 'PMP – Project Management Professional', examUrl: 'https://www.pmi.org/certifications/project-management-pmp',
  },
  // TPM / Technical Program Manager
  tpm: {
    skills: 'project management, agile, system design',
    course: 'Google Project Management (Coursera)', courseUrl: 'https://www.coursera.org/professional-certificates/google-project-management',
    exam: 'PMP – Project Management Professional', examUrl: 'https://www.pmi.org/certifications/project-management-pmp',
  },
  // Technical Recruiter
  recruiter: {
    skills: 'technical recruiting, talent acquisition',
    course: 'AIRS Certified Internet Recruiter', courseUrl: 'https://www.airsdirectory.com/certified-internet-recruiter',
    exam: 'AIRS Certified Internet Recruiter (CIR)', examUrl: 'https://www.airsdirectory.com/certified-internet-recruiter',
  },
  // Marketing Manager (tech company)
  marketing: {
    skills: 'digital marketing, analytics, product marketing',
    course: 'Google Digital Marketing & E-commerce (Coursera)', courseUrl: 'https://www.coursera.org/professional-certificates/google-digital-marketing-ecommerce',
    exam: 'Google Digital Marketing Certificate', examUrl: 'https://www.coursera.org/professional-certificates/google-digital-marketing-ecommerce',
  },
  // Product Operations / Business Ops
  ops: {
    skills: 'operations management, analytics, process improvement',
    course: 'Google Project Management (Coursera)', courseUrl: 'https://www.coursera.org/professional-certificates/google-project-management',
    exam: 'Lean Six Sigma Green Belt', examUrl: 'https://www.sixsigmacouncil.org/six-sigma-green-belt-certification/',
  },
  // Support Engineer / Technical Support
  support: {
    skills: 'technical support, troubleshooting, customer communication',
    course: 'Google IT Support (Coursera)', courseUrl: 'https://www.coursera.org/professional-certificates/google-it-support',
    exam: 'CompTIA A+', examUrl: 'https://www.comptia.org/certifications/a',
  },
  // Business/Strategy roles
  business: {
    skills: 'business strategy, analytics, stakeholder management',
    course: 'Google Data Analytics (Coursera)', courseUrl: 'https://www.coursera.org/professional-certificates/google-data-analytics',
    exam: 'Google Data Analytics Certificate', examUrl: 'https://www.coursera.org/professional-certificates/google-data-analytics',
  },
  // Compliance / Legal / Risk
  compliance: {
    skills: 'regulatory compliance, risk management, governance',
    course: 'Google Cybersecurity (Coursera)', courseUrl: 'https://www.coursera.org/professional-certificates/google-cybersecurity',
    exam: 'CISA – Certified Information Systems Auditor', examUrl: 'https://www.isaca.org/credentialing/cisa',
  },
  // Finance / Accounting in tech
  finance: {
    skills: 'financial analysis, analytics, business intelligence',
    course: 'Google Data Analytics (Coursera)', courseUrl: 'https://www.coursera.org/professional-certificates/google-data-analytics',
    exam: 'CFA Level I', examUrl: 'https://www.cfainstitute.org/programs/cfa',
  },
};

function classifyRole(title) {
  const tl = title.toLowerCase();
  if (/recruiter|recruiting|talent.?acq/i.test(tl)) return 'recruiter';
  if (/technical.?account|account.?manager.*tech|tam\b/i.test(tl)) return 'tam';
  if (/technical.?program|tpm\b/i.test(tl)) return 'tpm';
  if (/sales.?eng|solutions?.?eng|pre.?sales|field.?eng|enablement/i.test(tl)) return 'sales_eng';
  if (/marketing|brand|comms|communications|content.?strateg/i.test(tl)) return 'marketing';
  if (/operations?.?specialist|tech.?ops|product.?ops|global.?tech.*support|executive.*support/i.test(tl)) return 'ops';
  if (/support.?eng|technical.?support/i.test(tl)) return 'support';
  if (/compliance|legal|regulatory|risk|aml|kyc|fraud.?(?:ops|analyst)/i.test(tl)) return 'compliance';
  if (/finance|accounting|treasury|controller/i.test(tl)) return 'finance';
  if (/business.?develop|business.?strategy|partnerships|commercial(?!.*eng)/i.test(tl)) return 'business';
  // Engineering management (but NOT pure engineering roles)
  if (/(?:engineering|eng)\s*(?:manager|director)|head.?of.?eng|vp.?eng|director.*eng/i.test(tl)) return 'eng_manager';
  if (/(?:director|head|vp|chief).*(?!engineer)/i.test(tl) && !/engineer|developer|architect/i.test(tl)) return 'eng_manager';
  return null; // No issue detected
}

let fixed = 0;
const updated = rows.map(row => {
  const f = parseCsvRow(row);
  const title = f[3] || '';
  const skills = f[5] || '';
  const exam = f[8] || '';

  // Only fix rows with identified issues
  const hasAwsIssue = exam.includes('AWS Solutions Architect') && !/cloud|aws|infra|platform|devops|sre|architect|system/i.test(title) && !/aws/i.test(skills);
  const hasNonEngCoding = /manager|director|lead|head|recruiter|account|sales|operations|strategy|marketing|compliance|legal|finance|talent|support/i.test(title)
    && /ruby|golang|rust|scala|c\+\+/i.test(skills)
    && !/engineering manager|tech lead|data|ml|platform|infrastructure|security|solutions.?arch/i.test(title);
  const hasDevCertMgmt = /Meta Front-End|Meta Back-End|PCEP|JSNAD|Oracle.*Java/i.test(exam) 
    && /manager|director|head|vp|chief/i.test(title) 
    && !/engineering manager|tech lead/i.test(title);
  const hasRecruiterCoding = /recruiter|recruiting|talent/i.test(title) && /ruby|java|python|react|golang/i.test(skills);
  const isVague = skills === 'software engineering' && !/recruiter/i.test(title);

  if (!hasAwsIssue && !hasNonEngCoding && !hasDevCertMgmt && !hasRecruiterCoding && !isVague) return row;

  const roleType = classifyRole(title);
  if (!roleType) return row;

  const mapping = ROLE_MAPS[roleType];
  if (!mapping) return row;

  fixed++;
  f[5] = mapping.skills;
  f[6] = mapping.course;
  f[7] = mapping.courseUrl;
  f[8] = mapping.exam;
  f[9] = mapping.examUrl;
  return f.map(escCsv).join(',');
});

writeFileSync('/Users/vedang/Documents/sg_my_tech_jobs.csv', [header, ...updated].join('\n'));
console.log(`Fixed ${fixed} mismatched rows`);

// Verify
const remaining = updated.filter(row => {
  const f = parseCsvRow(row);
  const title = (f[3] || '').toLowerCase();
  const exam = f[8] || '';
  return exam.includes('AWS Solutions Architect') && !/cloud|aws|infra|platform|devops|sre|architect|system/i.test(title) && !/aws/i.test(f[5]);
}).length;
console.log(`Remaining AWS SA exam on non-cloud roles: ${remaining}`);
