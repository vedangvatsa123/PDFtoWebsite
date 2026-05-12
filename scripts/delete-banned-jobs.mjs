import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import pkg from './banned-jobs.js';
const { BANNED_PATTERNS } = pkg;

dotenv.config({ path: '.env.local' });
dotenv.config();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

if (!url || !key) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(url, key);
const bannedRegex = new RegExp(BANNED_PATTERNS.join('|'), 'i');

async function main() {
  console.log('Fetching all job IDs and titles to evaluate...');
  let allJobs = [];
  let from = 0;
  const batchSize = 1000;
  
  while (true) {
    const { data, error } = await supabase
      .from('jobs')
      .select('id, title')
      .range(from, from + batchSize - 1);
      
    if (error) {
      console.error(error);
      break;
    }
    if (!data || data.length === 0) break;
    
    allJobs = allJobs.concat(data);
    from += batchSize;
    process.stdout.write(`\rFetched ${allJobs.length} jobs...`);
  }
  
  console.log(`\nEvaluating ${allJobs.length} jobs against banned regex...`);
  
  const toDelete = allJobs.filter(j => bannedRegex.test(j.title)).map(j => j.id);
  console.log(`Found ${toDelete.length} jobs to delete.`);
  
  if (toDelete.length === 0) {
    console.log('Nothing to delete.');
    process.exit(0);
  }
  
  console.log('Deleting in batches...');
  let deletedCount = 0;
  for (let i = 0; i < toDelete.length; i += 200) {
    const batch = toDelete.slice(i, i + 200);
    const { error } = await supabase.from('jobs').delete().in('id', batch);
    if (error) {
      console.error(`Error deleting batch ${i}:`, error);
    } else {
      deletedCount += batch.length;
      process.stdout.write(`\rDeleted ${deletedCount}/${toDelete.length}...`);
    }
  }
  
  console.log('\n✅ Successfully purged banned jobs from database.');
}

main();
