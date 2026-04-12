import { readFileSync, writeFileSync } from 'fs';

// Company-specific known tech stacks (when JD fetch fails, use these instead of generic)
const COMPANY_STACKS = {
  'stripe':     ['ruby', 'java', 'golang', 'python', 'sql', 'aws'],
  'coinbase':   ['golang', 'ruby', 'python', 'react', 'sql', 'aws'],
  'gitlab':     ['ruby', 'golang', 'vue', 'postgresql', 'kubernetes', 'gcp'],
  'datadog':    ['golang', 'python', 'java', 'kubernetes', 'aws'],
  'cloudflare': ['rust', 'golang', 'c++', 'linux', 'typescript'],
  'figma':      ['typescript', 'react', 'c++', 'ruby', 'postgresql'],
  'discord':    ['rust', 'python', 'react', 'typescript', 'postgresql'],
  'reddit':     ['python', 'golang', 'typescript', 'react', 'aws', 'kubernetes'],
  'anthropic':  ['python', 'rust', 'typescript', 'machine learning', 'aws'],
  'openai':     ['python', 'rust', 'kubernetes', 'machine learning', 'react'],
};

// Title-based skill inference (smarter than generic fallback)
function inferSkillsFromTitle(title, company) {
  const tl = title.toLowerCase();
  const companyStack = COMPANY_STACKS[company.toLowerCase()] || [];
  
  // If we have company stack, use title to narrow it down
  if (/engineering manager|eng manager/i.test(tl)) return ['system design', ...(companyStack.length ? [companyStack[0]] : ['software engineering'])];
  if (/staff|principal|distinguished/i.test(tl)) return ['system design', ...(companyStack.slice(0, 2))];
  if (/tech.?lead/i.test(tl)) return ['system design', ...(companyStack.slice(0, 2))];
  if (/new grad|junior|associate/i.test(tl) && /engineer|developer|software/i.test(tl)) return companyStack.length ? companyStack.slice(0, 3) : ['python', 'sql', 'javascript'];
  if (/data.?scien|data.?analy/i.test(tl)) return ['python', 'sql', 'data science'];
  if (/data.?engineer/i.test(tl)) return ['python', 'sql', 'data engineering', 'aws'];
  if (/machine.?learn|ml|ai.?eng/i.test(tl)) return ['python', 'machine learning', 'aws'];
  if (/devops|sre|site.?reliab/i.test(tl)) return ['aws', 'kubernetes', 'docker', 'terraform'];
  if (/cloud/i.test(tl)) return ['aws', 'kubernetes', 'terraform'];
  if (/security|cyber|infosec/i.test(tl)) return ['security', 'linux', 'aws'];
  if (/product.?manag/i.test(tl)) return ['product management', 'agile'];
  if (/project.?manag|scrum/i.test(tl)) return ['project management', 'agile'];
  if (/technical.?account|solutions.?eng|sales.?eng|presales/i.test(tl)) return companyStack.length ? ['system design', companyStack[0]] : ['system design', 'aws'];
  if (/technical.?program|tpm/i.test(tl)) return ['project management', 'agile', 'system design'];
  if (/technical.?recruiter|recruiting/i.test(tl)) return ['software engineering'];
  if (/frontend|front.?end/i.test(tl)) return ['react', 'typescript', 'javascript'];
  if (/backend|back.?end/i.test(tl)) return companyStack.length ? companyStack.slice(0, 3) : ['python', 'sql', 'aws'];
  if (/fullstack|full.?stack/i.test(tl)) return companyStack.length ? [...companyStack.slice(0, 2), 'react'] : ['javascript', 'react', 'node', 'sql'];
  if (/mobile|ios|android/i.test(tl)) return /ios/i.test(tl) ? ['swift', 'ios'] : /android/i.test(tl) ? ['kotlin', 'android'] : ['ios', 'android'];
  if (/integration|reliability/i.test(tl)) return companyStack.length ? ['system design', ...companyStack.slice(0, 2)] : ['system design', 'python', 'aws'];
  if (/infrastructure|platform|network/i.test(tl)) return ['aws', 'kubernetes', 'docker', 'linux'];
  if (/qa|quality|test/i.test(tl)) return ['qa', 'python', 'agile'];
  if (/analyst/i.test(tl)) return ['sql', 'python', 'analytics'];
  if (/architect/i.test(tl)) return ['system design', 'aws'];
  if (/blockchain|web3|crypto/i.test(tl)) return ['blockchain', 'solidity', 'python'];
  // Generic software engineer
  if (/engineer|developer|software/i.test(tl)) return companyStack.length ? companyStack.slice(0, 3) : ['python', 'java', 'sql'];
  return companyStack.length ? companyStack.slice(0, 2) : ['software engineering'];
}

const SKILL_DB = {
  'python': { c: 'Python for Everybody (Coursera)', u: 'https://www.coursera.org/specializations/python', e: 'PCEP – Certified Entry-Level Python Programmer', eu: 'https://pythoninstitute.org/pcep' },
  'ruby': { c: 'The Odin Project – Ruby on Rails', u: 'https://www.theodinproject.com/paths/full-stack-ruby-on-rails', e: 'Meta Back-End Developer Certificate', eu: 'https://www.coursera.org/professional-certificates/meta-back-end-developer' },
  'java': { c: 'Java MOOC (University of Helsinki)', u: 'https://java-programming.mooc.fi/', e: 'Oracle Certified Professional Java SE', eu: 'https://education.oracle.com/java-se-programmer/pexam_1Z0-829' },
  'golang': { c: 'Go Official Tour', u: 'https://go.dev/tour/', e: 'Google Associate Cloud Engineer', eu: 'https://cloud.google.com/learn/certification/cloud-engineer' },
  'rust': { c: 'The Rust Programming Language', u: 'https://doc.rust-lang.org/book/', e: 'AWS Solutions Architect – Associate', eu: 'https://aws.amazon.com/certification/certified-solutions-architect-associate/' },
  'javascript': { c: 'The Odin Project – JavaScript', u: 'https://www.theodinproject.com/paths/full-stack-javascript', e: 'Meta Front-End Developer Certificate', eu: 'https://www.coursera.org/professional-certificates/meta-front-end-developer' },
  'typescript': { c: 'TypeScript Handbook', u: 'https://www.typescriptlang.org/docs/handbook/', e: 'Meta Front-End Developer Certificate', eu: 'https://www.coursera.org/professional-certificates/meta-front-end-developer' },
  'react': { c: 'React Official Tutorial', u: 'https://react.dev/learn', e: 'Meta Front-End Developer Certificate', eu: 'https://www.coursera.org/professional-certificates/meta-front-end-developer' },
  'vue': { c: 'Vue.js Official Guide', u: 'https://vuejs.org/guide/introduction.html', e: 'Meta Front-End Developer Certificate', eu: 'https://www.coursera.org/professional-certificates/meta-front-end-developer' },
  'node': { c: 'Node.js Official Learn', u: 'https://nodejs.org/en/learn', e: 'OpenJS JSNAD', eu: 'https://training.linuxfoundation.org/certification/jsnad/' },
  'swift': { c: 'Apple SwiftUI Tutorials', u: 'https://developer.apple.com/tutorials/swiftui', e: 'Meta iOS Developer Certificate', eu: 'https://www.coursera.org/professional-certificates/meta-ios-developer' },
  'kotlin': { c: 'Kotlin Official Docs', u: 'https://kotlinlang.org/docs/getting-started.html', e: 'Google Associate Android Developer', eu: 'https://developers.google.com/certification/associate-android-developer' },
  'scala': { c: 'Scala Official Tour', u: 'https://docs.scala-lang.org/tour/', e: 'Lightbend Scala Professional', eu: 'https://academy.lightbend.com/' },
  'c++': { c: 'LearnCpp.com', u: 'https://www.learncpp.com/', e: 'CPA – C++ Certified Associate', eu: 'https://cppinstitute.org/cpa-c-certified-associate-programmer-certification' },
  'sql': { c: 'SQLBolt – Interactive SQL', u: 'https://sqlbolt.com/', e: 'Oracle SQL Associate', eu: 'https://education.oracle.com/oracle-database-sql-certified-associate/pexam_1Z0-071' },
  'postgresql': { c: 'PostgreSQL Official Tutorial', u: 'https://www.postgresql.org/docs/current/tutorial.html', e: 'Oracle SQL Associate', eu: 'https://education.oracle.com/oracle-database-sql-certified-associate/pexam_1Z0-071' },
  'mongodb': { c: 'MongoDB University (Free)', u: 'https://learn.mongodb.com/', e: 'MongoDB Associate Developer', eu: 'https://learn.mongodb.com/pages/mongodb-associate-developer-exam' },
  'redis': { c: 'Redis University (Free)', u: 'https://university.redis.io/', e: 'Redis Certified Developer', eu: 'https://university.redis.io/certifications/' },
  'kafka': { c: 'Confluent Developer Courses', u: 'https://developer.confluent.io/courses/', e: 'Confluent Certified Developer', eu: 'https://www.confluent.io/certification/' },
  'aws': { c: 'AWS Skill Builder', u: 'https://explore.skillbuilder.aws/', e: 'AWS Solutions Architect – Associate', eu: 'https://aws.amazon.com/certification/certified-solutions-architect-associate/' },
  'kubernetes': { c: 'Kubernetes Official Tutorial', u: 'https://kubernetes.io/docs/tutorials/', e: 'CKA – Certified Kubernetes Admin', eu: 'https://training.linuxfoundation.org/certification/certified-kubernetes-administrator-cka/' },
  'docker': { c: 'Docker Get Started', u: 'https://docs.docker.com/get-started/', e: 'Docker Certified Associate', eu: 'https://training.mirantis.com/dca-certification-exam/' },
  'terraform': { c: 'HashiCorp Terraform Learn', u: 'https://developer.hashicorp.com/terraform/tutorials', e: 'Terraform Associate', eu: 'https://developer.hashicorp.com/certifications/infrastructure-automation' },
  'linux': { c: 'Linux Journey (Free)', u: 'https://linuxjourney.com/', e: 'LFCS', eu: 'https://training.linuxfoundation.org/certification/linux-foundation-certified-sysadmin-lfcs/' },
  'machine learning': { c: 'ML Specialization (Stanford/Coursera)', u: 'https://www.coursera.org/specializations/machine-learning-introduction', e: 'AWS ML Specialty', eu: 'https://aws.amazon.com/certification/certified-machine-learning-specialty/' },
  'data science': { c: 'Google Data Analytics (Coursera)', u: 'https://www.coursera.org/professional-certificates/google-data-analytics', e: 'IBM Data Science Professional', eu: 'https://www.coursera.org/professional-certificates/ibm-data-science' },
  'data engineering': { c: 'Data Engineering Zoomcamp (Free)', u: 'https://github.com/DataTalksClub/data-engineering-zoomcamp', e: 'Google Professional Data Engineer', eu: 'https://cloud.google.com/learn/certification/data-engineer' },
  'analytics': { c: 'Google Data Analytics (Coursera)', u: 'https://www.coursera.org/professional-certificates/google-data-analytics', e: 'Google Data Analytics Certificate', eu: 'https://www.coursera.org/professional-certificates/google-data-analytics' },
  'security': { c: 'Google Cybersecurity (Coursera)', u: 'https://www.coursera.org/professional-certificates/google-cybersecurity', e: 'CompTIA Security+', eu: 'https://www.comptia.org/certifications/security' },
  'devops': { c: 'DevOps Roadmap (roadmap.sh)', u: 'https://roadmap.sh/devops', e: 'AWS DevOps Professional', eu: 'https://aws.amazon.com/certification/certified-devops-engineer-professional/' },
  'blockchain': { c: 'CryptoZombies (Free)', u: 'https://cryptozombies.io/', e: 'Certified Blockchain Developer', eu: 'https://www.blockchain-council.org/certifications/certified-blockchain-developer/' },
  'solidity': { c: 'CryptoZombies (Free)', u: 'https://cryptozombies.io/', e: 'Certified Blockchain Developer', eu: 'https://www.blockchain-council.org/certifications/certified-blockchain-developer/' },
  'ios': { c: 'Apple SwiftUI Tutorials', u: 'https://developer.apple.com/tutorials/swiftui', e: 'Meta iOS Developer Certificate', eu: 'https://www.coursera.org/professional-certificates/meta-ios-developer' },
  'android': { c: 'Android Developer Training (Google)', u: 'https://developer.android.com/courses', e: 'Google Android Developer', eu: 'https://developers.google.com/certification/associate-android-developer' },
  'product management': { c: 'Product School Resources (Free)', u: 'https://productschool.com/resources', e: 'AIPMM Certified Product Manager', eu: 'https://aipmm.com/cpm-certification' },
  'project management': { c: 'Google Project Management (Coursera)', u: 'https://www.coursera.org/professional-certificates/google-project-management', e: 'PMP', eu: 'https://www.pmi.org/certifications/project-management-pmp' },
  'agile': { c: 'Scrum Guide (Official)', u: 'https://scrumguides.org/', e: 'Professional Scrum Master I', eu: 'https://www.scrum.org/assessments/professional-scrum-master-i-certification' },
  'system design': { c: 'System Design Primer (GitHub)', u: 'https://github.com/donnemartin/system-design-primer', e: 'AWS Solutions Architect – Associate', eu: 'https://aws.amazon.com/certification/certified-solutions-architect-associate/' },
  'software engineering': { c: 'Software Engineering Roadmap (roadmap.sh)', u: 'https://roadmap.sh/software-design-architecture', e: 'AWS Solutions Architect – Associate', eu: 'https://aws.amazon.com/certification/certified-solutions-architect-associate/' },
  'qa': { c: 'ISTQB Foundation Syllabus', u: 'https://www.istqb.org/certifications/certified-tester-foundation-level', e: 'ISTQB Certified Tester', eu: 'https://www.istqb.org/certifications/certified-tester-foundation-level' },
  'gcp': { c: 'Google Cloud Skills Boost', u: 'https://www.cloudskillsboost.google/', e: 'Google Cloud Engineer', eu: 'https://cloud.google.com/learn/certification/cloud-engineer' },
};

// Bad generic combos that indicate failed JD fetch
const GENERIC_SKILLS = new Set([
  'javascript', 'python, javascript, sql', 'software engineering',
  'aws, kubernetes, docker', 'system design, aws', 'python, sql, node',
]);

function parseCsvRow(row) {
  const f = []; let cur = ''; let inQ = false;
  for (let i = 0; i < row.length; i++) {
    if (row[i] === '"') { if (inQ && row[i+1] === '"') { cur += '"'; i++; } else inQ = !inQ; }
    else if (row[i] === ',' && !inQ) { f.push(cur); cur = ''; } else { cur += row[i]; }
  }
  f.push(cur); return f;
}
function escCsv(s) { if (!s) return ''; if (s.includes(',') || s.includes('"') || s.includes('\n')) return '"' + s.replace(/"/g, '""') + '"'; return s; }

function pickResource(skills) {
  const r = SKILL_DB[skills[0]] || SKILL_DB['software engineering'];
  return { course: r.c, courseUrl: r.u, exam: r.e, examUrl: r.eu };
}

const csv = readFileSync('/Users/vedang/Documents/sg_my_tech_jobs.csv', 'utf-8');
const lines = csv.split('\n');
const header = lines[0];
const rows = lines.slice(1).filter(l => l.trim());

let fixed = 0;
const updated = rows.map(row => {
  const f = parseCsvRow(row);
  const skills = f[5] || '';
  const company = f[0] || '';
  const title = f[3] || '';

  // NS (Network School) - manual override based on actual JD shared by user
  if (company.includes('NS') && company.includes('Network School')) {
    fixed++;
    if (/engineer/i.test(title)) {
      // From JD: "Django, PostgreSQL, React, Node, TypeScript, Docker, AWS, Redis, Next.js, Solidity, Rust, Git, Tailwind"
      // Primary: Full-stack Django+React, crypto-adjacent
      f[5] = 'python, django, react, typescript, postgresql, docker, aws, solidity, rust';
      f[6] = 'Django for Beginners (Free Book)';
      f[7] = 'https://djangoforbeginners.com/';
      f[8] = 'AWS Solutions Architect – Associate';
      f[9] = 'https://aws.amazon.com/certification/certified-solutions-architect-associate/';
    } else if (/tutor/i.test(title)) {
      // From JD: "fast.ai, Jeremy Howard, Dan Boneh cryptography, decentralized science, AI/ML, Python"
      // Primary: Teaching AI + crypto to students
      f[5] = 'python, machine learning, ai, blockchain, data science';
      f[6] = 'Practical Deep Learning for Coders (fast.ai)';
      f[7] = 'https://course.fast.ai/';
      f[8] = 'Google Cloud Professional ML Engineer';
      f[9] = 'https://cloud.google.com/learn/certification/machine-learning-engineer';
    }
    return f.map(escCsv).join(',');
  }

  if (!GENERIC_SKILLS.has(skills)) return row;

  const newSkills = inferSkillsFromTitle(title, company);
  
  if (newSkills.join(', ') === skills) return row; // No change

  fixed++;
  const { course, courseUrl, exam, examUrl } = pickResource(newSkills);
  f[5] = newSkills.join(', ');
  f[6] = course; f[7] = courseUrl; f[8] = exam; f[9] = examUrl;
  return f.map(escCsv).join(',');
});

writeFileSync('/Users/vedang/Documents/sg_my_tech_jobs.csv', [header, ...updated].join('\n'));
console.log(`Fixed ${fixed} rows with smarter title+company inference`);

