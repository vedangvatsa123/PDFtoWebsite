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

// Tag frequency analysis
const tagCount = {};
for (const j of all) {
  const tags = (Array.isArray(j.tags) ? j.tags : []).map(t => String(t).trim().toLowerCase()).filter(Boolean);
  for (const t of tags) tagCount[t] = (tagCount[t] || 0) + 1;
}
const sorted = Object.entries(tagCount).sort((a, b) => b[1] - a[1]);
console.log('\n=== ALL TAGS (sorted by frequency) ===');
sorted.slice(0, 30).forEach(([tag, count]) => {
  console.log(`  ${tag}: ${count} (${(count/all.length*100).toFixed(1)}%)`);
});

// Title keyword frequency
const titleWords = {};
for (const j of all) {
  const words = (j.title || '').toLowerCase().split(/[\s,\-\/\(\)]+/).filter(w => w.length > 2);
  for (const w of words) titleWords[w] = (titleWords[w] || 0) + 1;
}
console.log('\n=== TITLE KEYWORDS (top 30) ===');
Object.entries(titleWords).sort((a, b) => b[1] - a[1]).slice(0, 30).forEach(([w, c]) => {
  console.log(`  ${w}: ${c} (${(c/all.length*100).toFixed(1)}%)`);
});

// Skills that appear in titles
const skillTerms = ['python', 'java', 'golang', 'rust', 'react', 'typescript', 'kubernetes', 'docker', 'aws', 'gcp', 'azure', 'sql', 'node', 'ruby', 'swift', 'kotlin', 'flutter', 'angular', 'vue', 'terraform', 'redis', 'kafka', 'spark', 'blockchain', 'solidity', 'defi', 'web3', 'llm', 'genai', 'machine learning', 'deep learning', 'nlp', 'computer vision'];
console.log('\n=== SKILL TERMS IN TITLES ===');
for (const skill of skillTerms) {
  const count = all.filter(j => (j.title || '').toLowerCase().includes(skill)).length;
  if (count > 5) console.log(`  ${skill}: ${count} (${(count/all.length*100).toFixed(1)}%)`);
}

// Co-occurrence: which tags appear together most
console.log('\n=== TAG CO-OCCURRENCE (top pairs) ===');
const pairs = {};
for (const j of all) {
  const tags = [...new Set((Array.isArray(j.tags) ? j.tags : []).map(t => String(t).trim().toLowerCase()).filter(Boolean))];
  for (let i = 0; i < tags.length; i++) {
    for (let k = i + 1; k < tags.length; k++) {
      const pair = [tags[i], tags[k]].sort().join(' + ');
      pairs[pair] = (pairs[pair] || 0) + 1;
    }
  }
}
Object.entries(pairs).sort((a, b) => b[1] - a[1]).slice(0, 15).forEach(([pair, c]) => {
  console.log(`  ${pair}: ${c}`);
});

// Roles with highest % of AI/ML tags
console.log('\n=== % AI/ML TAGGED BY ROLE ===');
function getRole(title) {
  const t = (title || '').toLowerCase();
  if (/engineer|developer|software|programmer|fullstack|frontend|backend/.test(t)) return 'Engineering';
  if (/data.scien|data.eng|data.analy|analytics|bi\b/.test(t)) return 'Data';
  if (/machine.learn|ml|ai.eng|deep.learn|nlp|llm/.test(t)) return 'AI / ML';
  if (/product.manag/.test(t)) return 'Product';
  if (/design|ux|ui/.test(t)) return 'Design';
  if (/devops|sre|platform|infrastructure|cloud/.test(t)) return 'Infrastructure';
  if (/security|cyber/.test(t)) return 'Security';
  if (/sales|account|business.dev/.test(t)) return 'Sales';
  if (/manager|director|vp|head.of|chief|lead/.test(t)) return 'Leadership';
  return 'Other';
}
const roleAI = {};
const roleTotal = {};
for (const j of all) {
  const role = getRole(j.title);
  roleTotal[role] = (roleTotal[role] || 0) + 1;
  if (/ai|machine.learning|ml|deep.learning/i.test(j.tags || '')) {
    roleAI[role] = (roleAI[role] || 0) + 1;
  }
}
for (const role of Object.keys(roleTotal).sort()) {
  const ai = roleAI[role] || 0;
  const total = roleTotal[role];
  console.log(`  ${role}: ${ai}/${total} = ${(ai/total*100).toFixed(1)}%`);
}

// Remote vs on-site by seniority
console.log('\n=== REMOTE % BY SENIORITY ===');
function getSeniority(title) {
  const t = (title || '').toLowerCase();
  if (/\bintern\b|new.grad|graduate|entry.level/.test(t)) return 'Intern/Grad';
  if (/\bjunior\b|\bjr\b/.test(t)) return 'Junior';
  if (/\bsenior\b|\bsr\b/.test(t)) return 'Senior';
  if (/\bstaff\b|\bprincipal\b/.test(t)) return 'Staff+';
  if (/\bdirector\b|\bvp\b|\bchief\b|\bc-level/.test(t)) return 'Director+';
  return 'Mid-level';
}
const senRemote = {};
const senTotal = {};
for (const j of all) {
  const sen = getSeniority(j.title);
  senTotal[sen] = (senTotal[sen] || 0) + 1;
  if (/remote/i.test(j.location || '')) senRemote[sen] = (senRemote[sen] || 0) + 1;
}
for (const s of ['Intern/Grad', 'Junior', 'Mid-level', 'Senior', 'Staff+', 'Director+']) {
  const rem = senRemote[s] || 0;
  const tot = senTotal[s] || 1;
  console.log(`  ${s}: ${(rem/tot*100).toFixed(1)}% remote (${rem}/${tot})`);
}
