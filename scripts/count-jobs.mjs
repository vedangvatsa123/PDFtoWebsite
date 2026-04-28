const SUPABASE_URL = 'https://mkrwlyjjlngzozekkmec.supabase.co';
const SUPABASE_KEY = '***REMOVED***';

async function getCount() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/jobs?select=id&limit=1`, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Prefer': 'count=exact'
    }
  });
  const count = res.headers.get('content-range');
  console.log('Count:', count);
}
getCount();
