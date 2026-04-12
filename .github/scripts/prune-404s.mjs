import dotenv from 'dotenv';
import pLimit from 'p-limit'; // I need to check if I can use this or just a manual batch

dotenv.config({ path: '.env.local' });
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_KEY');
  process.exit(1);
}

async function getAllJobs() {
  console.log('📥 Fetching all job URLs from database...');
  let allJobs = [];
  let offset = 0;
  const pageSize = 1000;
  
  while (true) {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/jobs?select=id,apply_url&offset=${offset}&limit=${pageSize}`,
      { headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` } }
    );
    if (!res.ok) break;
    const batch = await res.json();
    if (batch.length === 0) break;
    allJobs = allJobs.concat(batch);
    offset += pageSize;
    console.log(`   Fetched ${allJobs.length} so far...`);
    if (offset > 30000) break; // Safety
  }
  return allJobs;
}

async function isAlive(url) {
  try {
    const res = await fetch(url, {
      method: 'HEAD',
      headers: { 'User-Agent': 'Mozilla/5.0 (CVin.Bio mass-checker/1.0)' },
      signal: AbortSignal.timeout(10000), // 10s timeout
    });
    // Death criteria: 404 precisely. 
    // We ignore 403/401/500 as they might be temporary bot blocks or transient issues.
    return res.status !== 404;
  } catch (e) {
    // If it timed out or network failed, we keep it to be safe.
    return true; 
  }
}

async function getJobsToCheck(limit = 500) {
  // Pick random jobs or oldest ones to check
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/jobs?select=id,apply_url&limit=${limit}&order=synced_at.asc`,
    { headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` } }
  );
  if (!res.ok) return [];
  return res.json();
}

async function prune() {
  const isMassScan = process.env.MASS_SCAN === 'true';
  const allJobs = isMassScan ? await getAllJobs() : await getJobsToCheck(500);
  
  if (isMassScan) {
    console.log(`🚀 Starting MASS SCAN of ${allJobs.length} jobs with high concurrency...`);
  } else {
    console.log(`🔍 Standard check: ${allJobs.length} jobs...`);
  }

  const concurrency = 200; // Aggressive but stable
  const deadIds = [];
  let checked = 0;

  // Process in groups to avoid memory overflow
  for (let i = 0; i < allJobs.length; i += concurrency) {
    const batch = allJobs.slice(i, i + concurrency);
    await Promise.all(batch.map(async (job) => {
      const alive = await isAlive(job.apply_url);
      if (!alive) {
        deadIds.push(job.id);
        console.log(`❌ Dead [${deadIds.length}]: ${job.apply_url}`);
      }
      checked++;
      if (checked % 500 === 0) console.log(`   Progress: ${checked}/${allJobs.length} checked...`);
    }));
  }

  console.log(`\n✅ Scan complete. Found ${deadIds.length} dead links.`);

  if (deadIds.length > 0) {
    console.log(`🗑️ Pruning ${deadIds.length} dead jobs from Supabase...`);
    // Delete in batches of 200 to avoid long URLs
    for (let i = 0; i < deadIds.length; i += 200) {
      const subBatch = deadIds.slice(i, i + 200);
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/jobs?id=in.(${subBatch.join(',')})`,
        {
          method: 'DELETE',
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
          },
        }
      );
      console.log(`   Batch ${Math.floor(i/200)+1} pruned: ${res.ok ? 'OK' : 'FAILED'}`);
    }
  }
  
  console.log('✨ Mass pruning finished.');
}

prune().catch(console.error);
