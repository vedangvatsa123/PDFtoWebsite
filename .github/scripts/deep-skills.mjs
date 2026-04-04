import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const SB = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SK = process.env.SUPABASE_SERVICE_ROLE_KEY;
const h = { 'apikey': SK, 'Authorization': 'Bearer ' + SK };
const all = [];
let off = 0;
while (true) {
  const r = await fetch(`${SB}/rest/v1/jobs?select=title,company,location,tags,description&offset=${off}&limit=1000`, { headers: h });
  const d = await r.json();
  if (!d.length) break;
  all.push(...d);
  off += d.length;
  if (d.length < 1000) break;
}
console.log('Total jobs:', all.length);

// ============ 1. PROGRAMMING LANGUAGES ============
const langs = {
  'Python': /\bpython\b/i,
  'Java': /\bjava\b(?!script)/i,
  'JavaScript': /\bjavascript\b|\bjs\b/i,
  'TypeScript': /\btypescript\b|\bts\b/i,
  'Go': /\bgolang\b|\bgo\b/i,
  'Rust': /\brust\b/i,
  'C++': /\bc\+\+\b|\bcpp\b/i,
  'C#': /\bc#\b|\.net\b|dotnet/i,
  'Ruby': /\bruby\b/i,
  'PHP': /\bphp\b/i,
  'Swift': /\bswift\b/i,
  'Kotlin': /\bkotlin\b/i,
  'Scala': /\bscala\b/i,
  'R': /\br\b(?=\s|,|$)/i,
  'SQL': /\bsql\b/i,
  'Solidity': /\bsolidity\b/i,
};

console.log('\n=== PROGRAMMING LANGUAGES (in titles) ===');
const langInTitle = {};
for (const [name, rx] of Object.entries(langs)) {
  const c = all.filter(j => rx.test(j.title || '')).length;
  if (c > 5) langInTitle[name] = c;
}
Object.entries(langInTitle).sort((a,b)=>b[1]-a[1]).forEach(([l,c]) => {
  console.log(`  ${l}: ${c} (${(c/all.length*100).toFixed(2)}%)`);
});

console.log('\n=== PROGRAMMING LANGUAGES (in tags) ===');
const langInTags = {};
for (const [name, rx] of Object.entries(langs)) {
  const c = all.filter(j => (Array.isArray(j.tags)?j.tags:[]).some(t => rx.test(t))).length;
  if (c > 10) langInTags[name] = c;
}
Object.entries(langInTags).sort((a,b)=>b[1]-a[1]).forEach(([l,c]) => {
  console.log(`  ${l}: ${c} (${(c/all.length*100).toFixed(2)}%)`);
});

// ============ 2. FRAMEWORKS & TOOLS ============
const tools = {
  'React': /\breact\b/i,
  'Node.js': /\bnode\.?js\b|\bnode\b/i,
  'Kubernetes': /\bkubernetes\b|\bk8s\b/i,
  'Docker': /\bdocker\b/i,
  'Terraform': /\bterraform\b/i,
  'GraphQL': /\bgraphql\b/i,
  'Redis': /\bredis\b/i,
  'Kafka': /\bkafka\b/i,
  'Spark': /\bspark\b/i,
  'Django': /\bdjango\b/i,
  'Rails': /\brails\b/i,
  'Spring': /\bspring\b/i,
  'Angular': /\bangular\b/i,
  'Vue': /\bvue\b/i,
  'Next.js': /\bnext\.?js\b/i,
  'Flutter': /\bflutter\b/i,
  'TensorFlow': /\btensorflow\b/i,
  'PyTorch': /\bpytorch\b/i,
  'LLM': /\bllm\b/i,
  'GenAI': /\bgenai\b|\bgenerative.ai\b/i,
};

console.log('\n=== FRAMEWORKS & TOOLS (in titles) ===');
const toolInTitle = {};
for (const [name, rx] of Object.entries(tools)) {
  const c = all.filter(j => rx.test(j.title || '')).length;
  if (c > 3) toolInTitle[name] = c;
}
Object.entries(toolInTitle).sort((a,b)=>b[1]-a[1]).forEach(([l,c]) => {
  console.log(`  ${l}: ${c} (${(c/all.length*100).toFixed(2)}%)`);
});

// ============ 3. CLOUD PLATFORMS ============
const clouds = {
  'AWS': /\baws\b|\bamazon web/i,
  'GCP': /\bgcp\b|\bgoogle cloud/i,
  'Azure': /\bazure\b/i,
};
console.log('\n=== CLOUD PLATFORMS (in titles) ===');
for (const [name, rx] of Object.entries(clouds)) {
  const c = all.filter(j => rx.test(j.title || '')).length;
  console.log(`  ${name}: ${c} (${(c/all.length*100).toFixed(2)}%)`);
}

// ============ 4. ROLE TYPE × LANGUAGE CROSS-TAB ============
function getRegion(loc) {
  const l = (loc || '').toLowerCase();
  if (/singapore|\bsg\b/.test(l)) return 'Singapore';
  if (/india|bangalore|bengaluru|mumbai|delhi|hyderabad|pune|chennai/.test(l)) return 'India';
  if (/united states|usa|\bus\b|new york|san francisco|california|seattle|austin|boston|chicago|denver|los angeles/.test(l)) return 'USA';
  if (/united kingdom|\buk\b|london/.test(l)) return 'UK';
  if (/japan|tokyo/.test(l)) return 'Japan';
  if (/remote/.test(l)) return 'Remote';
  return 'Other';
}

console.log('\n=== LANGUAGE × REGION (title mentions) ===');
const topLangs = ['Python','Java','JavaScript','TypeScript','Go','Rust','Kotlin','SQL'];
const topRegions = ['USA','Singapore','India','UK','Japan','Remote'];
for (const region of topRegions) {
  const rJobs = all.filter(j => getRegion(j.location) === region);
  const langLine = topLangs.map(lang => {
    const rx = langs[lang];
    const c = rJobs.filter(j => rx.test(j.title || '')).length;
    return `${lang}:${(c/rJobs.length*100).toFixed(1)}%`;
  }).join(' | ');
  console.log(`  ${region} (${rJobs.length}): ${langLine}`);
}

// ============ 5. ROLE SPECIALIZATIONS ============
const specs = {
  'Backend': /\bbackend\b|\bback.end\b/i,
  'Frontend': /\bfrontend\b|\bfront.end\b/i,
  'Full-Stack': /\bfull.?stack\b/i,
  'Mobile': /\bmobile\b|\bandroid\b|\bios\b/i,
  'DevOps/SRE': /\bdevops\b|\bsre\b|\bsite.reliability\b/i,
  'Data Eng.': /\bdata.engineer\b/i,
  'Data Science': /\bdata.scien\b/i,
  'ML Engineer': /\bmachine.learn\b|\bml.engineer\b|\bml\b/i,
  'AI Engineer': /\bai.engineer\b|\bartificial.intell\b/i,
  'Cloud': /\bcloud\b/i,
  'Security': /\bsecurity\b|\bcyber\b/i,
  'Blockchain': /\bblockchain\b|\bweb3\b|\bsmart.contract\b/i,
  'QA/Testing': /\bqa\b|\bquality.assur\b|\btesting\b|\bsdet\b/i,
  'Embedded': /\bembedded\b|\bfirmware\b|\bhardware\b/i,
};

console.log('\n=== ENGINEERING SPECIALIZATIONS (titles) ===');
const specCounts = {};
for (const [name, rx] of Object.entries(specs)) {
  const c = all.filter(j => rx.test(j.title || '')).length;
  specCounts[name] = c;
}
Object.entries(specCounts).sort((a,b)=>b[1]-a[1]).forEach(([s,c]) => {
  console.log(`  ${s}: ${c} (${(c/all.length*100).toFixed(1)}%)`);
});

// ============ 6. TITLE COMPLEXITY: avg words ============
const titleLengths = all.map(j => (j.title||'').split(/\s+/).length);
const avgTitle = titleLengths.reduce((a,b)=>a+b,0)/titleLengths.length;
console.log(`\n=== TITLE AVG WORDS: ${avgTitle.toFixed(1)} ===`);

// ============ 7. WHICH COMPANIES HIRE WHICH SPECIALIZATIONS ============
console.log('\n=== TOP COMPANIES BY SPECIALIZATION ===');
for (const [specName, rx] of Object.entries(specs)) {
  const matches = all.filter(j => rx.test(j.title || ''));
  if (matches.length < 10) continue;
  const coCounts = {};
  for (const j of matches) coCounts[j.company] = (coCounts[j.company]||0) + 1;
  const top3 = Object.entries(coCounts).sort((a,b)=>b[1]-a[1]).slice(0,3);
  console.log(`  ${specName} (${matches.length}): ${top3.map(([c,n])=>`${c}(${n})`).join(', ')}`);
}

// ============ 8. JOB TITLE ADJECTIVES (Senior, Staff, Principal, Lead) vs functions ============
console.log('\n=== SENIORITY × SPECIALIZATION ===');
const senLevels = {
  'Senior': /\bsenior\b|\bsr\b/i,
  'Staff': /\bstaff\b/i,
  'Principal': /\bprincipal\b/i,
  'Lead': /\blead\b/i,
};
for (const [sen, senRx] of Object.entries(senLevels)) {
  const senJobs = all.filter(j => senRx.test(j.title||''));
  const topSpecs = {};
  for (const [specName, specRx] of Object.entries(specs)) {
    const c = senJobs.filter(j => specRx.test(j.title||'')).length;
    if (c > 5) topSpecs[specName] = c;
  }
  const sorted = Object.entries(topSpecs).sort((a,b)=>b[1]-a[1]).slice(0,5);
  console.log(`  ${sen} (${senJobs.length}): ${sorted.map(([s,c])=>`${s}(${(c/senJobs.length*100).toFixed(0)}%)`).join(', ')}`);
}

// ============ 9. "MANAGER" vs "ENGINEER" vs "ANALYST" RATIOS ============
console.log('\n=== TITLE ARCHETYPE RATIOS ===');
const archetypes = {
  'Engineer': /\bengineer\b/i,
  'Manager': /\bmanager\b/i,
  'Analyst': /\banalyst\b/i,
  'Designer': /\bdesigner\b/i,
  'Architect': /\barchitect\b/i,
  'Scientist': /\bscientist\b/i,
  'Consultant': /\bconsultant\b/i,
  'Director': /\bdirector\b/i,
  'Specialist': /\bspecialist\b/i,
  'Coordinator': /\bcoordinator\b/i,
};
for (const [name, rx] of Object.entries(archetypes)) {
  const c = all.filter(j => rx.test(j.title||'')).length;
  console.log(`  ${name}: ${c} (${(c/all.length*100).toFixed(1)}%)`);
}

// ============ 10. REMOTE AVAILABILITY BY SPECIALIZATION ============
console.log('\n=== REMOTE % BY SPECIALIZATION ===');
for (const [specName, rx] of Object.entries(specs)) {
  const matches = all.filter(j => rx.test(j.title || ''));
  if (matches.length < 20) continue;
  const remote = matches.filter(j => /remote/i.test(j.location||'')).length;
  console.log(`  ${specName} (n=${matches.length}): ${(remote/matches.length*100).toFixed(1)}% remote`);
}
