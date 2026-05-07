import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY);

async function main() {
  const { data } = await supabase.from('jobs').select('company');
  const companies = [...new Set(data.map(d => d.company).filter(Boolean))];
  console.log(`Unique companies: ${companies.length}`);
}
main();
