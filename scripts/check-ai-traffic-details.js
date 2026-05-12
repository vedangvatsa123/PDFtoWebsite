const POSTHOG_PROJECT_ID = '356601';
const POSTHOG_PERSONAL_API_KEY = '***REMOVED***';

async function checkAISearch() {
  const query = `
    SELECT timestamp, properties.$referrer, properties.$current_url
    FROM events
    WHERE event = '$pageview' AND properties.$referrer IS NOT NULL AND properties.$referrer != '' AND (
      properties.$referrer ILIKE '%perplexity%' OR
      properties.$referrer ILIKE '%chatgpt%' OR
      properties.$referrer ILIKE '%claude%' OR
      properties.$referrer ILIKE '%gemini%' OR
      properties.$referrer ILIKE '%poe.com%' OR
      properties.$referrer ILIKE '%phind%' OR
      properties.$referrer ILIKE '%you.com%' OR
      properties.$referrer ILIKE '%copilot%' OR
      properties.$referrer ILIKE '%exa.ai%'
    )
    ORDER BY timestamp DESC
  `;

  const res = await fetch(`https://us.i.posthog.com/api/projects/${POSTHOG_PROJECT_ID}/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${POSTHOG_PERSONAL_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      query: {
        kind: 'HogQLQuery',
        query: query
      }
    })
  });

  const data = await res.json();
  if (data.error) {
    console.error('API Error:', data.error);
    return;
  }
  
  console.log('AI Search Engine Hits:');
  console.table(data.results);
}

checkAISearch();
