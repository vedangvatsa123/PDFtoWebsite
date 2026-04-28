import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const INDEXNOW_KEY = '6db32ca940dd46cab89375c221953bd6';
const SITE_HOST = 'cvin.bio';

async function submit() {
  console.log('Fetching ALL companies...');
  const allJobs = [];
  let page = 0;
  while (true) {
    const { data } = await supabase
      .from('jobs')
      .select('company')
      .range(page * 1000, (page + 1) * 1000 - 1);
    if (!data || data.length === 0) break;
    allJobs.push(...data);
    if (data.length < 1000) break;
    page++;
  }
  
  const companyNames = new Set();
  allJobs.forEach(j => {
    if (j.company && !j.company.includes('...')) companyNames.add(j.company);
  });

  const toSlug = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '').replace(/^-+/, '');
  const seenSlugs = new Set();
  
  const urls = [];
  
  companyNames.forEach(name => {
    const slug = toSlug(name);
    if (!seenSlugs.has(slug)) {
      seenSlugs.add(slug);
      urls.push(`https://${SITE_HOST}/${slug}`);
    }
  });

  console.log(`Found ${urls.length} total company URLs. Submitting to IndexNow...`);

  const payload = {
    host: SITE_HOST,
    key: INDEXNOW_KEY,
    keyLocation: `https://${SITE_HOST}/${INDEXNOW_KEY}.txt`,
    urlList: urls
  };

  const res = await fetch('https://api.indexnow.org/IndexNow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(payload)
  });

  if (res.ok) {
    console.log(`✅ IndexNow successfully received ${urls.length} URLs (HTTP ${res.status})`);
  } else {
    console.error(`❌ IndexNow failed: HTTP ${res.status}`);
  }
}

submit();
