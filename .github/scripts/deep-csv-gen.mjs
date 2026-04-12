import dotenv from 'dotenv';
import { writeFileSync } from 'fs';
dotenv.config({ path: '.env.local' });

const SB = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SK = process.env.SUPABASE_SERVICE_ROLE_KEY;
const headers = { 'apikey': SK, 'Authorization': `Bearer ${SK}` };

// ─── COMPREHENSIVE skill -> resource + exam (NO blanks) ───
const SKILL_DB = {
  'python':         { course: 'Python for Everybody (Coursera)', url: 'https://www.coursera.org/specializations/python', exam: 'PCEP – Certified Entry-Level Python Programmer', examUrl: 'https://pythoninstitute.org/pcep' },
  'django':         { course: 'Django Official Tutorial', url: 'https://docs.djangoproject.com/en/5.0/intro/tutorial01/', exam: 'PCEP – Certified Entry-Level Python Programmer', examUrl: 'https://pythoninstitute.org/pcep' },
  'flask':          { course: 'Flask Mega Tutorial', url: 'https://blog.miguelgrinberg.com/post/the-flask-mega-tutorial-part-i-hello-world', exam: 'PCEP – Certified Entry-Level Python Programmer', examUrl: 'https://pythoninstitute.org/pcep' },
  'fastapi':        { course: 'FastAPI Official Tutorial', url: 'https://fastapi.tiangolo.com/tutorial/', exam: 'PCEP – Certified Entry-Level Python Programmer', examUrl: 'https://pythoninstitute.org/pcep' },
  'java':           { course: 'Java MOOC (University of Helsinki)', url: 'https://java-programming.mooc.fi/', exam: 'Oracle Certified Professional Java SE', examUrl: 'https://education.oracle.com/java-se-programmer/pexam_1Z0-829' },
  'spring':         { course: 'Spring Official Guides', url: 'https://spring.io/guides', exam: 'VMware Spring Professional', examUrl: 'https://www.vmware.com/learning/certification/spring-professional.html' },
  'javascript':     { course: 'The Odin Project – JavaScript', url: 'https://www.theodinproject.com/paths/full-stack-javascript', exam: 'Meta Front-End Developer Certificate', examUrl: 'https://www.coursera.org/professional-certificates/meta-front-end-developer' },
  'typescript':     { course: 'TypeScript Handbook (Official)', url: 'https://www.typescriptlang.org/docs/handbook/', exam: 'Meta Front-End Developer Certificate', examUrl: 'https://www.coursera.org/professional-certificates/meta-front-end-developer' },
  'react':          { course: 'React Official Tutorial', url: 'https://react.dev/learn', exam: 'Meta Front-End Developer Certificate', examUrl: 'https://www.coursera.org/professional-certificates/meta-front-end-developer' },
  'react native':   { course: 'React Native Official Docs', url: 'https://reactnative.dev/docs/getting-started', exam: 'Meta React Native Specialization', examUrl: 'https://www.coursera.org/specializations/meta-react-native' },
  'nextjs':         { course: 'Next.js Official Learn', url: 'https://nextjs.org/learn', exam: 'Meta Front-End Developer Certificate', examUrl: 'https://www.coursera.org/professional-certificates/meta-front-end-developer' },
  'vue':            { course: 'Vue.js Official Guide', url: 'https://vuejs.org/guide/introduction.html', exam: 'Meta Front-End Developer Certificate', examUrl: 'https://www.coursera.org/professional-certificates/meta-front-end-developer' },
  'angular':        { course: 'Angular Official Tutorial', url: 'https://angular.dev/tutorials', exam: 'Meta Front-End Developer Certificate', examUrl: 'https://www.coursera.org/professional-certificates/meta-front-end-developer' },
  'node':           { course: 'Node.js Official Learn', url: 'https://nodejs.org/en/learn', exam: 'OpenJS Node.js Application Developer (JSNAD)', examUrl: 'https://training.linuxfoundation.org/certification/jsnad/' },
  'golang':         { course: 'Go Official Tour', url: 'https://go.dev/tour/', exam: 'Google Associate Cloud Engineer', examUrl: 'https://cloud.google.com/learn/certification/cloud-engineer' },
  'rust':           { course: 'The Rust Programming Language (Book)', url: 'https://doc.rust-lang.org/book/', exam: 'AWS Solutions Architect Associate', examUrl: 'https://aws.amazon.com/certification/certified-solutions-architect-associate/' },
  'kotlin':         { course: 'Kotlin Official Docs', url: 'https://kotlinlang.org/docs/getting-started.html', exam: 'Google Associate Android Developer', examUrl: 'https://developers.google.com/certification/associate-android-developer' },
  'swift':          { course: 'Apple SwiftUI Tutorials', url: 'https://developer.apple.com/tutorials/swiftui', exam: 'Apple Certified iOS Developer (Discontinued – use portfolio)', examUrl: 'https://developer.apple.com/tutorials/swiftui' },
  'scala':          { course: 'Scala Official Tour', url: 'https://docs.scala-lang.org/tour/tour-of-scala.html', exam: 'Lightbend Scala Professional', examUrl: 'https://academy.lightbend.com/' },
  'ruby':           { course: 'The Odin Project – Ruby on Rails', url: 'https://www.theodinproject.com/paths/full-stack-ruby-on-rails', exam: 'Meta Back-End Developer Certificate', examUrl: 'https://www.coursera.org/professional-certificates/meta-back-end-developer' },
  'php':            { course: 'PHP The Right Way', url: 'https://phptherightway.com/', exam: 'Zend Certified PHP Engineer', examUrl: 'https://www.zend.com/training/php-certification-exam' },
  'c++':            { course: 'LearnCpp.com', url: 'https://www.learncpp.com/', exam: 'CPA – C++ Certified Associate Programmer', examUrl: 'https://cppinstitute.org/cpa-c-certified-associate-programmer-certification' },
  'c#':             { course: 'Microsoft Learn – C#', url: 'https://learn.microsoft.com/en-us/dotnet/csharp/', exam: 'Microsoft Certified: Azure Developer Associate', examUrl: 'https://learn.microsoft.com/en-us/credentials/certifications/azure-developer/' },
  'sql':            { course: 'SQLBolt – Interactive SQL Lessons', url: 'https://sqlbolt.com/', exam: 'Oracle Database SQL Certified Associate', examUrl: 'https://education.oracle.com/oracle-database-sql-certified-associate/pexam_1Z0-071' },
  'postgresql':     { course: 'PostgreSQL Official Tutorial', url: 'https://www.postgresql.org/docs/current/tutorial.html', exam: 'Oracle Database SQL Certified Associate', examUrl: 'https://education.oracle.com/oracle-database-sql-certified-associate/pexam_1Z0-071' },
  'mysql':          { course: 'MySQL Official Tutorial', url: 'https://dev.mysql.com/doc/refman/8.0/en/tutorial.html', exam: 'Oracle MySQL Developer Certified Professional', examUrl: 'https://education.oracle.com/mysql/mysql-database-development/pexam_1Z0-889' },
  'mongodb':        { course: 'MongoDB University (Free)', url: 'https://learn.mongodb.com/', exam: 'MongoDB Associate Developer', examUrl: 'https://learn.mongodb.com/pages/mongodb-associate-developer-exam' },
  'redis':          { course: 'Redis University (Free)', url: 'https://university.redis.io/', exam: 'Redis Certified Developer', examUrl: 'https://university.redis.io/certifications/' },
  'kafka':          { course: 'Confluent Developer Courses', url: 'https://developer.confluent.io/courses/', exam: 'Confluent Certified Developer for Apache Kafka', examUrl: 'https://www.confluent.io/certification/' },
  'elasticsearch':  { course: 'Elastic Official Training', url: 'https://www.elastic.co/training/free', exam: 'Elastic Certified Engineer', examUrl: 'https://www.elastic.co/training/elastic-certified-engineer-exam' },
  'graphql':        { course: 'How to GraphQL (Free)', url: 'https://www.howtographql.com/', exam: 'Meta Back-End Developer Certificate', examUrl: 'https://www.coursera.org/professional-certificates/meta-back-end-developer' },
  'aws':            { course: 'AWS Skill Builder (Free Tier)', url: 'https://explore.skillbuilder.aws/', exam: 'AWS Solutions Architect – Associate', examUrl: 'https://aws.amazon.com/certification/certified-solutions-architect-associate/' },
  'azure':          { course: 'Microsoft Learn – Azure (Free)', url: 'https://learn.microsoft.com/en-us/training/azure/', exam: 'AZ-900: Microsoft Azure Fundamentals', examUrl: 'https://learn.microsoft.com/en-us/credentials/certifications/azure-fundamentals/' },
  'gcp':            { course: 'Google Cloud Skills Boost (Free)', url: 'https://www.cloudskillsboost.google/', exam: 'Google Associate Cloud Engineer', examUrl: 'https://cloud.google.com/learn/certification/cloud-engineer' },
  'kubernetes':     { course: 'Kubernetes Official Tutorial', url: 'https://kubernetes.io/docs/tutorials/', exam: 'CKA – Certified Kubernetes Administrator', examUrl: 'https://training.linuxfoundation.org/certification/certified-kubernetes-administrator-cka/' },
  'docker':         { course: 'Docker Official Get Started', url: 'https://docs.docker.com/get-started/', exam: 'Docker Certified Associate (DCA)', examUrl: 'https://training.mirantis.com/dca-certification-exam/' },
  'terraform':      { course: 'HashiCorp Learn – Terraform', url: 'https://developer.hashicorp.com/terraform/tutorials', exam: 'HashiCorp Terraform Associate', examUrl: 'https://developer.hashicorp.com/certifications/infrastructure-automation' },
  'ansible':        { course: 'Ansible Official Getting Started', url: 'https://docs.ansible.com/ansible/latest/getting_started/', exam: 'Red Hat Certified Engineer (RHCE)', examUrl: 'https://www.redhat.com/en/services/certification/rhce' },
  'linux':          { course: 'Linux Journey (Free)', url: 'https://linuxjourney.com/', exam: 'LFCS – Linux Foundation Certified SysAdmin', examUrl: 'https://training.linuxfoundation.org/certification/linux-foundation-certified-sysadmin-lfcs/' },
  'machine learning': { course: 'Machine Learning Specialization (Stanford/Coursera)', url: 'https://www.coursera.org/specializations/machine-learning-introduction', exam: 'AWS Machine Learning – Specialty', examUrl: 'https://aws.amazon.com/certification/certified-machine-learning-specialty/' },
  'deep learning':  { course: 'Deep Learning Specialization (Coursera/deeplearning.ai)', url: 'https://www.coursera.org/specializations/deep-learning', exam: 'TensorFlow Developer Certificate', examUrl: 'https://www.tensorflow.org/certificate' },
  'nlp':            { course: 'Hugging Face NLP Course (Free)', url: 'https://huggingface.co/learn/nlp-course', exam: 'AWS Machine Learning – Specialty', examUrl: 'https://aws.amazon.com/certification/certified-machine-learning-specialty/' },
  'computer vision':{ course: 'CS231n: CNNs for Visual Recognition (Stanford)', url: 'https://cs231n.stanford.edu/', exam: 'TensorFlow Developer Certificate', examUrl: 'https://www.tensorflow.org/certificate' },
  'ai':             { course: 'Elements of AI (University of Helsinki)', url: 'https://www.elementsofai.com/', exam: 'Google Cloud Professional ML Engineer', examUrl: 'https://cloud.google.com/learn/certification/machine-learning-engineer' },
  'data science':   { course: 'Google Data Analytics Certificate (Coursera)', url: 'https://www.coursera.org/professional-certificates/google-data-analytics', exam: 'IBM Data Science Professional Certificate', examUrl: 'https://www.coursera.org/professional-certificates/ibm-data-science' },
  'data engineering': { course: 'Data Engineering Zoomcamp (Free)', url: 'https://github.com/DataTalksClub/data-engineering-zoomcamp', exam: 'Google Professional Data Engineer', examUrl: 'https://cloud.google.com/learn/certification/data-engineer' },
  'analytics':      { course: 'Google Data Analytics (Coursera)', url: 'https://www.coursera.org/professional-certificates/google-data-analytics', exam: 'Google Data Analytics Certificate', examUrl: 'https://www.coursera.org/professional-certificates/google-data-analytics' },
  'security':       { course: 'Google Cybersecurity Certificate (Coursera)', url: 'https://www.coursera.org/professional-certificates/google-cybersecurity', exam: 'CompTIA Security+', examUrl: 'https://www.comptia.org/certifications/security' },
  'cybersecurity':  { course: 'Google Cybersecurity Certificate (Coursera)', url: 'https://www.coursera.org/professional-certificates/google-cybersecurity', exam: 'CompTIA Security+', examUrl: 'https://www.comptia.org/certifications/security' },
  'devops':         { course: 'DevOps Roadmap (roadmap.sh)', url: 'https://roadmap.sh/devops', exam: 'AWS DevOps Engineer – Professional', examUrl: 'https://aws.amazon.com/certification/certified-devops-engineer-professional/' },
  'sre':            { course: 'Google SRE Book (Free)', url: 'https://sre.google/sre-book/table-of-contents/', exam: 'CKA – Certified Kubernetes Administrator', examUrl: 'https://training.linuxfoundation.org/certification/certified-kubernetes-administrator-cka/' },
  'blockchain':     { course: 'CryptoZombies (Free)', url: 'https://cryptozombies.io/', exam: 'Certified Blockchain Developer (Blockchain Council)', examUrl: 'https://www.blockchain-council.org/certifications/certified-blockchain-developer/' },
  'solidity':       { course: 'CryptoZombies (Free)', url: 'https://cryptozombies.io/', exam: 'Certified Blockchain Developer (Blockchain Council)', examUrl: 'https://www.blockchain-council.org/certifications/certified-blockchain-developer/' },
  'ios':            { course: 'Apple SwiftUI Tutorials', url: 'https://developer.apple.com/tutorials/swiftui', exam: 'Meta iOS Developer Certificate', examUrl: 'https://www.coursera.org/professional-certificates/meta-ios-developer' },
  'android':        { course: 'Android Developer Training (Google)', url: 'https://developer.android.com/courses', exam: 'Google Associate Android Developer', examUrl: 'https://developers.google.com/certification/associate-android-developer' },
  'flutter':        { course: 'Flutter Official Codelabs', url: 'https://docs.flutter.dev/get-started/codelab', exam: 'Google Associate Android Developer', examUrl: 'https://developers.google.com/certification/associate-android-developer' },
  'product management': { course: 'Product School Resources (Free)', url: 'https://productschool.com/resources', exam: 'AIPMM Certified Product Manager', examUrl: 'https://aipmm.com/cpm-certification' },
  'project management': { course: 'Google Project Management (Coursera)', url: 'https://www.coursera.org/professional-certificates/google-project-management', exam: 'PMP – Project Management Professional', examUrl: 'https://www.pmi.org/certifications/project-management-pmp' },
  'agile':          { course: 'Scrum Guide (Official, Free)', url: 'https://scrumguides.org/', exam: 'Professional Scrum Master I (PSM I)', examUrl: 'https://www.scrum.org/assessments/professional-scrum-master-i-certification' },
  'system design':  { course: 'System Design Primer (GitHub)', url: 'https://github.com/donnemartin/system-design-primer', exam: 'AWS Solutions Architect – Associate', examUrl: 'https://aws.amazon.com/certification/certified-solutions-architect-associate/' },
  'software engineering': { course: 'Software Engineering Roadmap (roadmap.sh)', url: 'https://roadmap.sh/software-design-architecture', exam: 'AWS Solutions Architect – Associate', examUrl: 'https://aws.amazon.com/certification/certified-solutions-architect-associate/' },
  'networking':     { course: 'Computer Networking (Coursera/Stanford)', url: 'https://www.coursera.org/learn/computer-networking', exam: 'CompTIA Network+', examUrl: 'https://www.comptia.org/certifications/network' },
  'embedded':       { course: 'LearnCpp.com', url: 'https://www.learncpp.com/', exam: 'CPA – C++ Certified Associate Programmer', examUrl: 'https://cppinstitute.org/cpa-c-certified-associate-programmer-certification' },
  'git':            { course: 'Pro Git Book (Free)', url: 'https://git-scm.com/book/en/v2', exam: 'GitHub Foundations Certification', examUrl: 'https://resources.github.com/learn/certifications/' },
  'tailwind':       { course: 'Tailwind CSS Official Docs', url: 'https://tailwindcss.com/docs', exam: 'Meta Front-End Developer Certificate', examUrl: 'https://www.coursera.org/professional-certificates/meta-front-end-developer' },
  'figma':          { course: 'Figma Official Tutorials', url: 'https://help.figma.com/hc/en-us/categories/360002051613', exam: 'Google UX Design Certificate', examUrl: 'https://www.coursera.org/professional-certificates/google-ux-design' },
  'qa':             { course: 'ISTQB Foundation Syllabus (Free)', url: 'https://www.istqb.org/certifications/certified-tester-foundation-level', exam: 'ISTQB Certified Tester Foundation Level', examUrl: 'https://www.istqb.org/certifications/certified-tester-foundation-level' },
  'testing':        { course: 'ISTQB Foundation Syllabus (Free)', url: 'https://www.istqb.org/certifications/certified-tester-foundation-level', exam: 'ISTQB Certified Tester Foundation Level', examUrl: 'https://www.istqb.org/certifications/certified-tester-foundation-level' },
};

// ─── Fetch full JD from ATS APIs ───
async function fetchJobDescription(source, applyUrl, externalId) {
  try {
    if (source === 'greenhouse') {
      const idMatch = applyUrl?.match(/(?:jid=|jobs\/)(\d+)/);
      // Extract board slug from URL: job-boards.greenhouse.io/SLUG or boards.greenhouse.io/SLUG
      const slugMatch = applyUrl?.match(/greenhouse\.io\/([^/]+)/);
      const slug = slugMatch?.[1] || 'x';
      if (idMatch) {
        const r = await fetch(`https://boards-api.greenhouse.io/v1/boards/${slug}/jobs/${idMatch[1]}`);
        if (r.ok) { const d = await r.json(); return (d.content || '') + ' ' + (d.departments?.map(x=>x.name).join(' ') || ''); }
      }
      // Fallback: try fetching from the apply URL directly
      if (applyUrl) {
        const r2 = await fetch(applyUrl, { redirect: 'follow' });
        if (r2.ok) { const html = await r2.text(); return html.replace(/<[^>]+>/g, ' ').substring(0, 5000); }
      }
    }
    if (source === 'ashby') {
      const idMatch = applyUrl?.match(/ashbyhq\.com\/[^/]+\/([a-f0-9-]+)/);
      if (idMatch) {
        const r = await fetch('https://api.ashbyhq.com/posting-api/posting/' + idMatch[1]);
        if (r.ok) { const d = await r.json(); return (d.descriptionHtml || d.descriptionPlain || '').replace(/<[^>]+>/g, ' ') + ' ' + (d.department || ''); }
      }
    }
    if (source === 'lever') {
      const slugMatch = applyUrl?.match(/lever\.co\/([^/]+)\/([a-f0-9-]+)/);
      if (slugMatch) {
        const r = await fetch(`https://api.lever.co/v0/postings/${slugMatch[1]}/${slugMatch[2]}`);
        if (r.ok) { const d = await r.json(); return (d.descriptionPlain || d.description || '') + ' ' + (d.additionalPlain || '') + ' ' + (d.lists?.map(l => l.text + ' ' + l.content).join(' ') || ''); }
      }
    }
    if (source === 'smartrecruiters') {
      const m = applyUrl?.match(/smartrecruiters\.com\/([^/]+)\/(\d+)/);
      if (m) {
        const r = await fetch(`https://api.smartrecruiters.com/v1/companies/${m[1]}/postings/${m[2]}`);
        if (r.ok) { const d = await r.json(); return (d.jobAd?.sections?.jobDescription?.text || '') + ' ' + (d.jobAd?.sections?.qualifications?.text || '') + ' ' + (d.jobAd?.sections?.additionalInformation?.text || ''); }
      }
    }
  } catch { return ''; }
  return '';
}

// ─── Parse skills from JD text ───
function parseSkillsFromJD(jdText, title) {
  const t = (jdText + ' ' + title).toLowerCase();
  const found = [];
  const patterns = [
    [/\bpython\b/, 'python'], [/\bdjango\b/, 'django'], [/\bflask\b/, 'flask'], [/\bfastapi\b/, 'fastapi'],
    [/\bjava\b(?!script)/, 'java'], [/\bspring\b/, 'spring'],
    [/\breact\s*native\b/, 'react native'], [/\breact\b/, 'react'],
    [/\bnext\.?js\b/, 'nextjs'], [/\bvue\.?js?\b/, 'vue'], [/\bangular\b/, 'angular'],
    [/\bjavascript\b|\bjs\b/, 'javascript'], [/\btypescript\b|\bts\b/, 'typescript'],
    [/\bnode\.?js?\b/, 'node'],
    [/\bgolang\b|\bgo\s+(?:lang|programming)\b|\bwritten\s+in\s+go\b/, 'golang'],
    [/\brust\b/, 'rust'], [/\bkotlin\b/, 'kotlin'], [/\bswift\b/, 'swift'],
    [/\bscala\b/, 'scala'], [/\bruby\b|\brails\b/, 'ruby'], [/\bphp\b|\blaravel\b/, 'php'],
    [/\bc\+\+\b/, 'c++'], [/\bc#\b|\.net\b/, 'c#'],
    [/\bsql\b/, 'sql'], [/\bpostgres(?:ql)?\b/, 'postgresql'], [/\bmysql\b/, 'mysql'],
    [/\bmongodb\b|\bmongo\b/, 'mongodb'], [/\bredis\b/, 'redis'],
    [/\bkafka\b/, 'kafka'], [/\belasticsearch\b|\belastic\b/, 'elasticsearch'],
    [/\bgraphql\b/, 'graphql'],
    [/\baws\b|\bamazon\s*web/, 'aws'], [/\bazure\b/, 'azure'], [/\bgcp\b|\bgoogle\s*cloud/, 'gcp'],
    [/\bkubernetes\b|\bk8s\b/, 'kubernetes'], [/\bdocker\b/, 'docker'],
    [/\bterraform\b/, 'terraform'], [/\bansible\b/, 'ansible'], [/\blinux\b/, 'linux'],
    [/\bmachine\s*learn/, 'machine learning'], [/\bdeep\s*learn/, 'deep learning'],
    [/\bnlp\b|\bnatural\s*language/, 'nlp'], [/\bcomputer\s*vision\b/, 'computer vision'],
    [/\bartificial\s*intelligence\b|\bai\/ml\b|\bgen\s*ai\b|\bllm\b/, 'ai'],
    [/\bdata\s*scien/, 'data science'], [/\bdata\s*engineer/, 'data engineering'],
    [/\banalytics\b|\banalyst\b/, 'analytics'],
    [/\bcybersecurity\b|\binfosec\b/, 'cybersecurity'], [/\bsecurity\b/, 'security'],
    [/\bdevops\b/, 'devops'], [/\bsre\b|\bsite\s*reliab/, 'sre'],
    [/\bblockchain\b|\bweb3\b|\bcrypto\b/, 'blockchain'], [/\bsolidity\b/, 'solidity'],
    [/\bios\b/, 'ios'], [/\bandroid\b/, 'android'], [/\bflutter\b/, 'flutter'],
    [/\bproduct\s*manag/, 'product management'], [/\bproject\s*manag/, 'project management'],
    [/\bagile\b|\bscrum\b/, 'agile'],
    [/\bgit\b/, 'git'], [/\btailwind/, 'tailwind'], [/\bfigma\b/, 'figma'],
    [/\bembedded\b|\bfirmware\b/, 'embedded'],
    [/\bqa\b|\bquality\s*assur/, 'qa'], [/\btest(?:ing|er|ability)\b/, 'testing'],
  ];

  const added = new Set();
  for (const [pat, skill] of patterns) {
    if (pat.test(t) && !added.has(skill)) { found.push(skill); added.add(skill); }
  }

  // Role-based defaults if nothing found
  if (found.length === 0) {
    const tl = title.toLowerCase();
    if (/frontend|front.end/i.test(tl)) found.push('javascript', 'react', 'typescript');
    else if (/backend|back.end/i.test(tl)) found.push('python', 'sql', 'node');
    else if (/fullstack|full.stack/i.test(tl)) found.push('javascript', 'react', 'node', 'sql');
    else if (/data.engineer/i.test(tl)) found.push('python', 'sql', 'data engineering');
    else if (/data.scien|data.analy/i.test(tl)) found.push('python', 'sql', 'data science');
    else if (/devops|sre|site.reliab/i.test(tl)) found.push('devops', 'aws', 'kubernetes', 'docker');
    else if (/cloud/i.test(tl)) found.push('aws', 'kubernetes');
    else if (/mobile/i.test(tl)) found.push('ios', 'android', 'flutter');
    else if (/machine.learn|ml.eng/i.test(tl)) found.push('python', 'machine learning');
    else if (/platform/i.test(tl)) found.push('aws', 'kubernetes', 'docker');
    else if (/security|cyber/i.test(tl)) found.push('security', 'linux');
    else if (/architect/i.test(tl)) found.push('system design', 'aws');
    else if (/product.manag/i.test(tl)) found.push('product management', 'agile');
    else if (/project.manag/i.test(tl)) found.push('project management', 'agile');
    else if (/analyst/i.test(tl)) found.push('sql', 'python', 'analytics');
    else if (/qa|quality|test/i.test(tl)) found.push('qa', 'python');
    else if (/engineer|developer|software/i.test(tl)) found.push('python', 'javascript', 'sql');
    else found.push('software engineering');
  }

  return found;
}

// ─── Pick BEST resource + exam based on primary role ───
function pickResource(skills, title) {
  // Determine primary skill from title
  const tl = title.toLowerCase();
  let primary = skills[0]; // default to first

  // Override based on title specificity
  if (/django/i.test(tl)) primary = 'django';
  else if (/flask/i.test(tl)) primary = 'flask';
  else if (/fastapi/i.test(tl)) primary = 'fastapi';
  else if (/spring/i.test(tl)) primary = 'spring';
  else if (/react\s*native/i.test(tl)) primary = 'react native';
  else if (/nextjs|next\.js/i.test(tl)) primary = 'nextjs';
  else if (/flutter/i.test(tl)) primary = 'flutter';
  else if (/android/i.test(tl)) primary = 'android';
  else if (/ios|swift/i.test(tl)) primary = 'ios';
  else if (/machine.?learn|ml.?eng|deep.?learn/i.test(tl)) primary = 'machine learning';
  else if (/nlp|natural.?language/i.test(tl)) primary = 'nlp';
  else if (/computer.?vision/i.test(tl)) primary = 'computer vision';
  else if (/data.?scien|data.?analy/i.test(tl)) primary = 'data science';
  else if (/data.?engineer/i.test(tl)) primary = 'data engineering';
  else if (/devops/i.test(tl)) primary = 'devops';
  else if (/sre|site.?reliab/i.test(tl)) primary = 'sre';
  else if (/cloud/i.test(tl)) primary = 'aws';
  else if (/kubernetes|k8s/i.test(tl)) primary = 'kubernetes';
  else if (/terraform/i.test(tl)) primary = 'terraform';
  else if (/security|cyber|infosec/i.test(tl)) primary = 'security';
  else if (/blockchain|web3|crypto|solidity/i.test(tl)) primary = 'blockchain';
  else if (/architect/i.test(tl)) primary = 'system design';
  else if (/product.?manag/i.test(tl)) primary = 'product management';
  else if (/project.?manag|scrum/i.test(tl)) primary = 'project management';
  else if (/qa|quality|test(?:er|ing)|automation/i.test(tl)) primary = 'qa';
  else if (/engineering.?manager|tech.?lead|head.?of.?eng|vp.?eng|staff|principal/i.test(tl)) primary = 'system design';
  else if (/frontend|front.?end/i.test(tl)) primary = 'react';
  else if (/backend|back.?end/i.test(tl)) primary = skills.includes('java') ? 'java' : skills.includes('golang') ? 'golang' : 'python';
  else if (/fullstack|full.?stack/i.test(tl)) primary = 'javascript';
  else if (/embedded|firmware/i.test(tl)) primary = 'embedded';
  else if (/rust/i.test(tl)) primary = 'rust';
  else if (/golang|go /i.test(tl)) primary = 'golang';
  else if (/java(?!script)/i.test(tl)) primary = 'java';
  else if (/python/i.test(tl)) primary = 'python';

  const r = SKILL_DB[primary] || SKILL_DB[skills[0]] || SKILL_DB['software engineering'];
  return { course: r.course, courseUrl: r.url, exam: r.exam, examUrl: r.examUrl };
}

function normalizeLocation(loc) {
  const l = (loc || '').toLowerCase();
  if (l.includes('malaysia') || l.includes('kuala lumpur') || l.includes(', my') ||
      l.includes('petaling') || l.includes('penang') || l.includes('johor') ||
      l.includes('cyberjaya') || l.includes('selangor')) return 'Malaysia';
  return 'Singapore';
}

function boardUrl(source, company, applyUrl) {
  if (source === 'greenhouse') { const s = applyUrl?.match(/greenhouse\.io\/([^/]+)/)?.[1] || company.toLowerCase().replace(/\s+/g, ''); return `https://boards.greenhouse.io/${s}`; }
  if (source === 'ashby') { const s = applyUrl?.match(/ashbyhq\.com\/([^/]+)/)?.[1] || company.toLowerCase().replace(/\s+/g, ''); return `https://jobs.ashbyhq.com/${s}`; }
  if (source === 'lever') { const s = applyUrl?.match(/lever\.co\/([^/]+)/)?.[1] || company.toLowerCase().replace(/\s+/g, ''); return `https://jobs.lever.co/${s}`; }
  if (source === 'smartrecruiters') { const s = applyUrl?.match(/smartrecruiters\.com\/([^/]+)/)?.[1] || company; return `https://careers.smartrecruiters.com/${s}`; }
  return '';
}

function escCsv(s) { if (!s) return ''; s = String(s); if (s.includes(',') || s.includes('"') || s.includes('\n')) return '"' + s.replace(/"/g, '""') + '"'; return s; }
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function main() {
  console.log('Fetching SG+MY jobs from DB...');
  const allJobs = [];
  for (const loc of ['singapore', ', sg', 'malaysia', 'kuala lumpur', ', my', 'petaling jaya', 'penang', 'johor']) {
    let offset = 0;
    while (true) {
      const r = await fetch(`${SB}/rest/v1/jobs?select=title,company,location,tags,apply_url,source,external_id&location=ilike.*${encodeURIComponent(loc)}*&offset=${offset}&limit=1000`, { headers });
      const d = await r.json(); if (!d.length) break;
      allJobs.push(...d); offset += d.length; if (d.length < 1000) break;
    }
  }
  const seen = new Set();
  const unique = allJobs.filter(j => { const k = (j.company + '|' + j.title).toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true; });
  console.log(`Total SG+MY: ${unique.length}`);

  const techRegex = /engineer|developer|devops|sre|architect|frontend|backend|fullstack|full.stack|software|data.scien|data.engineer|data.analy|machine.learn|ml.engineer|ai.engineer|cloud|platform|infrastructure|security|cyber|mobile|ios|android|qa|quality|test|automation|product.manager|technical|tech.lead|staff|principal|solutions|systems|network|database|dba|site.reliab|web.develop|programmer|devsecops|mlops|dataops|bi.engineer|bi.analyst|analytics|scrum|ux.engineer|embedded|firmware|hardware|robotics|blockchain|smart.contract/i;
  const tech = unique.filter(j => techRegex.test(j.title));
  console.log(`Tech roles: ${tech.length}`);

  // Add NS manually
  tech.push({ title: 'Full Stack Engineer (Python/Django/React)', company: 'NS (Network School)', location: 'Malaysia', tags: ['python','django','postgresql','react','node','javascript','typescript','docker','aws','redis','nextjs','git','tailwind'], apply_url: 'https://ns.com/jobs', source: 'manual', _jd: 'Python Django PostgreSQL React Node.js JavaScript TypeScript Docker AWS Redis Next.js Git Tailwind Solidity Rust Bash SSH OAuth JWT GitHub Actions Vercel Cloudflare' });
  tech.push({ title: 'STEM Tutor (Decentralized Science & AI)', company: 'NS (Network School)', location: 'Malaysia', tags: ['ai','blockchain','python','data science'], apply_url: 'https://ns.com/jobs', source: 'manual', _jd: 'AI machine learning crypto blockchain Python data science reproducible research decentralized science fast.ai Jeremy Howard Dan Boneh cryptography online courses learnathons cryptocredentials' });

  console.log(`\nFetching full job descriptions for ${tech.length} jobs...`);

  // Fetch JDs in batches of 50 (parallel)
  const rows = ['Company,Location,Job Board link of company,Job Title,Job application URL,Skill,Book/Course/Website required to learn that skill,Resource URL of that book/Course/Website,Common exams for that skill,Exam URL'];
  let fetched = 0, jdSuccess = 0, jdFail = 0;

  for (let i = 0; i < tech.length; i += 50) {
    const batch = tech.slice(i, i + 50);
    const jds = await Promise.all(batch.map(async job => {
      if (job._jd) return job._jd;
      const jd = await fetchJobDescription(job.source, job.apply_url, job.external_id);
      return jd;
    }));

    for (let j = 0; j < batch.length; j++) {
      const job = batch[j];
      const jd = jds[j] || '';
      if (jd.length > 50) jdSuccess++; else jdFail++;
      const skills = parseSkillsFromJD(jd, job.title);
      const { course, courseUrl, exam, examUrl } = pickResource(skills, job.title);
      const location = job.source === 'manual' ? job.location : normalizeLocation(job.location);
      const board = job.source === 'manual' ? 'https://ns.com/jobs' : boardUrl(job.source, job.company, job.apply_url);
      let applyUrl = job.apply_url || '';
      applyUrl = applyUrl.replace(/https:\/\/api\.smartrecruiters\.com\/v1\/companies\/([^/]+)\/postings\/(\d+)/, 'https://jobs.smartrecruiters.com/$1/$2');

      rows.push([
        escCsv(job.company), escCsv(location), escCsv(board), escCsv(job.title),
        escCsv(applyUrl), escCsv(skills.join(', ')),
        escCsv(course), escCsv(courseUrl), escCsv(exam), escCsv(examUrl),
      ].join(','));
    }

    fetched += batch.length;
    console.log(`  ${fetched}/${tech.length} done (JD success: ${jdSuccess}, fail: ${jdFail})`);
  }

  const outPath = '/Users/vedang/Documents/sg_my_tech_jobs.csv';
  writeFileSync(outPath, rows.join('\n'), 'utf-8');
  console.log(`\nCSV written to ${outPath}`);
  console.log(`Total rows: ${rows.length - 1}`);

  // Stats
  const empty = rows.slice(1).filter(r => r.split(',').some((c, i) => i >= 6 && (!c || c === '""'))).length;
  console.log(`Rows with any empty resource/exam cells: ${empty}/${rows.length - 1}`);
}

main().catch(console.error);
