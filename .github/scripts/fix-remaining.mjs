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

let fixed = 0, removed = 0;
const updated = [];

for (const row of rows) {
  const f = parseCsvRow(row);
  const title = f[3] || '';
  const tl = title.toLowerCase();
  const skills = f[5] || '';
  
  // REMOVE non-tech roles entirely (drivers, finance assistants)
  if (/\bdriver\b|delivery staff|lorry/i.test(tl)) { removed++; continue; }

  let changed = false;

  // Fix 1: Engineering Leads/Managers at Airwallex, OKX etc. → keep tech skills, fix cert
  if (/engineering\s*(lead|manager)|eng\s*(lead|manager)/i.test(tl)) {
    if (/Meta Front-End|Meta Back-End|PCEP|JSNAD|Oracle.*Java/i.test(f[8])) {
      f[8] = 'Professional Scrum Master I (PSM I)';
      f[9] = 'https://www.scrum.org/assessments/professional-scrum-master-i-certification';
      changed = true;
    }
  }

  // Fix 2: Design Leads → UX cert, not dev cert
  if (/design\s*(lead|director|manager)|product\s*design\s*lead/i.test(tl)) {
    f[5] = 'ux design, figma, design systems';
    f[6] = 'Google UX Design (Coursera)';
    f[7] = 'https://www.coursera.org/professional-certificates/google-ux-design';
    f[8] = 'Google UX Design Certificate';
    f[9] = 'https://www.coursera.org/professional-certificates/google-ux-design';
    changed = true;
  }

  // Fix 3: Growth Manager / non-eng managers → product/growth
  if (/growth\s*manager|user\s*growth|principal.*growth\s*manager/i.test(tl) && !/engineer/i.test(tl)) {
    f[5] = 'growth marketing, analytics, product management';
    f[6] = 'Reforge Growth Series';
    f[7] = 'https://www.reforge.com/growth-series';
    f[8] = 'Google Data Analytics Certificate';
    f[9] = 'https://www.coursera.org/professional-certificates/google-data-analytics';
    changed = true;
  }

  // Fix 4: Algorithm/ML/AI engineers → ML cert not AWS SA
  if (/algorithm|machine.?learn|ai\s*engineer|ml\s*engineer|research\s*scientist|perception|prediction|mle\b/i.test(tl)) {
    if (f[8].includes('AWS Solutions Architect')) {
      f[8] = 'AWS Machine Learning – Specialty';
      f[9] = 'https://aws.amazon.com/certification/certified-machine-learning-specialty/';
      changed = true;
    }
    // Also fix course if it's System Design
    if (f[6].includes('System Design')) {
      f[6] = 'ML Specialization (Stanford/Coursera)';
      f[7] = 'https://www.coursera.org/specializations/machine-learning-introduction';
      changed = true;
    }
  }

  // Fix 5: Autonomous vehicle / robotics / SLAM / motion planning → robotics-specific
  if (/autonomous|slam|motion\s*planning|calibration|sensor|perception|basemap|map\s*semantics/i.test(tl)) {
    if (f[8].includes('AWS Solutions Architect')) {
      f[8] = 'ROS Developer Certificate';
      f[9] = 'https://www.theconstructsim.com/robotigniteacademy_learnros/ros-courses-library/';
      changed = true;
    }
  }

  // Fix 6: Quantum Computing → quantum cert
  if (/quantum/i.test(tl)) {
    f[5] = 'quantum computing, python, linear algebra';
    f[6] = 'IBM Quantum Learning';
    f[7] = 'https://learning.quantum.ibm.com/';
    f[8] = 'IBM Quantum Developer Certification';
    f[9] = 'https://www.ibm.com/training/certification/C0010300';
    changed = true;
  }

  // Fix 7: Frontend/Backend Staff engineers at OKX → specific certs
  if (/staff.*frontend|staff.*front.end|senior.*frontend.*staff/i.test(tl)) {
    if (f[8].includes('AWS Solutions Architect')) {
      f[8] = 'Meta Front-End Developer Certificate';
      f[9] = 'https://www.coursera.org/professional-certificates/meta-front-end-developer';
      changed = true;
    }
  }

  // Fix 8: Backend/Staff Software Engineers → keep skills, fix exam to match primary skill
  if (/staff.*engineer|senior.*staff|principal.*engineer/i.test(tl) && !/frontend|front.end/i.test(tl)) {
    if (f[8].includes('AWS Solutions Architect') && !/aws/i.test(skills)) {
      // Match exam to primary skill
      if (/java/i.test(skills) && !/javascript/i.test(skills)) {
        f[8] = 'Oracle Certified Professional Java SE';
        f[9] = 'https://education.oracle.com/java-se-programmer/pexam_1Z0-829';
      } else if (/python/i.test(skills)) {
        f[8] = 'PCEP – Certified Entry-Level Python Programmer';
        f[9] = 'https://pythoninstitute.org/pcep';
      } else if (/c\+\+/i.test(skills)) {
        f[8] = 'CPA – C++ Certified Associate Programmer';
        f[9] = 'https://cppinstitute.org/cpa-c-certified-associate-programmer-certification';
      } else if (/golang/i.test(skills)) {
        f[8] = 'Google Associate Cloud Engineer';
        f[9] = 'https://cloud.google.com/learn/certification/cloud-engineer';
      } else if (/react|javascript|typescript/i.test(skills)) {
        f[8] = 'Meta Front-End Developer Certificate';
        f[9] = 'https://www.coursera.org/professional-certificates/meta-front-end-developer';
      } else if (/blockchain/i.test(skills)) {
        f[8] = 'Certified Blockchain Developer';
        f[9] = 'https://www.blockchain-council.org/certifications/certified-blockchain-developer/';
      } else if (/kubernetes|docker/i.test(skills)) {
        f[8] = 'CKA – Certified Kubernetes Administrator';
        f[9] = 'https://training.linuxfoundation.org/certification/certified-kubernetes-administrator-cka/';
      }
      changed = true;
    }
  }

  // Fix 9: Presales / Solutions Architect with "specialist" → vendor cert
  if (/presales|solution.*specialist|strategist|regional\s*vp/i.test(tl)) {
    f[5] = 'solution architecture, cloud computing, stakeholder management';
    f[6] = 'AWS Cloud Practitioner Essentials';
    f[7] = 'https://explore.skillbuilder.aws/learn/course/134/aws-cloud-practitioner-essentials';
    f[8] = 'AWS Cloud Practitioner';
    f[9] = 'https://aws.amazon.com/certification/certified-cloud-practitioner/';
    changed = true;
  }

  // Fix 10: Finance/Ops non-tech roles
  if (/finance\s*system|assistant\s*manager.*finance/i.test(tl)) {
    f[5] = 'financial systems, automation, analytics';
    f[6] = 'Google Data Analytics (Coursera)';
    f[7] = 'https://www.coursera.org/professional-certificates/google-data-analytics';
    f[8] = 'Google Data Analytics Certificate';
    f[9] = 'https://www.coursera.org/professional-certificates/google-data-analytics';
    changed = true;
  }

  // Fix 11: Technical Lead Manager → keep tech skills, management cert
  if (/technical\s*lead\s*manager/i.test(tl)) {
    if (/PCEP|Meta Front/i.test(f[8])) {
      f[8] = 'Professional Scrum Master I (PSM I)';
      f[9] = 'https://www.scrum.org/assessments/professional-scrum-master-i-certification';
      changed = true;
    }
  }

  // Fix 12: ERP/Finance Specialist at GovTech
  if (/erp|finance.*specialist/i.test(tl) && /coding/i.test('') ) {
    f[5] = 'erp systems, sql, business analysis';
    f[6] = 'SAP Learning Hub';
    f[7] = 'https://learning.sap.com/';
    f[8] = 'SAP Certified Associate';
    f[9] = 'https://learning.sap.com/certifications';
    changed = true;
  }

  if (changed) fixed++;
  updated.push(f.map(escCsv).join(','));
}

writeFileSync('/Users/vedang/Documents/sg_my_tech_jobs.csv', [header, ...updated].join('\n'));
console.log(`Fixed: ${fixed}, Removed non-tech: ${removed}`);
console.log(`Final rows: ${updated.length}`);
