import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function verifySlugs() {
  console.log('Fetching all companies...');
  const { data: allJobs } = await supabase.from('jobs').select('company');
  
  const companyNames = new Set();
  allJobs.forEach(j => {
    if (j.company && !j.company.includes('...')) {
      companyNames.add(j.company);
    }
  });

  const toSlug = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '').replace(/^-+/, '');
  
  const slugMap = new Map();
  for (const name of companyNames) {
    const slug = toSlug(name);
    if (!slugMap.has(slug)) {
      slugMap.set(slug, name);
    }
  }

  console.log(`Verifying ${slugMap.size} unique company slugs...`);
  
  let emptyCount = 0;
  let mismatchCount = 0;
  let successCount = 0;
  const errors = [];

  for (const [slug, originalName] of slugMap.entries()) {
    const decodedSearch = slug.replace(/-/g, ' ').toLowerCase();
    
    // Exact logic from [slug]/page.tsx
    const { data: jobs, error } = await supabase
      .from('jobs')
      .select('company')
      .ilike('company', `${decodedSearch}%`)
      .limit(1);

    if (error) {
      errors.push(`Error on slug ${slug}: ${error.message}`);
      continue;
    }

    if (!jobs || jobs.length === 0) {
      emptyCount++;
      errors.push(`EMPTY PAGE: Slug /${slug} (Original: ${originalName}) returned 0 jobs.`);
    } else {
      const returnedCompany = jobs[0].company;
      // It's a mismatch if the returned company doesn't match the intended original name
      // (accounting for case sensitivity or minor punctuation differences)
      if (toSlug(returnedCompany) !== slug && !returnedCompany.toLowerCase().startsWith(originalName.toLowerCase().substring(0, 5))) {
         mismatchCount++;
         errors.push(`MISMATCH: Slug /${slug} (Original: ${originalName}) actually returned jobs for: ${returnedCompany}`);
      } else {
         successCount++;
      }
    }
  }

  console.log('\n--- VERIFICATION RESULTS ---');
  console.log(`Total Slugs Checked: ${slugMap.size}`);
  console.log(`✅ Successful Pages: ${successCount}`);
  console.log(`❌ Empty Pages: ${emptyCount}`);
  console.log(`⚠️ Mismatched Content: ${mismatchCount}`);
  
  if (errors.length > 0) {
    console.log('\n--- ISSUES FOUND ---');
    errors.slice(0, 20).forEach(e => console.log(e));
    if (errors.length > 20) console.log(`...and ${errors.length - 20} more issues.`);
  } else {
    console.log('\nAll company URLs perfectly route to the correct content!');
  }
}

verifySlugs();
