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

function getRegion(loc) {
  const l = (loc || '').toLowerCase();
  if (/singapore|\bsg\b/.test(l)) return 'Singapore';
  if (/india|bangalore|bengaluru|mumbai|delhi|hyderabad|pune|chennai|gurgaon|noida/.test(l)) return 'India';
  if (/malaysia|kuala lumpur|petaling|penang/.test(l)) return 'Malaysia';
  if (/united states|usa|\bus\b|new york|san francisco|california|seattle|austin|boston|chicago|denver|los angeles/.test(l)) return 'USA';
  if (/united kingdom|\buk\b|london/.test(l)) return 'UK';
  if (/japan|tokyo/.test(l)) return 'Japan';
  if (/thailand|bangkok/.test(l)) return 'Thailand';
  if (/remote/.test(l)) return 'Remote';
  return null;
}

function getRole(title) {
  const t = (title || '').toLowerCase();
  if (/engineer|developer|software|programmer|fullstack|frontend|backend/.test(t)) return 'Engineering';
  if (/data.scien|data.eng|data.analy|analytics|bi\b/.test(t)) return 'Data & Analytics';
  if (/machine.learn|ml|ai.eng|deep.learn|nlp|llm/.test(t)) return 'AI / ML';
  if (/product.manag|program.manag|tpm/.test(t)) return 'Product';
  if (/design|ux|ui/.test(t)) return 'Design';
  if (/devops|sre|platform|infrastructure|cloud/.test(t)) return 'Infrastructure';
  if (/security|cyber/.test(t)) return 'Security';
  if (/sales|account|business.dev|solutions/.test(t)) return 'Sales & BD';
  if (/manager|director|vp|head.of|chief|lead/.test(t)) return 'Leadership';
  if (/marketing|growth|comms/.test(t)) return 'Marketing';
  if (/support|operations|ops/.test(t)) return 'Operations';
  return 'Other';
}

// Per-region role breakdown
const regions = ['USA', 'Singapore', 'India', 'UK', 'Remote', 'Malaysia', 'Japan', 'Thailand'];
for (const region of regions) {
  const regionJobs = all.filter(j => getRegion(j.location) === region);
  const roles = {};
  for (const j of regionJobs) {
    const role = getRole(j.title);
    roles[role] = (roles[role] || 0) + 1;
  }
  const sorted = Object.entries(roles).sort((a, b) => b[1] - a[1]);
  const total = regionJobs.length;
  console.log(`\n${region} (${total} roles):`);
  sorted.slice(0, 5).forEach(([role, count]) => {
    console.log(`  ${role}: ${count} (${(count/total*100).toFixed(1)}%)`);
  });
}

// Remote breakdown by role
console.log('\n=== REMOTE ROLES BY TYPE ===');
const remoteJobs = all.filter(j => /remote/i.test(j.location || ''));
const remoteRoles = {};
for (const j of remoteJobs) {
  const r = getRole(j.title);
  remoteRoles[r] = (remoteRoles[r] || 0) + 1;
}
Object.entries(remoteRoles).sort((a, b) => b[1] - a[1]).forEach(([r, c]) => console.log(`  ${r}: ${c} (${(c/remoteJobs.length*100).toFixed(1)}%)`));

// Top companies per region
console.log('\n=== TOP 3 COMPANIES PER REGION ===');
for (const region of ['Singapore', 'India', 'USA', 'UK', 'Remote']) {
  const regionJobs = all.filter(j => getRegion(j.location) === region);
  const companies = {};
  for (const j of regionJobs) companies[j.company] = (companies[j.company] || 0) + 1;
  const top3 = Object.entries(companies).sort((a, b) => b[1] - a[1]).slice(0, 3);
  console.log(`  ${region}: ${top3.map(([c, n]) => `${c}(${n})`).join(', ')}`);
}
