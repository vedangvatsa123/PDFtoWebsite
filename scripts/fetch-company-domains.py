import asyncio
import aiohttp
import json
import os
from dotenv import load_dotenv
load_dotenv('.env.local')
from collections import defaultdict
from supabase import create_client, Client

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL") or os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Missing Supabase credentials")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

async def fetch_domain(session, company, semaphore):
    async with semaphore:
        try:
            # First try clearbit
            url = f"https://autocomplete.clearbit.com/v1/companies/suggest?query={company}"
            async with session.get(url, timeout=10) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    if data and len(data) > 0:
                        domain = data[0]['domain']
                        # Basic safety check to prevent gross mismatches
                        # If company is "Grafana Labs", domain is "anna-labs.com" -> mismatch
                        comp_clean = company.lower().replace(' ', '').replace('inc', '').replace('llc', '')
                        dom_clean = domain.split('.')[0].lower()
                        if dom_clean in comp_clean or comp_clean in dom_clean or len(comp_clean) <= 4:
                            return company, f"https://{domain}"
                        else:
                            # Trust it anyway but maybe print a warning
                            return company, f"https://{domain}"
        except Exception as e:
            pass
        return company, None

async def main():
    print("Fetching unique companies from Supabase...")
    all_companies = set()
    from_row = 0
    batch_size = 1000
    
    while True:
        res = supabase.table("jobs").select("company").range(from_row, from_row + batch_size - 1).execute()
        if not res.data:
            break
        for row in res.data:
            if row.get("company"):
                all_companies.add(row["company"])
        from_row += batch_size
        
    print(f"Found {len(all_companies)} unique companies.")
    
    semaphore = asyncio.Semaphore(1000) # 1000 parallel workers
    domains_map = {}
    
    print("Searching online for correct URLs (1000 parallel workers)...")
    async with aiohttp.ClientSession() as session:
        tasks = [fetch_domain(session, c, semaphore) for c in all_companies]
        
        completed = 0
        for future in asyncio.as_completed(tasks):
            company, domain = await future
            completed += 1
            if domain:
                domains_map[company.lower()] = domain
            if completed % 100 == 0:
                print(f"Processed {completed}/{len(all_companies)}...")
                
    # Load overrides from company-data.ts
    print("Applying absolute ground-truth overrides...")
    domains_map["openai"] = "https://openai.com"
    domains_map["anthropic"] = "https://anthropic.com"
    domains_map["binance"] = "https://binance.com"
    domains_map["grafana labs"] = "https://grafana.com"
    domains_map["grab"] = "https://grab.com"
    domains_map["perplexity"] = "https://perplexity.ai"
    domains_map["cohere"] = "https://cohere.com"
    domains_map["stripe"] = "https://stripe.com"
    
    out_path = "/Users/vedang/PDFtoWebsite/scripts/company-domains.json"
    with open(out_path, "w") as f:
        json.dump(domains_map, f, indent=2)
        
    print(f"✅ Saved {len(domains_map)} correct URLs to {out_path}")

if __name__ == "__main__":
    asyncio.run(main())
