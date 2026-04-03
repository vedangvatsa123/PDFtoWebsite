import dotenv from 'dotenv';
import { writeFileSync } from 'fs';
dotenv.config({ path: '.env.local' });

const SB = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SK = process.env.SUPABASE_SERVICE_ROLE_KEY;
const headers = { 'apikey': SK, 'Authorization': `Bearer ${SK}` };

// ─── Skill -> single best free resource + single best exam ───
const SKILL_MAP = {
  'python':       { course: 'Python for Everybody (Coursera)', url: 'https://www.coursera.org/specializations/python', exam: 'PCEP - Certified Entry-Level Python Programmer', examUrl: 'https://pythoninstitute.org/pcep' },
  'django':       { course: 'Django Official Tutorial', url: 'https://docs.djangoproject.com/en/5.0/intro/tutorial01/', exam: '', examUrl: '' },
  'react':        { course: 'React Official Tutorial', url: 'https://react.dev/learn', exam: '', examUrl: '' },
  'javascript':   { course: 'The Odin Project - JavaScript', url: 'https://www.theodinproject.com/paths/full-stack-javascript', exam: '', examUrl: '' },
  'typescript':   { course: 'TypeScript Handbook', url: 'https://www.typescriptlang.org/docs/handbook/', exam: '', examUrl: '' },
  'node':         { course: 'Node.js Official Learn', url: 'https://nodejs.org/en/learn', exam: 'OpenJS Node.js Application Developer', examUrl: 'https://training.linuxfoundation.org/certification/jsnad/' },
  'nextjs':       { course: 'Next.js Official Learn', url: 'https://nextjs.org/learn', exam: '', examUrl: '' },
  'java':         { course: 'Java MOOC (University of Helsinki)', url: 'https://java-programming.mooc.fi/', exam: 'Oracle Certified Professional Java SE', examUrl: 'https://education.oracle.com/java-se-programmer/pexam_1Z0-829' },
  'golang':       { course: 'Go Official Tour', url: 'https://go.dev/tour/', exam: '', examUrl: '' },
  'rust':         { course: 'The Rust Programming Language', url: 'https://doc.rust-lang.org/book/', exam: '', examUrl: '' },
  'kotlin':       { course: 'Kotlin Official Docs', url: 'https://kotlinlang.org/docs/getting-started.html', exam: '', examUrl: '' },
  'swift':        { course: 'Swift Official Guide', url: 'https://docs.swift.org/swift-book/', exam: '', examUrl: '' },
  'scala':        { course: 'Scala Official Tour', url: 'https://docs.scala-lang.org/tour/tour-of-scala.html', exam: '', examUrl: '' },
  'ruby':         { course: 'The Odin Project - Ruby', url: 'https://www.theodinproject.com/paths/full-stack-ruby-on-rails', exam: '', examUrl: '' },
  'php':          { course: 'PHP The Right Way', url: 'https://phptherightway.com/', exam: 'Zend Certified PHP Engineer', examUrl: 'https://www.zend.com/training/php-certification-exam' },
  'c++':          { course: 'LearnCpp.com', url: 'https://www.learncpp.com/', exam: 'CPA - C++ Certified Associate', examUrl: 'https://cppinstitute.org/cpa-c-certified-associate-programmer-certification' },
  'c#':           { course: 'Microsoft Learn - C#', url: 'https://learn.microsoft.com/en-us/dotnet/csharp/', exam: '', examUrl: '' },
  'sql':          { course: 'SQLBolt - Interactive SQL', url: 'https://sqlbolt.com/', exam: 'Oracle Database SQL Certified Associate', examUrl: 'https://education.oracle.com/oracle-database-sql-certified-associate/pexam_1Z0-071' },
  'postgresql':   { course: 'PostgreSQL Official Tutorial', url: 'https://www.postgresql.org/docs/current/tutorial.html', exam: '', examUrl: '' },
  'mongodb':      { course: 'MongoDB University', url: 'https://learn.mongodb.com/', exam: 'MongoDB Associate Developer', examUrl: 'https://learn.mongodb.com/pages/mongodb-associate-developer-exam' },
  'redis':        { course: 'Redis University', url: 'https://university.redis.io/', exam: 'Redis Certified Developer', examUrl: 'https://university.redis.io/certifications/' },
  'kafka':        { course: 'Confluent Developer Courses', url: 'https://developer.confluent.io/courses/', exam: 'Confluent Certified Developer for Kafka', examUrl: 'https://www.confluent.io/certification/' },
  'aws':          { course: 'AWS Skill Builder', url: 'https://explore.skillbuilder.aws/', exam: 'AWS Solutions Architect Associate', examUrl: 'https://aws.amazon.com/certification/certified-solutions-architect-associate/' },
  'azure':        { course: 'Microsoft Learn - Azure', url: 'https://learn.microsoft.com/en-us/training/azure/', exam: 'AZ-900: Azure Fundamentals', examUrl: 'https://learn.microsoft.com/en-us/credentials/certifications/azure-fundamentals/' },
  'gcp':          { course: 'Google Cloud Skills Boost', url: 'https://www.cloudskillsboost.google/', exam: 'Google Associate Cloud Engineer', examUrl: 'https://cloud.google.com/learn/certification/cloud-engineer' },
  'kubernetes':   { course: 'Kubernetes Official Tutorial', url: 'https://kubernetes.io/docs/tutorials/', exam: 'CKA - Certified Kubernetes Admin', examUrl: 'https://training.linuxfoundation.org/certification/certified-kubernetes-administrator-cka/' },
  'docker':       { course: 'Docker Getting Started', url: 'https://docs.docker.com/get-started/', exam: 'Docker Certified Associate', examUrl: 'https://training.mirantis.com/dca-certification-exam/' },
  'terraform':    { course: 'HashiCorp Learn - Terraform', url: 'https://developer.hashicorp.com/terraform/tutorials', exam: 'HashiCorp Terraform Associate', examUrl: 'https://developer.hashicorp.com/certifications/infrastructure-automation' },
  'vue':          { course: 'Vue.js Official Guide', url: 'https://vuejs.org/guide/introduction.html', exam: '', examUrl: '' },
  'angular':      { course: 'Angular Official Tutorial', url: 'https://angular.dev/tutorials', exam: '', examUrl: '' },
  'graphql':      { course: 'How to GraphQL', url: 'https://www.howtographql.com/', exam: '', examUrl: '' },
  'flutter':      { course: 'Flutter Official Codelabs', url: 'https://docs.flutter.dev/get-started/codelab', exam: '', examUrl: '' },
  'machine learning': { course: 'Machine Learning (Stanford/Coursera)', url: 'https://www.coursera.org/learn/machine-learning', exam: 'AWS Machine Learning Specialty', examUrl: 'https://aws.amazon.com/certification/certified-machine-learning-specialty/' },
  'data science': { course: 'Data Analysis with Python (freeCodeCamp)', url: 'https://www.freecodecamp.org/learn/data-analysis-with-python/', exam: 'IBM Data Science Professional Certificate', examUrl: 'https://www.coursera.org/professional-certificates/ibm-data-science' },
  'deep learning':{ course: 'Deep Learning Specialization (Coursera)', url: 'https://www.coursera.org/specializations/deep-learning', exam: '', examUrl: '' },
  'nlp':          { course: 'Hugging Face NLP Course', url: 'https://huggingface.co/learn/nlp-course', exam: '', examUrl: '' },
  'ai':           { course: 'Elements of AI', url: 'https://www.elementsofai.com/', exam: 'Google Cloud ML Engineer', examUrl: 'https://cloud.google.com/learn/certification/machine-learning-engineer' },
  'linux':        { course: 'Linux Journey', url: 'https://linuxjourney.com/', exam: 'LFCS - Linux Foundation Certified SysAdmin', examUrl: 'https://training.linuxfoundation.org/certification/linux-foundation-certified-sysadmin-lfcs/' },
  'security':     { course: 'OWASP Web Security Guide', url: 'https://owasp.org/www-project-web-security-testing-guide/', exam: 'CompTIA Security+', examUrl: 'https://www.comptia.org/certifications/security' },
  'cybersecurity':{ course: 'Google Cybersecurity (Coursera)', url: 'https://www.coursera.org/professional-certificates/google-cybersecurity', exam: 'CompTIA Security+', examUrl: 'https://www.comptia.org/certifications/security' },
  'devops':       { course: 'DevOps Roadmap (roadmap.sh)', url: 'https://roadmap.sh/devops', exam: 'AWS DevOps Engineer Professional', examUrl: 'https://aws.amazon.com/certification/certified-devops-engineer-professional/' },
  'agile':        { course: 'Scrum Guide (Official)', url: 'https://scrumguides.org/', exam: 'Professional Scrum Master (PSM I)', examUrl: 'https://www.scrum.org/assessments/professional-scrum-master-i-certification' },
  'product management': { course: 'Product School Resources', url: 'https://productschool.com/resources', exam: '', examUrl: '' },
  'ios':          { course: 'Apple Developer Tutorials', url: 'https://developer.apple.com/tutorials/swiftui', exam: '', examUrl: '' },
  'android':      { course: 'Android Developer Training (Google)', url: 'https://developer.android.com/courses', exam: 'Google Associate Android Developer', examUrl: 'https://developers.google.com/certification/associate-android-developer' },
  'blockchain':   { course: 'CryptoZombies', url: 'https://cryptozombies.io/', exam: '', examUrl: '' },
  'solidity':     { course: 'CryptoZombies', url: 'https://cryptozombies.io/', exam: '', examUrl: '' },
  'git':          { course: 'Pro Git Book', url: 'https://git-scm.com/book/en/v2', exam: '', examUrl: '' },
  'tailwind':     { course: 'Tailwind CSS Official Docs', url: 'https://tailwindcss.com/docs', exam: '', examUrl: '' },
  'networking':   { course: 'Computer Networking (Stanford/Coursera)', url: 'https://www.coursera.org/learn/computer-networking', exam: 'CompTIA Network+', examUrl: 'https://www.comptia.org/certifications/network' },
  'software engineering': { course: 'Software Engineering Roadmap (roadmap.sh)', url: 'https://roadmap.sh/software-design-architecture', exam: '', examUrl: '' },
  'system design':{ course: 'System Design Primer (GitHub)', url: 'https://github.com/donnemartin/system-design-primer', exam: '', examUrl: '' },
  'data engineering': { course: 'Data Engineering Zoomcamp', url: 'https://github.com/DataTalksClub/data-engineering-zoomcamp', exam: 'Google Professional Data Engineer', examUrl: 'https://cloud.google.com/learn/certification/data-engineer' },
  'analytics':    { course: 'Google Data Analytics (Coursera)', url: 'https://www.coursera.org/professional-certificates/google-data-analytics', exam: '', examUrl: '' },
  'project management': { course: 'Google Project Management (Coursera)', url: 'https://www.coursera.org/professional-certificates/google-project-management', exam: 'PMP - Project Management Professional', examUrl: 'https://www.pmi.org/certifications/project-management-pmp' },
};

// ─── Role-based default skills (when title doesn't contain specific tech) ───
function extractSkills(title, tags) {
  const skills = [];
  const t = (title + ' ' + (tags || []).join(' ')).toLowerCase();

  const patterns = [
    [/\breact\b/, 'react'], [/\bpython\b/, 'python'], [/\bjavascript\b/, 'javascript'],
    [/\btypescript\b/, 'typescript'], [/\bnode\.?js?\b/, 'node'], [/\bnext\.?js\b/, 'nextjs'],
    [/\bjava\b(?!script)/, 'java'], [/\bgolang\b|\bgo\b(?!ogle)/, 'golang'],
    [/\brust\b/, 'rust'], [/\bkotlin\b/, 'kotlin'], [/\bswift\b/, 'swift'],
    [/\bscala\b/, 'scala'], [/\bruby\b|\brails\b/, 'ruby'], [/\bphp\b/, 'php'],
    [/\bsql\b|\bpostgres/, 'sql'], [/\bmongodb\b/, 'mongodb'], [/\bredis\b/, 'redis'],
    [/\bkafka\b/, 'kafka'], [/\baws\b/, 'aws'], [/\bazure\b/, 'azure'],
    [/\bgcp\b|\bgoogle cloud\b/, 'gcp'], [/\bkubernetes\b|\bk8s\b/, 'kubernetes'],
    [/\bdocker\b/, 'docker'], [/\bterraform\b/, 'terraform'],
    [/\bvue\b/, 'vue'], [/\bangular\b/, 'angular'], [/\bgraphql\b/, 'graphql'],
    [/\bflutter\b/, 'flutter'], [/\bc\+\+\b/, 'c++'], [/\bc#\b|\.net\b/, 'c#'],
    [/\bmachine.?learn|\bml\b/, 'machine learning'], [/\bdata.?scien/, 'data science'],
    [/\bdeep.?learn/, 'deep learning'], [/\bnlp\b|\bnatural.?language/, 'nlp'],
    [/\blinux\b/, 'linux'], [/\bcyber/, 'cybersecurity'],
    [/\bdevops\b/, 'devops'], [/\bblockchain\b|\bweb3\b/, 'blockchain'],
    [/\bsolidity\b/, 'solidity'], [/\bsolana\b/, 'blockchain'],
    [/\bproduct.?manag/, 'product management'], [/\bproject.?manag/, 'project management'],
    [/\bandroid\b/, 'android'], [/\bios\b/, 'ios'],
    [/\bgit\b/, 'git'], [/\btailwind/, 'tailwind'],
  ];

  const added = new Set();
  for (const [pat, skill] of patterns) {
    if (pat.test(t) && !added.has(skill)) { skills.push(skill); added.add(skill); }
  }

  // Role-based defaults if nothing matched
  if (skills.length === 0) {
    const tl = title.toLowerCase();
    if (/frontend|front.end/i.test(tl))                           skills.push('javascript', 'react', 'typescript');
    else if (/backend|back.end/i.test(tl))                        skills.push('python', 'sql', 'node');
    else if (/fullstack|full.stack/i.test(tl))                    skills.push('javascript', 'react', 'node', 'sql');
    else if (/data.engineer/i.test(tl))                           skills.push('python', 'sql', 'aws');
    else if (/data.scien|data.analy/i.test(tl))                   skills.push('python', 'sql', 'data science');
    else if (/devops|sre|site.reliab/i.test(tl))                  skills.push('aws', 'kubernetes', 'docker', 'terraform');
    else if (/cloud/i.test(tl))                                   skills.push('aws', 'kubernetes');
    else if (/mobile/i.test(tl))                                  skills.push('ios', 'android', 'flutter');
    else if (/machine.learn|ml.eng|ai.eng/i.test(tl))             skills.push('python', 'machine learning');
    else if (/platform/i.test(tl))                                skills.push('aws', 'kubernetes', 'docker');
    else if (/qa|quality|test|automation/i.test(tl))               skills.push('python', 'agile');
    else if (/security|cyber|infosec/i.test(tl))                  skills.push('security', 'linux');
    else if (/architect/i.test(tl))                               skills.push('aws', 'system design');
    else if (/analyst/i.test(tl))                                 skills.push('sql', 'python', 'analytics');
    else if (/product.manag/i.test(tl))                           skills.push('product management', 'agile');
    else if (/project.manag|scrum|agile/i.test(tl))               skills.push('project management', 'agile');
    else if (/infrastructure|network/i.test(tl))                  skills.push('linux', 'aws', 'networking');
    else if (/database|dba/i.test(tl))                            skills.push('sql', 'postgresql');
    else if (/tech.lead|staff|principal|engineering.manager/i.test(tl)) skills.push('system design', 'software engineering');
    else if (/engineer|developer|software|programmer/i.test(tl))  skills.push('python', 'javascript', 'sql');
    else                                                          skills.push('software engineering');
  }

  return skills;
}

// ─── Normalize location to just Singapore or Malaysia ───
function normalizeLocation(loc) {
  const l = (loc || '').toLowerCase();
  if (l.includes('malaysia') || l.includes('kuala lumpur') || l.includes(', my') ||
      l.includes('petaling') || l.includes('penang') || l.includes('johor') ||
      l.includes('cyberjaya') || l.includes('selangor')) return 'Malaysia';
  return 'Singapore';
}

// ─── Build ATS board URL ───
function boardUrl(source, company, applyUrl) {
  if (source === 'greenhouse') {
    const slug = applyUrl?.match(/greenhouse\.io\/([^/]+)/)?.[1] || company.toLowerCase().replace(/\s+/g, '');
    return `https://boards.greenhouse.io/${slug}`;
  }
  if (source === 'ashby') {
    const slug = applyUrl?.match(/ashbyhq\.com\/([^/]+)/)?.[1] || company.toLowerCase().replace(/\s+/g, '');
    return `https://jobs.ashbyhq.com/${slug}`;
  }
  if (source === 'lever') {
    const slug = applyUrl?.match(/lever\.co\/([^/]+)/)?.[1] || company.toLowerCase().replace(/\s+/g, '');
    return `https://jobs.lever.co/${slug}`;
  }
  if (source === 'smartrecruiters') {
    const slug = applyUrl?.match(/smartrecruiters\.com\/([^/]+)/)?.[1] || company;
    return `https://careers.smartrecruiters.com/${slug}`;
  }
  if (source === 'workday') {
    return applyUrl?.replace(/\/job\/.*/, '') || '';
  }
  return '';
}

function escCsv(s) {
  if (!s) return '';
  s = String(s);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}

async function main() {
  console.log('Fetching SG+MY jobs...');
  const allJobs = [];

  for (const loc of ['singapore', ', sg', 'malaysia', 'kuala lumpur', ', my', 'petaling jaya', 'penang', 'johor']) {
    let offset = 0;
    while (true) {
      const r = await fetch(
        `${SB}/rest/v1/jobs?select=title,company,location,tags,apply_url,source&location=ilike.*${encodeURIComponent(loc)}*&offset=${offset}&limit=1000`,
        { headers }
      );
      const d = await r.json();
      if (!d.length) break;
      allJobs.push(...d);
      offset += d.length;
      if (d.length < 1000) break;
    }
  }

  // Dedup
  const seen = new Set();
  const unique = allJobs.filter(j => {
    const k = (j.company + '|' + j.title).toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  console.log(`Total SG+MY: ${unique.length}`);

  // Filter tech roles
  const techRegex = /engineer|developer|devops|sre|architect|frontend|backend|fullstack|full.stack|software|data.scien|data.engineer|data.analy|machine.learn|ml.engineer|ai.engineer|cloud|platform|infrastructure|security|cyber|mobile|ios|android|qa|quality|test|automation|product.manager|technical|tech.lead|staff|principal|solutions|systems|network|database|dba|site.reliab|web.develop|programmer|devsecops|mlops|dataops|bi.engineer|bi.analyst|analytics.engineer|scrum|ux.engineer|embedded|firmware|hardware|robotics|blockchain|smart.contract/i;

  const tech = unique.filter(j => techRegex.test(j.title));
  console.log(`Tech roles: ${tech.length}`);

  // ─── Add NS (Network School) manually ───
  tech.push({
    title: 'Full Stack Engineer (Python/Django/React)',
    company: 'NS (Network School)',
    location: 'Malaysia',
    tags: ['python','django','postgresql','react','node','javascript','typescript','docker','aws','redis','nextjs','git','tailwind'],
    apply_url: 'https://ns.com/jobs',
    source: 'manual',
    _course: 'Django Official Tutorial',
    _courseUrl: 'https://docs.djangoproject.com/en/5.0/intro/tutorial01/',
    _exam: '',
    _examUrl: '',
  });
  tech.push({
    title: 'STEM Tutor (Decentralized Science & AI)',
    company: 'NS (Network School)',
    location: 'Malaysia',
    tags: ['ai','blockchain','python','data science'],
    apply_url: 'https://ns.com/jobs',
    source: 'manual',
    _course: 'Practical Deep Learning for Coders (fast.ai)',
    _courseUrl: 'https://course.fast.ai/',
    _exam: '',
    _examUrl: '',
  });

  // Generate CSV
  const rows = ['Company,Location,Job Board link of company,Job Title,Job application URL,Skill,Book/Course/Website required to learn that skill,Resource URL of that book/Course/Website,Common exams for that skill,Exam URL'];

  for (const job of tech) {
    const skills = extractSkills(job.title, job.tags);
    const skillStr = skills.join(', ');
    const location = job.source === 'manual' ? job.location : normalizeLocation(job.location);
    const board = job.source === 'manual' ? 'https://ns.com/jobs' : boardUrl(job.source, job.company, job.apply_url);

    // Fix SmartRecruiters apply URLs
    let applyUrl = job.apply_url || '';
    applyUrl = applyUrl.replace(/https:\/\/api\.smartrecruiters\.com\/v1\/companies\/([^/]+)\/postings\/(\d+)/, 'https://jobs.smartrecruiters.com/$1/$2');

    // ─── Smart resource picking: match course + exam to the PRIMARY role, not just first skill ───
    let course = '', courseUrl = '', exam = '', examUrl = '';

    // Manual overrides (for NS and other manually added jobs)
    if (job._course) {
      course = job._course; courseUrl = job._courseUrl || '';
      exam = job._exam || ''; examUrl = job._examUrl || '';
    } else {
    const tl = job.title.toLowerCase();

    // Role-specific overrides (most relevant resource for this specific job)
    if (/django/i.test(tl) || (job.tags||[]).includes('django')) {
      course = 'Django Official Tutorial'; courseUrl = 'https://docs.djangoproject.com/en/5.0/intro/tutorial01/';
    } else if (/react native/i.test(tl)) {
      course = 'React Native Official Docs'; courseUrl = 'https://reactnative.dev/docs/getting-started';
    } else if (/nextjs|next\.js/i.test(tl)) {
      course = 'Next.js Official Learn'; courseUrl = 'https://nextjs.org/learn';
    } else if (/flutter/i.test(tl)) {
      course = 'Flutter Official Codelabs'; courseUrl = 'https://docs.flutter.dev/get-started/codelab';
    } else if (/android/i.test(tl)) {
      course = 'Android Developer Training (Google)'; courseUrl = 'https://developer.android.com/courses';
      exam = 'Google Associate Android Developer'; examUrl = 'https://developers.google.com/certification/associate-android-developer';
    } else if (/ios|swift/i.test(tl)) {
      course = 'Apple SwiftUI Tutorials'; courseUrl = 'https://developer.apple.com/tutorials/swiftui';
    } else if (/machine.?learn|ml.?eng|deep.?learn/i.test(tl)) {
      course = 'Machine Learning (Stanford/Coursera)'; courseUrl = 'https://www.coursera.org/learn/machine-learning';
      exam = 'AWS Machine Learning Specialty'; examUrl = 'https://aws.amazon.com/certification/certified-machine-learning-specialty/';
    } else if (/nlp|natural.?language/i.test(tl)) {
      course = 'Hugging Face NLP Course'; courseUrl = 'https://huggingface.co/learn/nlp-course';
    } else if (/data.?scien|data.?analy/i.test(tl)) {
      course = 'Google Data Analytics (Coursera)'; courseUrl = 'https://www.coursera.org/professional-certificates/google-data-analytics';
    } else if (/data.?engineer/i.test(tl)) {
      course = 'Data Engineering Zoomcamp'; courseUrl = 'https://github.com/DataTalksClub/data-engineering-zoomcamp';
      exam = 'Google Professional Data Engineer'; examUrl = 'https://cloud.google.com/learn/certification/data-engineer';
    } else if (/devops|sre|site.?reliab/i.test(tl)) {
      course = 'DevOps Roadmap (roadmap.sh)'; courseUrl = 'https://roadmap.sh/devops';
      exam = 'AWS DevOps Engineer Professional'; examUrl = 'https://aws.amazon.com/certification/certified-devops-engineer-professional/';
    } else if (/cloud/i.test(tl)) {
      course = 'AWS Skill Builder'; courseUrl = 'https://explore.skillbuilder.aws/';
      exam = 'AWS Solutions Architect Associate'; examUrl = 'https://aws.amazon.com/certification/certified-solutions-architect-associate/';
    } else if (/kubernetes|k8s/i.test(tl)) {
      course = 'Kubernetes Official Tutorial'; courseUrl = 'https://kubernetes.io/docs/tutorials/';
      exam = 'CKA - Certified Kubernetes Admin'; examUrl = 'https://training.linuxfoundation.org/certification/certified-kubernetes-administrator-cka/';
    } else if (/terraform/i.test(tl)) {
      course = 'HashiCorp Learn - Terraform'; courseUrl = 'https://developer.hashicorp.com/terraform/tutorials';
      exam = 'HashiCorp Terraform Associate'; examUrl = 'https://developer.hashicorp.com/certifications/infrastructure-automation';
    } else if (/security|cyber|infosec/i.test(tl)) {
      course = 'Google Cybersecurity (Coursera)'; courseUrl = 'https://www.coursera.org/professional-certificates/google-cybersecurity';
      exam = 'CompTIA Security+'; examUrl = 'https://www.comptia.org/certifications/security';
    } else if (/blockchain|web3|crypto|solidity/i.test(tl)) {
      course = 'CryptoZombies'; courseUrl = 'https://cryptozombies.io/';
    } else if (/architect/i.test(tl)) {
      course = 'System Design Primer (GitHub)'; courseUrl = 'https://github.com/donnemartin/system-design-primer';
      exam = 'AWS Solutions Architect Associate'; examUrl = 'https://aws.amazon.com/certification/certified-solutions-architect-associate/';
    } else if (/product.?manag/i.test(tl)) {
      course = 'Product School Resources'; courseUrl = 'https://productschool.com/resources';
    } else if (/project.?manag|scrum/i.test(tl)) {
      course = 'Google Project Management (Coursera)'; courseUrl = 'https://www.coursera.org/professional-certificates/google-project-management';
      exam = 'PMP - Project Management Professional'; examUrl = 'https://www.pmi.org/certifications/project-management-pmp';
    } else if (/qa|quality|test(?:er|ing)|automation/i.test(tl)) {
      course = 'ISTQB Foundation Syllabus'; courseUrl = 'https://www.istqb.org/certifications/certified-tester-foundation-level';
      exam = 'ISTQB Certified Tester Foundation Level'; examUrl = 'https://www.istqb.org/certifications/certified-tester-foundation-level';
    } else if (/infrastructure|network|systems/i.test(tl)) {
      course = 'Linux Journey'; courseUrl = 'https://linuxjourney.com/';
      exam = 'CompTIA Network+'; examUrl = 'https://www.comptia.org/certifications/network';
    } else if (/database|dba|sql/i.test(tl)) {
      course = 'SQLBolt - Interactive SQL'; courseUrl = 'https://sqlbolt.com/';
      exam = 'Oracle Database SQL Certified Associate'; examUrl = 'https://education.oracle.com/oracle-database-sql-certified-associate/pexam_1Z0-071';
    } else if (/engineering.?manager|tech.?lead|head.?of.?eng|vp.?eng|staff|principal/i.test(tl)) {
      course = 'System Design Primer (GitHub)'; courseUrl = 'https://github.com/donnemartin/system-design-primer';
    } else if (/frontend|front.?end/i.test(tl)) {
      course = 'React Official Tutorial'; courseUrl = 'https://react.dev/learn';
    } else if (/backend|back.?end/i.test(tl)) {
      // Pick based on most common backend skill in tags
      if ((job.tags||[]).includes('python') || (job.tags||[]).includes('django')) {
        course = 'Python for Everybody (Coursera)'; courseUrl = 'https://www.coursera.org/specializations/python';
        exam = 'PCEP - Certified Entry-Level Python Programmer'; examUrl = 'https://pythoninstitute.org/pcep';
      } else if ((job.tags||[]).includes('java')) {
        course = 'Java MOOC (University of Helsinki)'; courseUrl = 'https://java-programming.mooc.fi/';
        exam = 'Oracle Certified Professional Java SE'; examUrl = 'https://education.oracle.com/java-se-programmer/pexam_1Z0-829';
      } else if ((job.tags||[]).includes('golang')) {
        course = 'Go Official Tour'; courseUrl = 'https://go.dev/tour/';
      } else {
        course = 'Python for Everybody (Coursera)'; courseUrl = 'https://www.coursera.org/specializations/python';
      }
    } else if (/fullstack|full.?stack/i.test(tl)) {
      course = 'The Odin Project - Full Stack JavaScript'; courseUrl = 'https://www.theodinproject.com/paths/full-stack-javascript';
    } else if (/embedded|firmware/i.test(tl)) {
      course = 'LearnCpp.com'; courseUrl = 'https://www.learncpp.com/';
    } else if (/rust/i.test(tl)) {
      course = 'The Rust Programming Language'; courseUrl = 'https://doc.rust-lang.org/book/';
    } else if (/golang|go /i.test(tl)) {
      course = 'Go Official Tour'; courseUrl = 'https://go.dev/tour/';
    } else if (/java(?!script)/i.test(tl)) {
      course = 'Java MOOC (University of Helsinki)'; courseUrl = 'https://java-programming.mooc.fi/';
      exam = 'Oracle Certified Professional Java SE'; examUrl = 'https://education.oracle.com/java-se-programmer/pexam_1Z0-829';
    } else if (/python/i.test(tl)) {
      course = 'Python for Everybody (Coursera)'; courseUrl = 'https://www.coursera.org/specializations/python';
      exam = 'PCEP - Certified Entry-Level Python Programmer'; examUrl = 'https://pythoninstitute.org/pcep';
    } else {
      // Fallback: pick from skills list, prioritizing those with courses
      for (const s of skills) {
        const r = SKILL_MAP[s];
        if (r && r.course && !course) { course = r.course; courseUrl = r.url; }
        if (r && r.exam && !exam) { exam = r.exam; examUrl = r.examUrl; }
      }
    }
    } // close manual override else

    rows.push([
      escCsv(job.company),
      escCsv(location),
      escCsv(board),
      escCsv(job.title),
      escCsv(applyUrl),
      escCsv(skillStr),
      escCsv(course),
      escCsv(courseUrl),
      escCsv(exam),
      escCsv(examUrl),
    ].join(','));
  }

  const outPath = '/Users/vedang/Documents/sg_my_tech_jobs.csv';
  writeFileSync(outPath, rows.join('\n'), 'utf-8');
  console.log(`\nCSV written to ${outPath}`);
  console.log(`Total rows: ${rows.length - 1}`);

  // Quick stats
  const sgCount = rows.filter(r => r.includes(',Singapore,')).length;
  const myCount = rows.filter(r => r.includes(',Malaysia,')).length;
  console.log(`Singapore: ${sgCount}, Malaysia: ${myCount}`);
  const withSkills = rows.slice(1).filter(r => { const cols = r.split(','); return cols[5] && cols[5] !== '""'; }).length;
  console.log(`Rows with skills: ${withSkills}/${rows.length - 1}`);
}

main().catch(console.error);
