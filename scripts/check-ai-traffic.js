const POSTHOG_PROJECT_ID = '356601';
const POSTHOG_PERSONAL_API_KEY = 'phx_GjFLyRKKZDS0oaLMBRi7Xoxc6D4KdyjhrwmgumZWDc2Ok9T';

async function checkAISearch() {
  const query = `
    SELECT properties.$referrer, count()
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
    GROUP BY properties.$referrer
    ORDER BY count() DESC
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
  
  console.log('AI Search Engine Referrers:');
  console.table(data.results);
  
  if (!data.results || data.results.length === 0) {
    console.log('No traffic from AI search engines found yet.');
  } else {
    let total = 0;
    for (const row of data.results) total += row[1];
    console.log(`Total views from AI Search: ${total}`);
  }
}

checkAISearch();
