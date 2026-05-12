// One-time script to purge non-tech/non-business jobs from Supabase
// Run: node scripts/purge-junk-jobs.mjs

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

const BANNED_PATTERNS = [
  '\\btherapists?\\b', '\\bpsychiatric\\b', '\\bpsychiatrist\\b', '\\bnurse\\b',
  '\\bphysician\\b', '\\bmedical assistant\\b', '\\bphlebotomist\\b',
  '\\bbehavior technician\\b', '\\brbt\\b', '\\bretail ambassador\\b',
  '\\bbarista\\b', '\\bjanitor\\b', '\\bcashier\\b', '\\bhvac\\b',
  '\\bplumbing\\b', '\\bplumber\\b', '\\bwarehouse\\b',
  '\\bdelivery driver\\b', '\\btruck driver\\b', '\\bteacher\\b', '\\btutor\\b',
  '\\bcaregiver\\b', '\\bnanny\\b', '\\bhousekeeper\\b', '\\bcleaner\\b',
  '\\bdentist\\b', '\\bdental\\b', '\\bpharmacist\\b', '\\bpharmacy\\b',
  '\\bparamedic\\b', '\\bsurgeon\\b', '\\bclinician\\b', '\\boptometrist\\b',
  '\\bveterinarian\\b', '\\bveterinary\\b', '\\bmassage\\b', '\\besthetician\\b',
  '\\bsalon\\b', '\\bspa\\b', '\\bpastor\\b', '\\bclergy\\b',
  '\\bmechanic\\b', '\\bforklift\\b', '\\bbartender\\b',
  '\\bwaiter\\b', '\\bwaitress\\b', '\\bchef\\b', '\\bcook\\b', '\\bdishwasher\\b',
  '\\bbusser\\b', '\\bhostess\\b', '\\bcounselor\\b', '\\bpainter\\b',
  '\\bcarpenter\\b', '\\belectrician\\b', '\\bwelder\\b', '\\bmason\\b',
  '\\bconstruction\\b', '\\bsecurity guard\\b', '\\bbouncer\\b',
  '\\bretail\\b', '\\bdispensary\\b',
  '\\bmanufacturing\\b', '\\bassembl\\w*\\b', '\\bfactory\\b',
  '\\btechnician\\b', '\\bforeman\\b', '\\bjourneyman\\b',
  '\\banimal\\b', '\\bhusbandry\\b', '\\binfusion\\b', '\\bmicrobiology\\b',
  '\\bfield service\\b', '\\binstaller\\b', '\\bfabricator\\b', '\\bmaintenance\\b',
  '\\broofing\\b', '\\bpaving\\b', '\\bexcavat\\b', '\\blandscap\\b',
  '\\bpipefitter\\b', '\\bironworker\\b', '\\bscaffold\\b',
  '\\bconcrete\\b', '\\bdrywall\\b', '\\binsulation\\b',
  '\\bsales rep\\b', '\\bsales associate\\b',
  '\\bRN\\b', '\\bLPN\\b', '\\bCNA\\b', '\\bEMT\\b',
  '\\bcustodian\\b', '\\bgroundskeeper\\b',
  '\\bproduction\\b', '\\boperator\\b', '\\bpilot\\b', '\\bsurvey\\b',
  '\\bsupply chain\\b', '\\bgrounds\\b', '\\bline tech\\b',
  '\\bcurb\\b', '\\bpowerline\\b', '\\bice cream\\b',
  '\\bhelicopter\\b', '\\bautocad\\b',
  '\\boriginations?\\b', '\\bmetal\\b', '\\bprep\\b',
  '\\btelemedicine\\b',
  '\\bdriver\\b', '\\bdelivery\\b', '\\bdispatcher\\b',
  '\\binventory\\b', '\\breceiving\\b', '\\bfulfillment\\b',
];
const BANNED_REGEX = new RegExp(BANNED_PATTERNS.join('|'), 'i');

async function purgeJunkJobs() {
  console.log('Fetching all jobs from DB to check titles...');
  
  let offset = 0;
  const pageSize = 1000;
  let totalJunk = 0;
  let totalScanned = 0;
  const junkIds = [];

  while (true) {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/jobs?select=id,title&offset=${offset}&limit=${pageSize}`,
      { headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` } }
    );
    if (!res.ok) { console.error('Fetch failed:', await res.text()); break; }
    const rows = await res.json();
    if (rows.length === 0) break;

    for (const row of rows) {
      totalScanned++;
      if (row.title && BANNED_REGEX.test(row.title)) {
        junkIds.push(row.id);
        totalJunk++;
      }
    }
    offset += pageSize;
    process.stdout.write(`\r  Scanned ${totalScanned} jobs, found ${totalJunk} junk...`);
  }

  console.log(`\n\nFound ${totalJunk} junk jobs out of ${totalScanned} total.`);
  
  if (junkIds.length === 0) {
    console.log('Nothing to purge!');
    return;
  }

  // Delete in batches of 100
  let deleted = 0;
  for (let i = 0; i < junkIds.length; i += 100) {
    const batch = junkIds.slice(i, i + 100);
    const idFilter = batch.map(id => `"${id}"`).join(',');
    
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/jobs?id=in.(${idFilter})`,
      {
        method: 'DELETE',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Prefer': 'return=minimal',
        },
      }
    );
    
    if (res.ok) {
      deleted += batch.length;
      console.log(`  Deleted batch ${Math.floor(i / 100) + 1} (${deleted}/${totalJunk})`);
    } else {
      console.error(`  Batch delete failed:`, await res.text());
    }
  }

  console.log(`\n✅ Purged ${deleted} junk jobs from the database.`);
}

purgeJunkJobs().catch(console.error);
