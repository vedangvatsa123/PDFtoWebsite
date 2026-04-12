import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const SB = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SK = process.env.SUPABASE_SERVICE_ROLE_KEY;
const h = { 'apikey': SK, 'Authorization': 'Bearer ' + SK };
const all = [];
let off = 0;
while (true) {
  const r = await fetch(`${SB}/rest/v1/jobs?select=title,location,tags&offset=${off}&limit=1000`, { headers: h });
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
  if (/remote/.test(l)) return 'Remote';
  return null;
}

const skillTags = ['python','go','sql','ai','ml','security','infrastructure','saas','testing','automation','compliance','openai','reliability'];
const regions = ['USA', 'Singapore', 'India', 'UK', 'Japan', 'Remote'];

for (const region of regions) {
  const rJobs = all.filter(j => getRegion(j.location) === region);
  const total = rJobs.length;
  const tagCounts = {};
  for (const j of rJobs) {
    const tags = (Array.isArray(j.tags) ? j.tags : []).map(t => String(t).trim().toLowerCase()).filter(Boolean);
    for (const t of tags) {
      if (t === 'full time') continue;
      tagCounts[t] = (tagCounts[t] || 0) + 1;
    }
  }
  const sorted = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]);
  console.log(`\n${region} (${total} jobs) - Top 8 tags:`);
  sorted.slice(0, 8).forEach(([tag, count]) => {
    console.log(`  ${tag}: ${count} (${(count/total*100).toFixed(1)}%)`);
  });

  // Title-based skill terms
  const titleSkills = {};
  const terms = ['machine learning','data','backend','frontend','fullstack','devops','cloud','mobile','android','ios','blockchain','web3','llm','genai'];
  for (const term of terms) {
    const c = rJobs.filter(j => (j.title||'').toLowerCase().includes(term)).length;
    if (c > 3) titleSkills[term] = c;
  }
  if (Object.keys(titleSkills).length > 0) {
    console.log(`  Title skills: ${Object.entries(titleSkills).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`${k}(${(v/total*100).toFixed(1)}%)`).join(', ')}`);
  }
}
