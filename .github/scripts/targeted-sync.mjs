import dotenv from 'dotenv';
import crypto from 'crypto';
dotenv.config({ path: '.env.local' });
const SB = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SK = process.env.SUPABASE_SERVICE_ROLE_KEY;
const dh = (c, t) => crypto.createHash('md5').update((c + '|' + t).toLowerCase().replace(/[^a-z0-9|]/g, '')).digest('hex');
const et = t => { const l = t.toLowerCase(), tags = []; for (const k of ['react','python','node','typescript','javascript','golang','rust','java','aws','kubernetes','docker','sql']) if (l.includes(k)) tags.push(k); return tags; };

const jobs = [];

// GovTech + Motional (Greenhouse)
for (const s of ['govtech', 'motional']) {
  const r = await fetch('https://boards-api.greenhouse.io/v1/boards/' + s + '/jobs');
  if (r.ok) {
    const d = await r.json();
    for (const j of (d.jobs || [])) {
      jobs.push({ source: 'greenhouse', external_id: 'gh_' + j.id, dedup_hash: dh(s === 'govtech' ? 'GovTech Singapore' : 'Motional', j.title), title: j.title, company: s === 'govtech' ? 'GovTech Singapore' : 'Motional', company_logo: null, location: j.location?.name || 'Remote', job_type: null, salary: null, description: null, tags: et(j.title), apply_url: j.absolute_url, category: j.departments?.[0]?.name || null, published_at: j.updated_at });
    }
    console.log('GH ' + s + ': ' + d.jobs?.length);
  }
}

// Coinhako (Ashby)
const ar = await fetch('https://api.ashbyhq.com/posting-api/job-board/coinhako');
if (ar.ok) {
  const d = await ar.json();
  for (const j of (d.jobs || [])) {
    jobs.push({ source: 'ashby', external_id: 'ashby_' + j.id, dedup_hash: dh(d.organizationName || 'Coinhako', j.title), title: j.title, company: d.organizationName || 'Coinhako', company_logo: null, location: j.location || 'Remote', job_type: j.employmentType || null, salary: null, description: null, tags: et(j.title), apply_url: 'https://jobs.ashbyhq.com/coinhako/' + j.id, category: j.department || null, published_at: j.publishedAt || null });
  }
  console.log('Ashby coinhako: ' + d.jobs?.length);
}

// ShopBack (Lever)
const lr = await fetch('https://api.lever.co/v0/postings/shopback-2?mode=json');
if (lr.ok) {
  const d = await lr.json();
  for (const j of d) {
    jobs.push({ source: 'lever', external_id: 'lever_' + j.id, dedup_hash: dh('ShopBack', j.text), title: j.text, company: 'ShopBack', company_logo: null, location: j.categories?.location || 'Remote', job_type: j.categories?.commitment || null, salary: null, description: null, tags: et(j.text), apply_url: j.hostedUrl, category: j.categories?.team || null, published_at: j.createdAt ? new Date(j.createdAt).toISOString() : null });
  }
  console.log('Lever shopback: ' + d.length);
}

console.log('Total: ' + jobs.length);

// Dedup within batch
const seen = new Map();
for (const j of jobs) { if (!seen.has(j.dedup_hash)) seen.set(j.dedup_hash, j); }
const unique = [...seen.values()];
console.log('Unique: ' + unique.length);

// Upsert in batches of 20
let ins = 0;
for (let i = 0; i < unique.length; i += 20) {
  const b = unique.slice(i, i + 20);
  const r = await fetch(`${SB}/rest/v1/jobs?on_conflict=dedup_hash`, {
    method: 'POST',
    headers: { 'apikey': SK, 'Authorization': `Bearer ${SK}`, 'Content-Type': 'application/json', 'Prefer': 'resolution=merge-duplicates,return=representation' },
    body: JSON.stringify(b),
  });
  if (r.ok) { const d = await r.json(); ins += d.length; }
  else { const t = await r.text(); console.log('ERR:', t.substring(0, 200)); }
}
console.log('Upserted: ' + ins);

const cr = await fetch(`${SB}/rest/v1/jobs?select=id`, { method: 'HEAD', headers: { 'apikey': SK, 'Authorization': `Bearer ${SK}`, 'Prefer': 'count=exact' } });
console.log('DB total: ' + cr.headers.get('content-range'));
