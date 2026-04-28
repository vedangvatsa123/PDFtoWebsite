import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const POSTHOG_API_KEY = process.env.POSTHOG_PERSONAL_API_KEY;
const PROJECT_ID = process.env.POSTHOG_PROJECT_ID;
const HOST = 'https://us.i.posthog.com';

async function fetchInsights() {
  console.log('Fetching PostHog events...');
  
  // Fetch top events in the last 7 days
  const response = await fetch(`${HOST}/api/projects/${PROJECT_ID}/events/?limit=1000`, {
    headers: {
      'Authorization': `Bearer ${POSTHOG_API_KEY}`
    }
  });

  if (!response.ok) {
    console.error('Failed to fetch events:', await response.text());
    return;
  }

  const data = await response.json();
  const events = data.results || [];
  
  const eventCounts = {};
  const paths = {};

  events.forEach(e => {
    eventCounts[e.event] = (eventCounts[e.event] || 0) + 1;
    
    if (e.event === '$pageview') {
      const path = e.properties.$pathname;
      if (path) {
        paths[path] = (paths[path] || 0) + 1;
      }
    }
  });

  console.log('\n--- EVENT COUNTS (Last 1000 events) ---');
  Object.entries(eventCounts).sort((a, b) => b[1] - a[1]).forEach(([e, c]) => {
    console.log(`${e}: ${c}`);
  });

  console.log('\n--- TOP PAGEVIEWS ---');
  Object.entries(paths).sort((a, b) => b[1] - a[1]).slice(0, 10).forEach(([p, c]) => {
    console.log(`${p}: ${c}`);
  });
}

fetchInsights();
