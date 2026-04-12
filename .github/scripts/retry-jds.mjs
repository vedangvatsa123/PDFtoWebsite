import { readFileSync, writeFileSync } from 'fs';

// Company name (lowercase) → [ATS type, board slug]
const SLUGS = {
  'airwallex':        ['ashby', 'airwallex'],
  'grab':             ['smartrecruiters', 'Grab'],
  'visa':             ['smartrecruiters', 'Visa'],
  'govtech singapore':['greenhouse', 'govtechsingapore'],
  'delivery hero':    ['greenhouse', 'deliveryhero'],
  'openai':           ['ashby', 'openai'],
  'snowflake':        ['ashby', 'snowflake'],
  'coinhako':         ['ashby', 'coinhako'],
  'wise':             ['greenhouse', 'wise'],
  'ninjavan':         ['lever', 'ninjavan'],
  'cohere':           ['ashby', 'cohere'],
  'servicenow':       ['smartrecruiters', 'ServiceNow'],
  'notion':           ['ashby', 'notion'],
  'agoda':            ['greenhouse', 'agoda'],
};

const SKILL_PATTERNS = [
  [/\bpython\b/i, 'python'], [/\bdjango\b/i, 'django'], [/\bflask\b/i, 'flask'], [/\bfastapi\b/i, 'fastapi'],
  [/\bjava\b(?!script)/i, 'java'], [/\bspring\b/i, 'spring'],
  [/\breact\s*native\b/i, 'react native'], [/\breact\b/i, 'react'],
  [/\bnext\.?js\b/i, 'nextjs'], [/\bvue\.?js?\b/i, 'vue'], [/\bangular\b/i, 'angular'],
  [/\bjavascript\b/i, 'javascript'], [/\btypescript\b/i, 'typescript'],
  [/\bnode\.?js?\b/i, 'node'], [/\bgolang\b|\bgo\s+(?:lang|programming)/i, 'golang'],
  [/\brust\b/i, 'rust'], [/\bkotlin\b/i, 'kotlin'], [/\bswift\b/i, 'swift'],
  [/\bscala\b/i, 'scala'], [/\bruby\b|\brails\b/i, 'ruby'], [/\bphp\b|\blaravel\b/i, 'php'],
  [/\bc\+\+\b/i, 'c++'], [/\bc#\b|\.net\b/i, 'c#'],
  [/\bsql\b/i, 'sql'], [/\bpostgres(?:ql)?\b/i, 'postgresql'], [/\bmysql\b/i, 'mysql'],
  [/\bmongodb\b/i, 'mongodb'], [/\bredis\b/i, 'redis'],
  [/\bkafka\b/i, 'kafka'], [/\belasticsearch\b/i, 'elasticsearch'], [/\bgraphql\b/i, 'graphql'],
  [/\baws\b|\bamazon\s*web/i, 'aws'], [/\bazure\b/i, 'azure'], [/\bgcp\b|\bgoogle\s*cloud/i, 'gcp'],
  [/\bkubernetes\b|\bk8s\b/i, 'kubernetes'], [/\bdocker\b|\bcontainer/i, 'docker'],
  [/\bterraform\b/i, 'terraform'], [/\bansible\b/i, 'ansible'], [/\blinux\b/i, 'linux'],
  [/\bmachine\s*learn/i, 'machine learning'], [/\bdeep\s*learn/i, 'deep learning'],
  [/\bnlp\b|\bnatural\s*language/i, 'nlp'], [/\bcomputer\s*vision/i, 'computer vision'],
  [/\bartificial\s*intelligence\b|\bai\/ml\b|\bgen\s*ai\b|\bllm\b/i, 'ai'],
  [/\bdata\s*scien/i, 'data science'], [/\bdata\s*engineer/i, 'data engineering'],
  [/\banalytics\b|\banalyst\b/i, 'analytics'],
  [/\bcybersecurity\b|\binfosec\b/i, 'cybersecurity'], [/\bsecurity\b/i, 'security'],
  [/\bdevops\b/i, 'devops'], [/\bsre\b|\bsite\s*reliab/i, 'sre'],
  [/\bblockchain\b|\bweb3\b/i, 'blockchain'], [/\bsolidity\b/i, 'solidity'],
  [/\bios\b/i, 'ios'], [/\bandroid\b/i, 'android'], [/\bflutter\b/i, 'flutter'],
  [/\bproduct\s*manag/i, 'product management'], [/\bproject\s*manag/i, 'project management'],
  [/\bagile\b|\bscrum\b/i, 'agile'], [/\bembedded\b|\bfirmware\b/i, 'embedded'],
  [/\bqa\b|\bquality\s*assur/i, 'qa'], [/\btest(?:ing|er|ability)\b/i, 'testing'],
];

const GENERIC = ['python, javascript, sql', 'software engineering', 'aws, kubernetes, docker', 'system design, aws', 'python, sql, node'];

const SKILL_DB = {
  'python': { course: 'Python for Everybody (Coursera)', url: 'https://www.coursera.org/specializations/python', exam: 'PCEP – Certified Entry-Level Python Programmer', examUrl: 'https://pythoninstitute.org/pcep' },
  'django': { course: 'Django Official Tutorial', url: 'https://docs.djangoproject.com/en/5.0/intro/tutorial01/', exam: 'PCEP – Certified Entry-Level Python Programmer', examUrl: 'https://pythoninstitute.org/pcep' },
  'java': { course: 'Java MOOC (University of Helsinki)', url: 'https://java-programming.mooc.fi/', exam: 'Oracle Certified Professional Java SE', examUrl: 'https://education.oracle.com/java-se-programmer/pexam_1Z0-829' },
  'spring': { course: 'Spring Official Guides', url: 'https://spring.io/guides', exam: 'VMware Spring Professional', examUrl: 'https://www.vmware.com/learning/certification/spring-professional.html' },
  'javascript': { course: 'The Odin Project – JavaScript', url: 'https://www.theodinproject.com/paths/full-stack-javascript', exam: 'Meta Front-End Developer Certificate', examUrl: 'https://www.coursera.org/professional-certificates/meta-front-end-developer' },
  'typescript': { course: 'TypeScript Handbook (Official)', url: 'https://www.typescriptlang.org/docs/handbook/', exam: 'Meta Front-End Developer Certificate', examUrl: 'https://www.coursera.org/professional-certificates/meta-front-end-developer' },
  'react': { course: 'React Official Tutorial', url: 'https://react.dev/learn', exam: 'Meta Front-End Developer Certificate', examUrl: 'https://www.coursera.org/professional-certificates/meta-front-end-developer' },
  'node': { course: 'Node.js Official Learn', url: 'https://nodejs.org/en/learn', exam: 'OpenJS Node.js Application Developer (JSNAD)', examUrl: 'https://training.linuxfoundation.org/certification/jsnad/' },
  'golang': { course: 'Go Official Tour', url: 'https://go.dev/tour/', exam: 'Google Associate Cloud Engineer', examUrl: 'https://cloud.google.com/learn/certification/cloud-engineer' },
  'rust': { course: 'The Rust Programming Language', url: 'https://doc.rust-lang.org/book/', exam: 'AWS Solutions Architect – Associate', examUrl: 'https://aws.amazon.com/certification/certified-solutions-architect-associate/' },
  'kotlin': { course: 'Kotlin Official Docs', url: 'https://kotlinlang.org/docs/getting-started.html', exam: 'Google Associate Android Developer', examUrl: 'https://developers.google.com/certification/associate-android-developer' },
  'scala': { course: 'Scala Official Tour', url: 'https://docs.scala-lang.org/tour/tour-of-scala.html', exam: 'Lightbend Scala Professional', examUrl: 'https://academy.lightbend.com/' },
  'sql': { course: 'SQLBolt – Interactive SQL Lessons', url: 'https://sqlbolt.com/', exam: 'Oracle Database SQL Certified Associate', examUrl: 'https://education.oracle.com/oracle-database-sql-certified-associate/pexam_1Z0-071' },
  'postgresql': { course: 'PostgreSQL Official Tutorial', url: 'https://www.postgresql.org/docs/current/tutorial.html', exam: 'Oracle Database SQL Certified Associate', examUrl: 'https://education.oracle.com/oracle-database-sql-certified-associate/pexam_1Z0-071' },
  'mongodb': { course: 'MongoDB University (Free)', url: 'https://learn.mongodb.com/', exam: 'MongoDB Associate Developer', examUrl: 'https://learn.mongodb.com/pages/mongodb-associate-developer-exam' },
  'redis': { course: 'Redis University (Free)', url: 'https://university.redis.io/', exam: 'Redis Certified Developer', examUrl: 'https://university.redis.io/certifications/' },
  'kafka': { course: 'Confluent Developer Courses', url: 'https://developer.confluent.io/courses/', exam: 'Confluent Certified Developer for Apache Kafka', examUrl: 'https://www.confluent.io/certification/' },
  'aws': { course: 'AWS Skill Builder (Free Tier)', url: 'https://explore.skillbuilder.aws/', exam: 'AWS Solutions Architect – Associate', examUrl: 'https://aws.amazon.com/certification/certified-solutions-architect-associate/' },
  'azure': { course: 'Microsoft Learn – Azure (Free)', url: 'https://learn.microsoft.com/en-us/training/azure/', exam: 'AZ-900: Microsoft Azure Fundamentals', examUrl: 'https://learn.microsoft.com/en-us/credentials/certifications/azure-fundamentals/' },
  'gcp': { course: 'Google Cloud Skills Boost (Free)', url: 'https://www.cloudskillsboost.google/', exam: 'Google Associate Cloud Engineer', examUrl: 'https://cloud.google.com/learn/certification/cloud-engineer' },
  'kubernetes': { course: 'Kubernetes Official Tutorial', url: 'https://kubernetes.io/docs/tutorials/', exam: 'CKA – Certified Kubernetes Administrator', examUrl: 'https://training.linuxfoundation.org/certification/certified-kubernetes-administrator-cka/' },
  'docker': { course: 'Docker Official Get Started', url: 'https://docs.docker.com/get-started/', exam: 'Docker Certified Associate (DCA)', examUrl: 'https://training.mirantis.com/dca-certification-exam/' },
  'terraform': { course: 'HashiCorp Learn – Terraform', url: 'https://developer.hashicorp.com/terraform/tutorials', exam: 'HashiCorp Terraform Associate', examUrl: 'https://developer.hashicorp.com/certifications/infrastructure-automation' },
  'linux': { course: 'Linux Journey (Free)', url: 'https://linuxjourney.com/', exam: 'LFCS – Linux Foundation Certified SysAdmin', examUrl: 'https://training.linuxfoundation.org/certification/linux-foundation-certified-sysadmin-lfcs/' },
  'machine learning': { course: 'Machine Learning Specialization (Stanford/Coursera)', url: 'https://www.coursera.org/specializations/machine-learning-introduction', exam: 'AWS Machine Learning – Specialty', examUrl: 'https://aws.amazon.com/certification/certified-machine-learning-specialty/' },
  'deep learning': { course: 'Deep Learning Specialization (Coursera)', url: 'https://www.coursera.org/specializations/deep-learning', exam: 'TensorFlow Developer Certificate', examUrl: 'https://www.tensorflow.org/certificate' },
  'nlp': { course: 'Hugging Face NLP Course (Free)', url: 'https://huggingface.co/learn/nlp-course', exam: 'AWS Machine Learning – Specialty', examUrl: 'https://aws.amazon.com/certification/certified-machine-learning-specialty/' },
  'ai': { course: 'Elements of AI (University of Helsinki)', url: 'https://www.elementsofai.com/', exam: 'Google Cloud Professional ML Engineer', examUrl: 'https://cloud.google.com/learn/certification/machine-learning-engineer' },
  'data science': { course: 'Google Data Analytics Certificate (Coursera)', url: 'https://www.coursera.org/professional-certificates/google-data-analytics', exam: 'IBM Data Science Professional Certificate', examUrl: 'https://www.coursera.org/professional-certificates/ibm-data-science' },
  'data engineering': { course: 'Data Engineering Zoomcamp (Free)', url: 'https://github.com/DataTalksClub/data-engineering-zoomcamp', exam: 'Google Professional Data Engineer', examUrl: 'https://cloud.google.com/learn/certification/data-engineer' },
  'analytics': { course: 'Google Data Analytics (Coursera)', url: 'https://www.coursera.org/professional-certificates/google-data-analytics', exam: 'Google Data Analytics Certificate', examUrl: 'https://www.coursera.org/professional-certificates/google-data-analytics' },
  'security': { course: 'Google Cybersecurity Certificate (Coursera)', url: 'https://www.coursera.org/professional-certificates/google-cybersecurity', exam: 'CompTIA Security+', examUrl: 'https://www.comptia.org/certifications/security' },
  'devops': { course: 'DevOps Roadmap (roadmap.sh)', url: 'https://roadmap.sh/devops', exam: 'AWS DevOps Engineer – Professional', examUrl: 'https://aws.amazon.com/certification/certified-devops-engineer-professional/' },
  'sre': { course: 'Google SRE Book (Free)', url: 'https://sre.google/sre-book/table-of-contents/', exam: 'CKA – Certified Kubernetes Administrator', examUrl: 'https://training.linuxfoundation.org/certification/certified-kubernetes-administrator-cka/' },
  'blockchain': { course: 'CryptoZombies (Free)', url: 'https://cryptozombies.io/', exam: 'Certified Blockchain Developer', examUrl: 'https://www.blockchain-council.org/certifications/certified-blockchain-developer/' },
  'ios': { course: 'Apple SwiftUI Tutorials', url: 'https://developer.apple.com/tutorials/swiftui', exam: 'Meta iOS Developer Certificate', examUrl: 'https://www.coursera.org/professional-certificates/meta-ios-developer' },
  'android': { course: 'Android Developer Training (Google)', url: 'https://developer.android.com/courses', exam: 'Google Associate Android Developer', examUrl: 'https://developers.google.com/certification/associate-android-developer' },
  'product management': { course: 'Product School Resources (Free)', url: 'https://productschool.com/resources', exam: 'AIPMM Certified Product Manager', examUrl: 'https://aipmm.com/cpm-certification' },
  'project management': { course: 'Google Project Management (Coursera)', url: 'https://www.coursera.org/professional-certificates/google-project-management', exam: 'PMP – Project Management Professional', examUrl: 'https://www.pmi.org/certifications/project-management-pmp' },
  'agile': { course: 'Scrum Guide (Official, Free)', url: 'https://scrumguides.org/', exam: 'Professional Scrum Master I (PSM I)', examUrl: 'https://www.scrum.org/assessments/professional-scrum-master-i-certification' },
  'system design': { course: 'System Design Primer (GitHub)', url: 'https://github.com/donnemartin/system-design-primer', exam: 'AWS Solutions Architect – Associate', examUrl: 'https://aws.amazon.com/certification/certified-solutions-architect-associate/' },
  'software engineering': { course: 'Software Engineering Roadmap (roadmap.sh)', url: 'https://roadmap.sh/software-design-architecture', exam: 'AWS Solutions Architect – Associate', examUrl: 'https://aws.amazon.com/certification/certified-solutions-architect-associate/' },
  'qa': { course: 'ISTQB Foundation Syllabus (Free)', url: 'https://www.istqb.org/certifications/certified-tester-foundation-level', exam: 'ISTQB Certified Tester Foundation Level', examUrl: 'https://www.istqb.org/certifications/certified-tester-foundation-level' },
  'embedded': { course: 'LearnCpp.com', url: 'https://www.learncpp.com/', exam: 'CPA – C++ Certified Associate Programmer', examUrl: 'https://cppinstitute.org/cpa-c-certified-associate-programmer-certification' },
};

function pickResource(skills, title) {
  const tl = title.toLowerCase();
  let primary = skills[0];
  if (/django/i.test(tl)) primary = 'django';
  else if (/spring/i.test(tl)) primary = 'spring';
  else if (/flutter/i.test(tl)) primary = 'flutter';
  else if (/android/i.test(tl)) primary = 'android';
  else if (/ios|swift/i.test(tl)) primary = 'ios';
  else if (/machine.?learn|ml.?eng|deep.?learn/i.test(tl)) primary = 'machine learning';
  else if (/nlp|natural.?language/i.test(tl)) primary = 'nlp';
  else if (/data.?scien|data.?analy/i.test(tl)) primary = 'data science';
  else if (/data.?engineer/i.test(tl)) primary = 'data engineering';
  else if (/devops/i.test(tl)) primary = 'devops';
  else if (/sre|site.?reliab/i.test(tl)) primary = 'sre';
  else if (/cloud/i.test(tl)) primary = 'aws';
  else if (/kubernetes|k8s/i.test(tl)) primary = 'kubernetes';
  else if (/security|cyber/i.test(tl)) primary = 'security';
  else if (/blockchain|web3|crypto/i.test(tl)) primary = 'blockchain';
  else if (/architect/i.test(tl)) primary = 'system design';
  else if (/product.?manag/i.test(tl)) primary = 'product management';
  else if (/qa|quality|test/i.test(tl)) primary = 'qa';
  else if (/engineering.?manager|tech.?lead|staff|principal/i.test(tl)) primary = 'system design';
  else if (/frontend|front.?end/i.test(tl)) primary = 'react';
  else if (/backend|back.?end/i.test(tl)) primary = skills.includes('java') ? 'java' : skills.includes('golang') ? 'golang' : 'python';
  else if (/fullstack|full.?stack/i.test(tl)) primary = 'javascript';
  const r = SKILL_DB[primary] || SKILL_DB[skills[0]] || SKILL_DB['software engineering'];
  return { course: r.course, courseUrl: r.url, exam: r.exam, examUrl: r.examUrl };
}

function parseCsvRow(row) {
  const fields = []; let current = ''; let inQuotes = false;
  for (let i = 0; i < row.length; i++) {
    if (row[i] === '"') { if (inQuotes && row[i+1] === '"') { current += '"'; i++; } else inQuotes = !inQuotes; }
    else if (row[i] === ',' && !inQuotes) { fields.push(current); current = ''; }
    else { current += row[i]; }
  }
  fields.push(current); return fields;
}
function escCsv(s) { if (!s) return ''; if (s.includes(',') || s.includes('"') || s.includes('\n')) return '"' + s.replace(/"/g, '""') + '"'; return s; }

async function fetchJD(atsType, slug, applyUrl) {
  try {
    if (atsType === 'greenhouse') {
      const idMatch = applyUrl.match(/(?:jid=|jobs\/)(\d+)/);
      if (!idMatch) return '';
      const r = await fetch(`https://boards-api.greenhouse.io/v1/boards/${slug}/jobs/${idMatch[1]}`);
      if (r.ok) { const d = await r.json(); return ((d.content || '') + ' ' + (d.departments?.map(x => x.name).join(' ') || '')).replace(/<[^>]+>/g, ' '); }
    }
    if (atsType === 'ashby') {
      // Fetch all postings from the board, find matching one
      const r = await fetch(`https://api.ashbyhq.com/posting-api/job-board/${slug}`);
      if (r.ok) {
        const d = await r.json();
        // Try to find the posting by URL match
        for (const j of (d.jobs || [])) {
          const postUrl = `https://jobs.ashbyhq.com/${slug}/${j.id}`;
          if (applyUrl.includes(j.id)) {
            const r2 = await fetch(`https://api.ashbyhq.com/posting-api/posting/${j.id}`);
            if (r2.ok) { const p = await r2.json(); return ((p.descriptionHtml || p.descriptionPlain || '')).replace(/<[^>]+>/g, ' '); }
          }
        }
        // Fallback: find by title substring in apply URL
        return ''; // board-level only, no individual JD
      }
    }
    if (atsType === 'lever') {
      const m = applyUrl.match(/lever\.co\/([^/]+)\/([a-f0-9-]+)/);
      if (m) {
        const r = await fetch(`https://api.lever.co/v0/postings/${m[1]}/${m[2]}`);
        if (r.ok) { const d = await r.json(); return (d.descriptionPlain || '') + ' ' + (d.additionalPlain || '') + ' ' + (d.lists?.map(l => l.text + ' ' + l.content).join(' ') || ''); }
      }
    }
    if (atsType === 'smartrecruiters') {
      const m = applyUrl.match(/smartrecruiters\.com\/([^/]+)\/(\d+)/);
      if (m) {
        const r = await fetch(`https://api.smartrecruiters.com/v1/companies/${m[1]}/postings/${m[2]}`);
        if (r.ok) { const d = await r.json(); return (d.jobAd?.sections?.jobDescription?.text || '') + ' ' + (d.jobAd?.sections?.qualifications?.text || '') + ' ' + (d.jobAd?.sections?.additionalInformation?.text || ''); }
      }
    }
  } catch {}
  return '';
}

async function main() {
  const csv = readFileSync('/Users/vedang/Documents/sg_my_tech_jobs.csv', 'utf-8');
  const lines = csv.split('\n');
  const header = lines[0];
  const rows = lines.slice(1).filter(l => l.trim());
  console.log(`Loaded ${rows.length} rows`);

  let retried = 0, fixed = 0;
  const updated = [];

  for (let i = 0; i < rows.length; i += 50) {
    const batch = rows.slice(i, i + 50);
    const results = await Promise.all(batch.map(async (row) => {
      const fields = parseCsvRow(row);
      const skills = fields[5] || '';
      if (!GENERIC.includes(skills)) return row;

      const company = (fields[0] || '').toLowerCase().trim();
      const title = fields[3] || '';
      const applyUrl = fields[4] || '';

      const slugInfo = SLUGS[company];
      if (!slugInfo) return row;

      retried++;
      const [atsType, slug] = slugInfo;
      const jd = await fetchJD(atsType, slug, applyUrl);
      if (jd.length < 50) return row;

      const newSkills = [];
      const added = new Set();
      for (const [pat, skill] of SKILL_PATTERNS) {
        if (pat.test(jd + ' ' + title) && !added.has(skill)) { newSkills.push(skill); added.add(skill); }
      }
      if (newSkills.length === 0) return row;

      fixed++;
      const { course, courseUrl, exam, examUrl } = pickResource(newSkills, title);
      fields[5] = newSkills.join(', ');
      fields[6] = course; fields[7] = courseUrl;
      fields[8] = exam; fields[9] = examUrl;
      return fields.map(escCsv).join(',');
    }));
    updated.push(...results);
    console.log(`  ${Math.min(i + 50, rows.length)}/${rows.length} (retried: ${retried}, fixed: ${fixed})`);
  }

  writeFileSync('/Users/vedang/Documents/sg_my_tech_jobs.csv', [header, ...updated].join('\n'));
  console.log(`Done! Retried: ${retried}, Fixed: ${fixed}`);
}

main().catch(console.error);
