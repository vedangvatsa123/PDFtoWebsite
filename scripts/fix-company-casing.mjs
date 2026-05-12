// Fix company name casing in Supabase DB
// Updates lowercase company names to properly cased versions

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

const BRAND_CASE = {
  'openai': 'OpenAI', 'deepmind': 'DeepMind', 'xai': 'xAI',
  'langchain': 'LangChain', 'deepgram': 'Deepgram', 'pinecone': 'Pinecone',
  'hugging face': 'Hugging Face', 'elevenlabs': 'ElevenLabs',
  'coreweave': 'CoreWeave', 'databricks': 'Databricks',
  'perplexity': 'Perplexity', 'grammarly': 'Grammarly',
  'anthropic': 'Anthropic', 'midjourney': 'Midjourney',
  'stability ai': 'Stability AI', 'together ai': 'Together AI',
  'cerebras': 'Cerebras', 'sambanova': 'SambaNova',
  'synthesia': 'Synthesia', 'descript': 'Descript',
  'scale ai': 'Scale AI', 'cognition': 'Cognition',
  'replit': 'Replit', 'cursor': 'Cursor',
  'nvidia': 'NVIDIA', 'google': 'Google', 'apple': 'Apple',
  'microsoft': 'Microsoft', 'amazon': 'Amazon', 'meta': 'Meta',
  'tesla': 'Tesla', 'waymo': 'Waymo',
  'skydio': 'Skydio', 'pika': 'Pika', 'suno': 'Suno', 'udio': 'Udio',
  'mistral': 'Mistral', 'cohere': 'Cohere', 'groq': 'Groq',
  'modal': 'Modal', 'baseten': 'Baseten', 'replicate': 'Replicate',
  'runway': 'Runway', 'heygen': 'HeyGen', 'ideogram': 'Ideogram',
  'livekit': 'LiveKit', 'moveworks': 'Moveworks', 'cresta': 'Cresta',
  'sierra': 'Sierra', 'poolside': 'Poolside', 'tavus': 'Tavus',
  'arize': 'Arize', 'snorkel': 'Snorkel AI', 'datarobot': 'DataRobot',
  'weaviate': 'Weaviate', 'vectara': 'Vectara',
  'graphcore': 'Graphcore', 'tenstorrent': 'Tenstorrent',
  'jasper': 'Jasper', 'c3 ai': 'C3 AI', 'lambda': 'Lambda',
  'figure': 'Figure', 'nuro': 'Nuro', 'cruise': 'Cruise',
  'shield ai': 'Shield AI', 'insitro': 'Insitro',
  'fireworks': 'Fireworks AI', 'anyscale': 'Anyscale',
  'inflection': 'Inflection', 'character': 'Character AI',
  'reka': 'Reka', 'aleph alpha': 'Aleph Alpha',
  'abnormal security': 'Abnormal Security', 'observe ai': 'Observe AI',
  'contextual ai': 'Contextual AI',
  // From telegram-post.mjs BRAND_CASE
  'deepl': 'DeepL', 'mongodb': 'MongoDB', 'webflow': 'Webflow',
  'clickup': 'ClickUp', 'linkedin': 'LinkedIn', 'github': 'GitHub',
  'gitlab': 'GitLab', 'bitgo': 'BitGo', 'coinbase': 'Coinbase',
  'okx': 'OKX', 'bybit': 'Bybit', 'sofi': 'SoFi', 'postman': 'Postman',
  'datadog': 'Datadog', 'snowflake': 'Snowflake', 'hashicorp': 'HashiCorp',
  'devrev': 'DevRev', 'airbnb': 'Airbnb', 'infobip': 'Infobip',
  'hubspot': 'HubSpot', 'shopify': 'Shopify', 'cloudflare': 'Cloudflare',
  'nerdwallet': 'NerdWallet', 'mckinsey': 'McKinsey',
  'taskrabbit': 'TaskRabbit', 'servicenow': 'ServiceNow',
  'airwallex': 'Airwallex', 'gopuff': 'Gopuff',
};

const DRY_RUN = process.argv.includes('--dry-run');

async function updateCompanyCasing() {
  let totalUpdated = 0;

  for (const [lowercase, proper] of Object.entries(BRAND_CASE)) {
    if (lowercase === proper.toLowerCase() && lowercase === proper) continue; // already correct

    // Find jobs with the lowercase version
    const params = new URLSearchParams({
      select: 'id,company',
      company: `eq.${lowercase}`,
      limit: '5000',
    });

    const res = await fetch(`${SUPABASE_URL}/rest/v1/jobs?${params}`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
      },
    });

    if (!res.ok) continue;
    const jobs = await res.json();

    if (jobs.length === 0) continue;

    console.log(`  ${lowercase} → ${proper} (${jobs.length} jobs)`);

    if (DRY_RUN) {
      totalUpdated += jobs.length;
      continue;
    }

    // Update in batches
    const updateRes = await fetch(
      `${SUPABASE_URL}/rest/v1/jobs?company=eq.${encodeURIComponent(lowercase)}`,
      {
        method: 'PATCH',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify({ company: proper }),
      }
    );

    if (updateRes.ok) {
      totalUpdated += jobs.length;
    } else {
      console.error(`  ❌ Failed to update ${lowercase}: ${await updateRes.text()}`);
    }

    // Small delay to avoid rate limits
    await new Promise(r => setTimeout(r, 100));
  }

  console.log(`\n✅ Updated ${totalUpdated} jobs total.`);
}

console.log(`🔧 Fix Company Casing in DB ${DRY_RUN ? '(DRY RUN)' : ''}`);
updateCompanyCasing().catch(e => {
  console.error('Failed:', e.message);
  process.exit(1);
});
