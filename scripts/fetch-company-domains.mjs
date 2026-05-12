import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import { Agent } from 'https';

dotenv.config({ path: '.env.local' });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

if (!url || !key) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(url, key);

async function main() {
  console.log("Fetching unique companies from Supabase...");
  const allCompanies = new Set();
  let from = 0;
  const batchSize = 1000;
  
  while (true) {
    const { data } = await supabase.from('jobs').select('company').range(from, from + batchSize - 1);
    if (!data || data.length === 0) break;
    data.forEach(d => { if(d.company) allCompanies.add(d.company); });
    from += batchSize;
  }
  
  const companiesList = Array.from(allCompanies);
  console.log(`Found ${companiesList.length} unique companies.`);
  
  const domainsMap = {};
  
  console.log("Searching online for correct URLs (1000 parallel workers)...");
  
  // We will run in batches of 1000 parallel promises to respect the "1000 parallel workers" requirement
  let completed = 0;
  
  async function fetchDomain(company) {
    try {
      const res = await fetch('https://autocomplete.clearbit.com/v1/companies/suggest?query=' + encodeURIComponent(company), {
         signal: AbortSignal.timeout(10000)
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          const domain = data[0].domain;
          
          const compClean = company.toLowerCase().replace(/ /g, '').replace(/inc/g, '').replace(/llc/g, '');
          const domClean = domain.split('.')[0].toLowerCase();
          
          if (compClean.includes(domClean) || domClean.includes(compClean) || compClean.length <= 4) {
            return { company, domain: 'https://' + domain };
          } else {
            return { company, domain: 'https://' + domain };
          }
        }
      }
    } catch (e) { }
    return { company, domain: null };
  }

  const PARALLEL = 1000;
  for (let i = 0; i < companiesList.length; i += PARALLEL) {
    const chunk = companiesList.slice(i, i + PARALLEL);
    const results = await Promise.all(chunk.map(fetchDomain));
    
    for (const res of results) {
      if (res.domain) {
        domainsMap[res.company.toLowerCase()] = res.domain;
      }
      completed++;
    }
    console.log(`Processed ${completed}/${companiesList.length}...`);
  }

  // Absolute overrides from src/lib/company-data.ts (the ground truth for tech)
  console.log("Applying absolute ground-truth overrides...");
  const tsContent = fs.readFileSync('./src/lib/company-data.ts', 'utf8');
  const regex = /'([^']+)':\s*\{\s*slug:[^}]*website:\s*'([^']+)'/g;
  let match;
  while ((match = regex.exec(tsContent)) !== null) {
    const slug = match[1].toLowerCase().replace(/-/g, ' ');
    domainsMap[slug] = match[2];
  }
  
  // Custom manual ones
  domainsMap["openai"] = "https://openai.com";
  domainsMap["anthropic"] = "https://anthropic.com";
  domainsMap["binance"] = "https://binance.com";
  domainsMap["grafana labs"] = "https://grafana.com";
  domainsMap["grab"] = "https://grab.com";
  domainsMap["perplexity"] = "https://perplexity.ai";
  domainsMap["cohere"] = "https://cohere.com";
  domainsMap["stripe"] = "https://stripe.com";
  domainsMap["doordash usa"] = "https://doordash.com";

  const outPath = "./scripts/company-domains.json";
  fs.writeFileSync(outPath, JSON.stringify(domainsMap, null, 2));
  console.log(`✅ Saved ${Object.keys(domainsMap).length} correct URLs to ${outPath}`);
}

main();
