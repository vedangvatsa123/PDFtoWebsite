import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const SB = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SK = process.env.SUPABASE_SERVICE_ROLE_KEY;
const h = { 'apikey': SK, 'Authorization': `Bearer ${SK}`, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' };

let fixed = 0, offset = 0;
while (true) {
  const r = await fetch(`${SB}/rest/v1/jobs?select=id,apply_url&apply_url=like.https://api.smartrecruiters.com*&limit=100&offset=${offset}`, { headers: h });
  const rows = await r.json();
  if (!rows.length) break;

  for (const row of rows) {
    // Extract company and jobId from: https://api.smartrecruiters.com/v1/companies/{Company}/postings/{id}
    const m = row.apply_url.match(/\/companies\/([^/]+)\/postings\/(.+)/);
    if (!m) { console.log('SKIP:', row.apply_url); continue; }
    const newUrl = `https://jobs.smartrecruiters.com/${m[1]}/${m[2]}`;
    
    const ur = await fetch(`${SB}/rest/v1/jobs?id=eq.${row.id}`, {
      method: 'PATCH',
      headers: h,
      body: JSON.stringify({ apply_url: newUrl })
    });
    if (ur.ok) fixed++;
    else console.log('ERR:', row.id, ur.status);
  }
  console.log(`Batch done: ${fixed} fixed so far...`);
  offset += rows.length;
}
console.log(`\nDone! Fixed ${fixed} SmartRecruiters URLs.`);
