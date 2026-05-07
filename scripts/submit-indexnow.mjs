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
  console.log('Fetching live sitemap to get canonical URLs...');
  
  const sitemapRes = await fetch(`https://${SITE_HOST}/sitemap.xml`);
  if (!sitemapRes.ok) {
    console.error('Failed to fetch sitemap');
    return;
  }
  
  const xml = await sitemapRes.text();
  const matches = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)];
  const urls = matches.map(m => m[1]).filter(url => !url.includes('sitemap.xml'));

  console.log(`Found ${urls.length} total URLs in sitemap. Submitting to IndexNow...`);

  // IndexNow limits to 10k per request, we are well under it
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
