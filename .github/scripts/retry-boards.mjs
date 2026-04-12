import { readFileSync, writeFileSync } from 'fs';

const SKILL_PATTERNS = [
  [/\bpython\b/i, 'python'], [/\bdjango\b/i, 'django'], [/\bflask\b/i, 'flask'],
  [/\bjava\b(?!script)/i, 'java'], [/\bspring\b/i, 'spring'],
  [/\breact\s*native\b/i, 'react native'], [/\breact\b/i, 'react'],
  [/\bnext\.?js\b/i, 'nextjs'], [/\bvue\.?js?\b/i, 'vue'], [/\bangular\b/i, 'angular'],
  [/\bjavascript\b/i, 'javascript'], [/\btypescript\b/i, 'typescript'],
  [/\bnode\.?js?\b/i, 'node'], [/\bgolang\b/i, 'golang'],
  [/\brust\b/i, 'rust'], [/\bkotlin\b/i, 'kotlin'], [/\bswift\b/i, 'swift'],
  [/\bscala\b/i, 'scala'], [/\bruby\b|\brails\b/i, 'ruby'], [/\bphp\b/i, 'php'],
  [/\bc\+\+\b/i, 'c++'], [/\bc#\b|\.net\b/i, 'c#'],
  [/\bsql\b/i, 'sql'], [/\bpostgres/i, 'postgresql'], [/\bmysql\b/i, 'mysql'],
  [/\bmongodb\b/i, 'mongodb'], [/\bredis\b/i, 'redis'], [/\bkafka\b/i, 'kafka'],
  [/\belasticsearch\b/i, 'elasticsearch'], [/\bgraphql\b/i, 'graphql'],
  [/\baws\b/i, 'aws'], [/\bazure\b/i, 'azure'], [/\bgcp\b|\bgoogle\s*cloud/i, 'gcp'],
  [/\bkubernetes\b|\bk8s\b/i, 'kubernetes'], [/\bdocker\b|\bcontainer/i, 'docker'],
  [/\bterraform\b/i, 'terraform'], [/\blinux\b/i, 'linux'],
  [/\bmachine\s*learn/i, 'machine learning'], [/\bdeep\s*learn/i, 'deep learning'],
  [/\bnlp\b/i, 'nlp'], [/\bllm\b|\bgen\s*ai\b/i, 'ai'],
  [/\bdata\s*scien/i, 'data science'], [/\bdata\s*engineer/i, 'data engineering'],
  [/\banalytics\b|\banalyst\b/i, 'analytics'], [/\bsecurity\b/i, 'security'],
  [/\bdevops\b/i, 'devops'], [/\bblockchain\b|\bweb3\b/i, 'blockchain'],
  [/\bios\b/i, 'ios'], [/\bandroid\b/i, 'android'], [/\bflutter\b/i, 'flutter'],
  [/\bproduct\s*manag/i, 'product management'],
  [/\bagile\b|\bscrum\b/i, 'agile'], [/\bqa\b/i, 'qa'],
];
const GENERIC = ['python, javascript, sql', 'software engineering', 'aws, kubernetes, docker', 'system design, aws', 'python, sql, node'];
const SKILL_DB = {
  'python': { c: 'Python for Everybody (Coursera)', u: 'https://www.coursera.org/specializations/python', e: 'PCEP – Certified Entry-Level Python Programmer', eu: 'https://pythoninstitute.org/pcep' },
  'java': { c: 'Java MOOC (University of Helsinki)', u: 'https://java-programming.mooc.fi/', e: 'Oracle Certified Professional Java SE', eu: 'https://education.oracle.com/java-se-programmer/pexam_1Z0-829' },
  'spring': { c: 'Spring Official Guides', u: 'https://spring.io/guides', e: 'VMware Spring Professional', eu: 'https://www.vmware.com/learning/certification/spring-professional.html' },
  'javascript': { c: 'The Odin Project – JavaScript', u: 'https://www.theodinproject.com/paths/full-stack-javascript', e: 'Meta Front-End Developer Certificate', eu: 'https://www.coursera.org/professional-certificates/meta-front-end-developer' },
  'typescript': { c: 'TypeScript Handbook', u: 'https://www.typescriptlang.org/docs/handbook/', e: 'Meta Front-End Developer Certificate', eu: 'https://www.coursera.org/professional-certificates/meta-front-end-developer' },
  'react': { c: 'React Official Tutorial', u: 'https://react.dev/learn', e: 'Meta Front-End Developer Certificate', eu: 'https://www.coursera.org/professional-certificates/meta-front-end-developer' },
  'node': { c: 'Node.js Official Learn', u: 'https://nodejs.org/en/learn', e: 'OpenJS JSNAD', eu: 'https://training.linuxfoundation.org/certification/jsnad/' },
  'golang': { c: 'Go Official Tour', u: 'https://go.dev/tour/', e: 'Google Cloud Engineer', eu: 'https://cloud.google.com/learn/certification/cloud-engineer' },
  'kotlin': { c: 'Kotlin Official Docs', u: 'https://kotlinlang.org/docs/getting-started.html', e: 'Google Android Developer', eu: 'https://developers.google.com/certification/associate-android-developer' },
  'scala': { c: 'Scala Official Tour', u: 'https://docs.scala-lang.org/tour/', e: 'Lightbend Scala Professional', eu: 'https://academy.lightbend.com/' },
  'sql': { c: 'SQLBolt', u: 'https://sqlbolt.com/', e: 'Oracle SQL Associate', eu: 'https://education.oracle.com/oracle-database-sql-certified-associate/pexam_1Z0-071' },
  'aws': { c: 'AWS Skill Builder', u: 'https://explore.skillbuilder.aws/', e: 'AWS Solutions Architect – Associate', eu: 'https://aws.amazon.com/certification/certified-solutions-architect-associate/' },
  'kubernetes': { c: 'Kubernetes Tutorial', u: 'https://kubernetes.io/docs/tutorials/', e: 'CKA', eu: 'https://training.linuxfoundation.org/certification/certified-kubernetes-administrator-cka/' },
  'docker': { c: 'Docker Get Started', u: 'https://docs.docker.com/get-started/', e: 'Docker Certified Associate', eu: 'https://training.mirantis.com/dca-certification-exam/' },
  'terraform': { c: 'HashiCorp Terraform', u: 'https://developer.hashicorp.com/terraform/tutorials', e: 'Terraform Associate', eu: 'https://developer.hashicorp.com/certifications/infrastructure-automation' },
  'machine learning': { c: 'ML Specialization (Stanford)', u: 'https://www.coursera.org/specializations/machine-learning-introduction', e: 'AWS ML Specialty', eu: 'https://aws.amazon.com/certification/certified-machine-learning-specialty/' },
  'data science': { c: 'Google Data Analytics (Coursera)', u: 'https://www.coursera.org/professional-certificates/google-data-analytics', e: 'IBM Data Science Professional', eu: 'https://www.coursera.org/professional-certificates/ibm-data-science' },
  'data engineering': { c: 'Data Engineering Zoomcamp', u: 'https://github.com/DataTalksClub/data-engineering-zoomcamp', e: 'Google Data Engineer', eu: 'https://cloud.google.com/learn/certification/data-engineer' },
  'analytics': { c: 'Google Data Analytics (Coursera)', u: 'https://www.coursera.org/professional-certificates/google-data-analytics', e: 'Google Data Analytics Certificate', eu: 'https://www.coursera.org/professional-certificates/google-data-analytics' },
  'security': { c: 'Google Cybersecurity (Coursera)', u: 'https://www.coursera.org/professional-certificates/google-cybersecurity', e: 'CompTIA Security+', eu: 'https://www.comptia.org/certifications/security' },
  'devops': { c: 'DevOps Roadmap (roadmap.sh)', u: 'https://roadmap.sh/devops', e: 'AWS DevOps Professional', eu: 'https://aws.amazon.com/certification/certified-devops-engineer-professional/' },
  'blockchain': { c: 'CryptoZombies', u: 'https://cryptozombies.io/', e: 'Certified Blockchain Developer', eu: 'https://www.blockchain-council.org/certifications/certified-blockchain-developer/' },
  'product management': { c: 'Product School Resources', u: 'https://productschool.com/resources', e: 'AIPMM Certified PM', eu: 'https://aipmm.com/cpm-certification' },
  'system design': { c: 'System Design Primer (GitHub)', u: 'https://github.com/donnemartin/system-design-primer', e: 'AWS Solutions Architect – Associate', eu: 'https://aws.amazon.com/certification/certified-solutions-architect-associate/' },
  'software engineering': { c: 'Software Engineering Roadmap', u: 'https://roadmap.sh/software-design-architecture', e: 'AWS Solutions Architect – Associate', eu: 'https://aws.amazon.com/certification/certified-solutions-architect-associate/' },
  'qa': { c: 'ISTQB Foundation', u: 'https://www.istqb.org/certifications/certified-tester-foundation-level', e: 'ISTQB Certified Tester', eu: 'https://www.istqb.org/certifications/certified-tester-foundation-level' },
  'linux': { c: 'Linux Journey', u: 'https://linuxjourney.com/', e: 'LFCS', eu: 'https://training.linuxfoundation.org/certification/linux-foundation-certified-sysadmin-lfcs/' },
};
function pickResource(skills, title) {
  const tl = title.toLowerCase(); let p = skills[0];
  if (/machine.?learn|ml.?eng|deep.?learn/i.test(tl)) p = 'machine learning';
  else if (/data.?scien|data.?analy/i.test(tl)) p = 'data science';
  else if (/data.?engineer/i.test(tl)) p = 'data engineering';
  else if (/devops/i.test(tl)) p = 'devops';
  else if (/security|cyber/i.test(tl)) p = 'security';
  else if (/architect/i.test(tl)) p = 'system design';
  else if (/product.?manag/i.test(tl)) p = 'product management';
  else if (/qa|quality|test/i.test(tl)) p = 'qa';
  else if (/engineering.?manager|tech.?lead|staff|principal/i.test(tl)) p = 'system design';
  else if (/frontend|front.?end/i.test(tl)) p = 'react';
  else if (/backend|back.?end/i.test(tl)) p = skills.includes('java') ? 'java' : skills.includes('golang') ? 'golang' : 'python';
  else if (/fullstack|full.?stack/i.test(tl)) p = 'javascript';
  const r = SKILL_DB[p] || SKILL_DB[skills[0]] || SKILL_DB['software engineering'];
  return { course: r.c, courseUrl: r.u, exam: r.e, examUrl: r.eu };
}
function parseCsvRow(row) {
  const f = []; let cur = ''; let inQ = false;
  for (let i = 0; i < row.length; i++) {
    if (row[i] === '"') { if (inQ && row[i+1] === '"') { cur += '"'; i++; } else inQ = !inQ; }
    else if (row[i] === ',' && !inQ) { f.push(cur); cur = ''; } else { cur += row[i]; }
  }
  f.push(cur); return f;
}
function escCsv(s) { if (!s) return ''; if (s.includes(',') || s.includes('"') || s.includes('\n')) return '"' + s.replace(/"/g, '""') + '"'; return s; }

async function main() {
  // Fetch Airwallex board WITH descriptions (already included!)
  console.log('Fetching Airwallex board (with JDs)...');
  const awxBoard = await fetch('https://api.ashbyhq.com/posting-api/job-board/airwallex').then(r => r.json());
  const awxJDs = new Map();
  for (const j of (awxBoard.jobs || [])) {
    const jd = (j.descriptionPlain || j.descriptionHtml?.replace(/<[^>]+>/g, ' ') || '');
    if (jd.length > 50) awxJDs.set(j.title.toLowerCase().trim(), jd);
  }
  console.log(`  ${awxJDs.size} Airwallex JDs loaded`);

  // Fetch Grab postings WITH full JDs
  console.log('Fetching Grab individual JDs...');
  const grabJDs = new Map();
  let offset = 0;
  while (true) {
    const r = await fetch(`https://api.smartrecruiters.com/v1/companies/Grab/postings?limit=100&offset=${offset}`);
    if (!r.ok) break;
    const d = await r.json();
    for (const j of (d.content || [])) {
      // Need to fetch individual posting for full JD
      try {
        const r2 = await fetch(`https://api.smartrecruiters.com/v1/companies/Grab/postings/${j.id}`);
        if (r2.ok) {
          const p = await r2.json();
          const jd = (p.jobAd?.sections?.jobDescription?.text || '') + ' ' + (p.jobAd?.sections?.qualifications?.text || '');
          if (jd.length > 50) grabJDs.set(j.name.toLowerCase().trim(), jd);
        }
      } catch {}
    }
    if (!d.content || d.content.length < 100) break;
    offset += 100;
  }
  console.log(`  ${grabJDs.size} Grab JDs loaded`);

  // Fetch Visa individual JDs
  console.log('Fetching Visa individual JDs...');
  const visaJDs = new Map();
  const visaR = await fetch('https://api.smartrecruiters.com/v1/companies/Visa/postings?limit=100');
  if (visaR.ok) {
    const d = await visaR.json();
    await Promise.all((d.content || []).map(async j => {
      try {
        const r2 = await fetch(`https://api.smartrecruiters.com/v1/companies/Visa/postings/${j.id}`);
        if (r2.ok) {
          const p = await r2.json();
          const jd = (p.jobAd?.sections?.jobDescription?.text || '') + ' ' + (p.jobAd?.sections?.qualifications?.text || '');
          if (jd.length > 50) visaJDs.set(j.name.toLowerCase().trim(), jd);
        }
      } catch {}
    }));
  }
  console.log(`  ${visaJDs.size} Visa JDs loaded`);

  // Process CSV
  const csv = readFileSync('/Users/vedang/Documents/sg_my_tech_jobs.csv', 'utf-8');
  const lines = csv.split('\n');
  const header = lines[0];
  const rows = lines.slice(1).filter(l => l.trim());
  let fixed = 0;

  const updated = rows.map(row => {
    const f = parseCsvRow(row);
    if (!GENERIC.includes(f[5])) return row;
    const company = (f[0] || '').toLowerCase().trim();
    const title = (f[3] || '').toLowerCase().trim();

    let jd = '';
    if (company === 'airwallex') jd = awxJDs.get(title) || '';
    else if (company === 'grab') jd = grabJDs.get(title) || '';
    else if (company === 'visa') jd = visaJDs.get(title) || '';
    else return row;

    if (jd.length < 50) return row;

    const skills = [];
    const added = new Set();
    for (const [pat, skill] of SKILL_PATTERNS) {
      if (pat.test(jd + ' ' + title) && !added.has(skill)) { skills.push(skill); added.add(skill); }
    }
    if (skills.length === 0) return row;

    fixed++;
    const { course, courseUrl, exam, examUrl } = pickResource(skills, f[3]);
    f[5] = skills.join(', '); f[6] = course; f[7] = courseUrl; f[8] = exam; f[9] = examUrl;
    return f.map(escCsv).join(',');
  });

  writeFileSync('/Users/vedang/Documents/sg_my_tech_jobs.csv', [header, ...updated].join('\n'));
  console.log(`\nDone! Fixed: ${fixed}`);
}
main().catch(console.error);
