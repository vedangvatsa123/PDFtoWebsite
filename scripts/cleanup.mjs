

const SUPABASE_URL = 'https://mkrwlyjjlngzozekkmec.supabase.co';
const SUPABASE_KEY = '***REMOVED***';

async function main() {
  console.log('Deleting Impuls HRK jobs...');
  const res = await fetch(`${SUPABASE_URL}/rest/v1/jobs?company=eq.Impuls HRK`, {
    method: 'DELETE',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Prefer': 'return=representation'
    }
  });

  if (res.ok) {
    const data = await res.json();
    console.log(`Deleted ${data.length} jobs.`);
  } else {
    console.error('Failed to delete:', await res.text());
  }
}

main();
