import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function check() {
  const { data, error } = await supabase
    .from('jobs')
    .select('company')
    .ilike('company', 'visa%')
    .limit(5);
  
  console.log("Visa search:", data);
  
  const { data: allJobs } = await supabase.from('jobs').select('company');
  const companies = new Set(allJobs.map(j => j.company));
  
  const sample = Array.from(companies).filter(c => c && !c.includes('...')).slice(0, 10);
  console.log("\nSample Companies:");
  for (const c of sample) {
    const slug = c.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '').replace(/^-+/, '');
    console.log(`- Company: "${c}" -> Slug: /${slug}`);
  }
}
check();
