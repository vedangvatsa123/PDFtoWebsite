import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const SB = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SK = process.env.SUPABASE_SERVICE_ROLE_KEY;
const h = { 'apikey': SK, 'Authorization': 'Bearer ' + SK };
const all = [];
let off = 0;
while (true) {
  const r = await fetch(`${SB}/rest/v1/jobs?select=title,company,location,tags&offset=${off}&limit=1000`, { headers: h });
  const d = await r.json();
  if (!d.length) break;
  all.push(...d);
  off += d.length;
  if (d.length < 1000) break;
}
console.log('Total jobs:', all.length);

// 1. GenAI / LLM as new title categories
console.log('\n=== GENAI / LLM TITLE EMERGENCE ===');
const genaiTitles = all.filter(j => /genai|generative ai/i.test(j.title));
const llmTitles = all.filter(j => /\bllm\b/i.test(j.title));
const aiEngTitles = all.filter(j => /\bai engineer/i.test(j.title));
const mlEngTitles = all.filter(j => /\bml engineer|machine learning engineer/i.test(j.title));
console.log(`  GenAI in title: ${genaiTitles.length} (${(genaiTitles.length/all.length*100).toFixed(2)}%)`);
console.log(`  LLM in title: ${llmTitles.length} (${(llmTitles.length/all.length*100).toFixed(2)}%)`);
console.log(`  AI Engineer: ${aiEngTitles.length} (${(aiEngTitles.length/all.length*100).toFixed(2)}%)`);
console.log(`  ML Engineer: ${mlEngTitles.length} (${(mlEngTitles.length/all.length*100).toFixed(2)}%)`);

// Sample GenAI titles
console.log('\n  Sample GenAI titles:');
genaiTitles.slice(0, 10).forEach(j => console.log(`    - ${j.title} (${j.company})`));
console.log('\n  Sample LLM titles:');
llmTitles.slice(0, 10).forEach(j => console.log(`    - ${j.title} (${j.company})`));

// 2. Frameworks in tags
console.log('\n=== FRAMEWORKS & TOOLS (in tags) ===');
const fwPatterns = {
  'React': /\breact\b/i, 'Node.js': /\bnode\.?js\b|\bnode\b/i,
  'Kubernetes': /\bkubernetes\b|\bk8s\b/i, 'Docker': /\bdocker\b/i,
  'Kafka': /\bkafka\b/i, 'Terraform': /\bterraform\b/i,
  'GraphQL': /\bgraphql\b/i, 'Redis': /\bredis\b/i,
  'PostgreSQL': /\bpostgres\b|\bpostgresql\b/i, 'MongoDB': /\bmongodb\b|\bmongo\b/i,
  'Elasticsearch': /\belastic\b/i, 'Spark': /\bspark\b/i,
  'Airflow': /\bairflow\b/i, 'dbt': /\bdbt\b/i,
  'Snowflake': /\bsnowflake\b/i, 'Databricks': /\bdatabricks\b/i,
  'PyTorch': /\bpytorch\b/i, 'TensorFlow': /\btensorflow\b/i,
  'Hugging Face': /\bhugging\b/i, 'LangChain': /\blangchain\b/i,
  'Next.js': /\bnext\.?js\b/i, 'Angular': /\bangular\b/i,
  'Vue': /\bvue\b/i, 'Django': /\bdjango\b/i,
  'Spring': /\bspring\b/i, 'Rails': /\brails\b/i,
  'Flutter': /\bflutter\b/i,
};

for (const [name, rx] of Object.entries(fwPatterns)) {
  const c = all.filter(j => (Array.isArray(j.tags) ? j.tags : []).some(t => rx.test(t))).length;
  if (c > 10) console.log(`  ${name}: ${c} (${(c/all.length*100).toFixed(2)}%)`);
}

// 3. Cloud platform by region
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

console.log('\n=== CLOUD PLATFORM × REGION (tags) ===');
const clouds = { 'AWS': /\baws\b/i, 'GCP': /\bgcp\b|\bgoogle cloud/i, 'Azure': /\bazure\b/i };
const topRegions = ['USA', 'Singapore', 'India', 'UK', 'Japan', 'Remote'];
for (const region of topRegions) {
  const rJobs = all.filter(j => getRegion(j.location) === region);
  const parts = Object.entries(clouds).map(([name, rx]) => {
    const n = rJobs.filter(j => (Array.isArray(j.tags)?j.tags:[]).some(t => rx.test(t))).length;
    return `${name}:${(n/rJobs.length*100).toFixed(1)}%`;
  });
  console.log(`  ${region} (${rJobs.length}): ${parts.join(' | ')}`);
}

// 4. Title word count distribution
console.log('\n=== TITLE WORD COUNT DISTRIBUTION ===');
const wcBuckets = { '1-3': 0, '4-5': 0, '6-7': 0, '8+': 0 };
for (const j of all) {
  const wc = j.title.split(/\s+/).length;
  if (wc <= 3) wcBuckets['1-3']++;
  else if (wc <= 5) wcBuckets['4-5']++;
  else if (wc <= 7) wcBuckets['6-7']++;
  else wcBuckets['8+']++;
}
for (const [k, v] of Object.entries(wcBuckets)) {
  console.log(`  ${k} words: ${v} (${(v/all.length*100).toFixed(1)}%)`);
}

// 5. Visa / relocation signals
console.log('\n=== VISA / RELOCATION SIGNALS ===');
const visaJobs = all.filter(j => /\bvisa\b|\brelocation\b|\bsponsorship\b|\brelocate\b/i.test(j.title + ' ' + (Array.isArray(j.tags)?j.tags.join(' '):'')));
console.log(`  Jobs mentioning visa/relocation: ${visaJobs.length} (${(visaJobs.length/all.length*100).toFixed(2)}%)`);

// 6. GenAI/LLM by region
console.log('\n=== GENAI/LLM/AI ENGINEER BY REGION ===');
for (const region of topRegions) {
  const rJobs = all.filter(j => getRegion(j.location) === region);
  const genai = rJobs.filter(j => /genai|generative ai|llm/i.test(j.title)).length;
  const aiEng = rJobs.filter(j => /\bai engineer/i.test(j.title)).length;
  console.log(`  ${region} (${rJobs.length}): GenAI/LLM ${(genai/rJobs.length*100).toFixed(2)}% | AI Eng ${(aiEng/rJobs.length*100).toFixed(2)}%`);
}

// 7. Most common exact titles (top 20)
console.log('\n=== MOST COMMON EXACT TITLES (top 20) ===');
const titleCounts = {};
for (const j of all) {
  const t = j.title.trim();
  titleCounts[t] = (titleCounts[t] || 0) + 1;
}
Object.entries(titleCounts).sort((a,b) => b[1]-a[1]).slice(0, 20)
  .forEach(([t, c]) => console.log(`  ${t}: ${c} (${(c/all.length*100).toFixed(2)}%)`));

// 8. Seniority × specialization detailed
console.log('\n=== SENIORITY × SPECIALIZATION (detailed) ===');
const senLevels = { 'Senior': /\bsenior\b|\bsr\b/i, 'Staff': /\bstaff\b/i, 'Principal': /\bprincipal\b/i, 'Lead': /\blead\b/i };
const specs = {
  'Backend': /\bbackend\b/i, 'Frontend': /\bfrontend\b/i, 'Full-Stack': /\bfull.?stack\b/i,
  'Mobile': /\bmobile\b|\bios\b|\bandroid\b/i, 'ML/AI': /\bml\b|\bai\b|\bmachine learn/i,
  'Data': /\bdata\b/i, 'Security': /\bsecurity\b|\bcyber\b/i, 'DevOps/SRE': /\bdevops\b|\bsre\b/i,
  'Cloud': /\bcloud\b/i,
};

for (const [sen, senRx] of Object.entries(senLevels)) {
  const senJobs = all.filter(j => senRx.test(j.title || ''));
  const specParts = Object.entries(specs).map(([name, rx]) => {
    const c = senJobs.filter(j => rx.test(j.title || '')).length;
    return { name, pct: (c / senJobs.length * 100).toFixed(1) };
  }).filter(s => parseFloat(s.pct) > 0.5).sort((a,b) => b.pct - a.pct);
  console.log(`  ${sen} (${senJobs.length}): ${specParts.map(s => `${s.name}:${s.pct}%`).join(', ')}`);
}
