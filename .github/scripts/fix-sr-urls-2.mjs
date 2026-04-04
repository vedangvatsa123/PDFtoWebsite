import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const SB = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SK = process.env.SUPABASE_SERVICE_ROLE_KEY;
const h = { 'apikey': SK, 'Authorization': `Bearer ${SK}`, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' };

let fixed = 0;
while (true) {
  const r = await fetch(`${SB}/rest/v1/jobs?select=id,apply_url&apply_url=like.https://api.smartrecruiters.com*&limit=100&offset=0`, { headers: h });
  const rows = await r.json();
  if (!rows.length) break;

  for (const row of rows) {
    const m = row.apply_url.match(/\/companies\/([^/]+)\/postings\/(.+)/);
    if (!m) continue;
    const newUrl = `https://jobs.smartrecruiters.com/${m[1]}/${m[2]}`;
    await fetch(`${SB}/rest/v1/jobs?id=eq.${row.id}`, {
      method: 'PATCH', headers: h, body: JSON.stringify({ apply_url: newUrl })
    });
    fixed++;
  }
  console.log(`${fixed} fixed...`);
}
console.log(`Done! Total fixed: ${fixed}`);
