// Detect which ATS each AI company uses
// Run: node scripts/find-ai-ats.mjs

const AI_COMPANIES = [
  // AI Labs & Foundation Model Companies
  { name: 'OpenAI', slugs: ['openai'] },
  { name: 'Anthropic', slugs: ['anthropic'] },
  { name: 'Google DeepMind', slugs: ['deepmind','googledeepmind'] },
  { name: 'xAI', slugs: ['xai','x-ai'] },
  { name: 'Mistral', slugs: ['mistralai','mistral'] },
  { name: 'Cohere', slugs: ['cohere','cohereai'] },
  { name: 'Inflection AI', slugs: ['inflectionai','inflection'] },
  { name: 'AI21 Labs', slugs: ['ai21','ai21labs'] },
  { name: 'Aleph Alpha', slugs: ['alephalpha'] },
  { name: 'Adept', slugs: ['adept','adeptai'] },
  { name: 'Character AI', slugs: ['character','characterai'] },
  { name: 'Perplexity', slugs: ['perplexity','perplexityai'] },
  { name: 'Together AI', slugs: ['togetherai','together','together-ai'] },
  { name: 'Reka AI', slugs: ['reka','rekaai','reka-ai'] },
  { name: 'Zhipu AI', slugs: ['zhipuai','zhipu'] },
  
  // AI Infrastructure & MLOps
  { name: 'Databricks', slugs: ['databricks'] },
  { name: 'Scale AI', slugs: ['scaleai','scale'] },
  { name: 'Weights & Biases', slugs: ['wandb','weightsandbiases','weights-and-biases'] },
  { name: 'Labelbox', slugs: ['labelbox'] },
  { name: 'Snorkel AI', slugs: ['snorkelai','snorkel'] },
  { name: 'Tecton', slugs: ['tecton'] },
  { name: 'Modal', slugs: ['modal','modal-labs'] },
  { name: 'Anyscale', slugs: ['anyscale'] },
  { name: 'Baseten', slugs: ['baseten'] },
  { name: 'Replicate', slugs: ['replicate'] },
  { name: 'Pinecone', slugs: ['pinecone'] },
  { name: 'Weaviate', slugs: ['weaviate'] },
  { name: 'Qdrant', slugs: ['qdrant'] },
  { name: 'Chroma', slugs: ['chroma','chromaai'] },
  { name: 'LangChain', slugs: ['langchain'] },
  { name: 'Unstructured', slugs: ['unstructured','unstructured-io'] },
  { name: 'Vectara', slugs: ['vectara'] },
  { name: 'Dagger', slugs: ['dagger','daggerai'] },
  { name: 'BentoML', slugs: ['bentoml'] },
  { name: 'Lightning AI', slugs: ['lightning','lightning-ai','lightningai'] },
  { name: 'Mosaicml', slugs: ['mosaicml'] },
  { name: 'Cleanlab', slugs: ['cleanlab'] },
  
  // AI Chips & Hardware
  { name: 'NVIDIA', slugs: ['nvidia'] },
  { name: 'Groq', slugs: ['groq','groqinc'] },
  { name: 'Cerebras', slugs: ['cerebras','cerebrassystems'] },
  { name: 'SambaNova', slugs: ['sambanova','sambanovasystems'] },
  { name: 'Tenstorrent', slugs: ['tenstorrent'] },
  { name: 'Graphcore', slugs: ['graphcore'] },
  { name: 'D-Matrix', slugs: ['dmatrix','d-matrix'] },
  { name: 'Rain AI', slugs: ['rain','rainai','rain-ai'] },
  { name: 'CoreWeave', slugs: ['coreweave'] },
  { name: 'Lambda', slugs: ['lambda','lambdalabs'] },
  
  // Generative AI Applications
  { name: 'Stability AI', slugs: ['stabilityai','stability'] },
  { name: 'Midjourney', slugs: ['midjourney'] },
  { name: 'Runway', slugs: ['runwayml','runway'] },
  { name: 'Jasper', slugs: ['jasper','jasperai'] },
  { name: 'Writer', slugs: ['writer','writerai'] },
  { name: 'Copy.ai', slugs: ['copyai','copy-ai'] },
  { name: 'Synthesia', slugs: ['synthesia'] },
  { name: 'Descript', slugs: ['descript'] },
  { name: 'ElevenLabs', slugs: ['elevenlabs'] },
  { name: 'HeyGen', slugs: ['heygen'] },
  { name: 'Luma AI', slugs: ['lumaai','luma'] },
  { name: 'Pika', slugs: ['pika','pikalabs'] },
  { name: 'Ideogram', slugs: ['ideogram'] },
  { name: 'Suno', slugs: ['suno','sunoai'] },
  { name: 'Udio', slugs: ['udio'] },
  
  // AI-Powered Products
  { name: 'Cursor', slugs: ['cursor','anysphere'] },
  { name: 'Replit', slugs: ['replit'] },
  { name: 'Grammarly', slugs: ['grammarly','grammarlyinc'] },
  { name: 'Notion', slugs: ['notion','notionhq'] },
  { name: 'Canva', slugs: ['canva'] },
  { name: 'Figma', slugs: ['figma'] },
  { name: 'Vercel', slugs: ['vercel'] },
  { name: 'Hugging Face', slugs: ['huggingface','hugging-face'] },
  { name: 'Glean', slugs: ['glean'] },
  { name: 'Harvey', slugs: ['harvey','harveyai'] },
  { name: 'Codeium', slugs: ['codeium'] },
  { name: 'Tabnine', slugs: ['tabnine'] },
  { name: 'Sourcegraph', slugs: ['sourcegraph'] },
  { name: 'Warp', slugs: ['warp'] },
  { name: 'Raycast', slugs: ['raycast'] },
  { name: 'Linear', slugs: ['linear'] },
  { name: 'Tome', slugs: ['tome','tomeai'] },
  
  // AI for Enterprise
  { name: 'Datadog', slugs: ['datadog'] },
  { name: 'Palantir', slugs: ['palantir'] },
  { name: 'C3.ai', slugs: ['c3iot','c3ai'] },
  { name: 'DataRobot', slugs: ['datarobot'] },
  { name: 'H2O.ai', slugs: ['h2oai','h2o'] },
  { name: 'Moveworks', slugs: ['moveworks'] },
  { name: 'Observe AI', slugs: ['observeai','observe'] },
  { name: 'Gong', slugs: ['gong','gongai'] },
  { name: 'Clari', slugs: ['clari'] },
  { name: 'People.ai', slugs: ['peopleai'] },
  { name: 'Cresta', slugs: ['cresta'] },
  { name: 'Abnormal Security', slugs: ['abnormalsecurity'] },
  { name: 'Vectra AI', slugs: ['vectra','vectraai'] },
  
  // Autonomous & Robotics
  { name: 'Waymo', slugs: ['waymo'] },
  { name: 'Cruise', slugs: ['cruise','getcruise'] },
  { name: 'Aurora', slugs: ['aurora','auroratech'] },
  { name: 'Nuro', slugs: ['nuro'] },
  { name: 'Zoox', slugs: ['zoox'] },
  { name: 'Figure', slugs: ['figure','figureai'] },
  { name: 'Apptronik', slugs: ['apptronik'] },
  { name: 'Boston Dynamics', slugs: ['bostondynamics','boston-dynamics'] },
  { name: 'Covariant', slugs: ['covariant'] },
  { name: 'Physical Intelligence', slugs: ['physicalintelligence','physical-intelligence'] },
  { name: 'Shield AI', slugs: ['shieldai','shield-ai'] },
  { name: 'Anduril', slugs: ['anduril'] },
  { name: 'Skydio', slugs: ['skydio'] },
  { name: 'Sanctuary AI', slugs: ['sanctuary','sanctuary-ai','sanctuaryai'] },
  
  // AI in Healthcare/Bio
  { name: 'Tempus', slugs: ['tempus'] },
  { name: 'Insitro', slugs: ['insitro'] },
  { name: 'Recursion', slugs: ['recursion','recursionpharma'] },
  { name: 'PathAI', slugs: ['pathai'] },
  { name: 'Viz.ai', slugs: ['vizai','viz'] },
  
  // European Tech & Global Unicorns (High chance for Personio/Breezy)
  { name: 'Spotify', slugs: ['spotify'] },
  { name: 'Klarna', slugs: ['klarna'] },
  { name: 'N26', slugs: ['n26'] },
  { name: 'Revolut', slugs: ['revolut'] },
  { name: 'Monzo', slugs: ['monzo'] },
  { name: 'Delivery Hero', slugs: ['deliveryhero'] },
  { name: 'Tier Mobility', slugs: ['tier','tiermobility'] },
  { name: 'Vinted', slugs: ['vinted'] },
  { name: 'Contentful', slugs: ['contentful'] },
  { name: 'Algolia', slugs: ['algolia'] },
  { name: 'Stripe', slugs: ['stripe'] },
  { name: 'Brex', slugs: ['brex'] },
  { name: 'Ramp', slugs: ['ramp'] },
  { name: 'Deel', slugs: ['deel'] },
  { name: 'Gusto', slugs: ['gusto'] },
  { name: 'Rippling', slugs: ['rippling'] },
  { name: 'Framer', slugs: ['framer'] },
  { name: 'Webflow', slugs: ['webflow'] },
  { name: 'Magic.dev', slugs: ['magic','magicdev','magic-dev'] },
  { name: 'Imbue', slugs: ['imbue'] },
  { name: 'Essential AI', slugs: ['essential','essentialai'] },
  { name: 'Plaid', slugs: ['plaid'] },
  { name: 'Celonis', slugs: ['celonis'] },
  { name: 'HelloFresh', slugs: ['hellofresh'] },
];

async function checkATS(slug, ats) {
  let url;
  if (ats === 'greenhouse') url = `https://boards-api.greenhouse.io/v1/boards/${slug}/jobs`;
  else if (ats === 'ashby') url = `https://api.ashbyhq.com/posting-api/job-board/${slug}`;
  else if (ats === 'lever') url = `https://api.lever.co/v0/postings/${slug}?mode=json`;
  else if (ats === 'bamboohr') url = `https://${slug}.bamboohr.com/jobs/embed2.json`;
  else if (ats === 'personio') url = `https://${slug}.jobs.personio.de/xml`;
  else if (ats === 'breezy') url = `https://${slug}.breezy.hr/json`;
  try {
    const r = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(5000) });
    if (r.status === 200) {
      const text = await r.text();
      // Check it actually has content
      if (text.length > 10) return true;
    }
    return false;
  } catch { return false; }
}

async function run() {
  const results = { greenhouse: [], ashby: [], lever: [], bamboohr: [], personio: [], breezy: [] };
  const allATS = ['greenhouse', 'ashby', 'lever', 'bamboohr', 'personio', 'breezy'];
  
  // We process companies sequentially to avoid spamming output, but parallelize their ATS checks
  for (const co of AI_COMPANIES) {
    const found = [];
    
    // For a company, check all its slugs across all ATS in parallel
    const promises = [];
    for (const slug of co.slugs) {
      for (const ats of allATS) {
        promises.push(
          checkATS(slug, ats).then(ok => {
            if (ok) return { ats, slug };
            return null;
          })
        );
      }
    }
    
    const atsResults = await Promise.all(promises);
    for (const res of atsResults) {
      if (res) {
        found.push(res);
        results[res.ats].push(res.slug);
      }
    }
    
    if (found.length > 0) {
      console.log(`✅ ${co.name}: ${found.map(f => f.ats + ':' + f.slug).join(', ')}`);
    } else {
      console.log(`❌ ${co.name}: not found`);
    }
  }
  
  console.log('\n\n=== SLUGS TO ADD ===');
  console.log('GREENHOUSE:', JSON.stringify(results.greenhouse));
  console.log('ASHBY:', JSON.stringify(results.ashby));
  console.log('LEVER:', JSON.stringify(results.lever));
  console.log('BAMBOOHR:', JSON.stringify(results.bamboohr));
  console.log('PERSONIO:', JSON.stringify(results.personio));
  console.log('BREEZY:', JSON.stringify(results.breezy));
}

run();
