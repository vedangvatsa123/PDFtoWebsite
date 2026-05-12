// Massive Personio discovery — Round 3 (with redirect following)

const SLUGS = [
  // German Fintech
  'n26','n26-gmbh','n26bank','wefox','wefox-group','wefox-gmbh',
  'mambu','mambu-gmbh','raisin','raisin-gmbh','raisinds',
  'smava','smava-gmbh','billie','billie-gmbh','mondu','mondu-gmbh',
  'moonfare','moonfare-gmbh','liqid','liqid-gmbh',
  'clark','clark-germany','getsafe','getsafe-gmbh',
  'vivid','vivid-money','vividmoney','finom','finom-gmbh',
  'penta','penta-gmbh','banxware','banxware-gmbh',

  // German E-Commerce
  'zalando','zalando-se','hellofresh','hellofresh-se','hellofreshgroup',
  'deliveryhero','delivery-hero','auto1','auto1-group',
  'grover','grover-gmbh','grover-group',

  // German SaaS
  'commercetools','commercetools-gmbh','adjust','adjust-gmbh',
  'signavio','signavio-gmbh','omio','omio-gmbh',
  'sennder','sennder-gmbh','forto','forto-gmbh',
  'taxfix','taxfix-gmbh','comtravo','comtravo-gmbh',
  'zeotap','zeotap-gmbh','uberall','uberall-gmbh',
  'finleap','finleap-gmbh','heydata','heydata-gmbh',
  'lengoo','lengoo-gmbh','taktile','taktile-gmbh',
  'bryter','bryter-gmbh','localyze','localyze-gmbh',
  'caplena','caplena-ag',

  // German Mobility/Energy
  'flixmobility','flixbus','flix','tier','tier-se','tiermobility',
  'infarm','infarm-gmbh','gorillas','gorillas-technologies',
  'flink','flink-se','enpal','enpal-gmbh',
  '1komma5','1komma5grad','einride','einride-ab',
  'bolt','bolt-eu','bolt-technology',

  // German AI/Deep Tech
  'deepl','deepl-se','deepl-gmbh','helsing','helsing-gmbh',
  'aleph-alpha','alephalpha','photoroom','photoroom-sas',
  'ada-health','adahealth','blackforestlabs','black-forest-labs',
  'n8n','n8n-io','n8n-gmbh','sunfire','sunfire-gmbh',
  'isar-aerospace','isaraerospace','lilium','lilium-gmbh',
  'volocopter','volocopter-gmbh','quantpi','quantpi-gmbh',
  'konux','konux-gmbh','wandelbots','wandelbots-gmbh',

  // French Tech
  'doctolib','mirakl','mirakl-sas','dataiku','dataiku-sas',
  'contentsquare','shift-technology','shifttech',
  'payfit','payfit-sas','pennylane','pennylane-sas',
  'yousign','brevo','sendinblue','qonto','qonto-sas',
  'back-market','backmarket','sorare','sorare-sas',
  'ledger','ledger-sas','scaleway','algolia',
  'criteo','blablacar','deezer','dailymotion',
  'alma','alma-sas','lydia','talend','manomano','mano-mano',
  'ivalua','agicap','agicap-sas','meero',

  // UK Tech
  'snyk','onfido','tessian','darktrace','deliveroo',
  'revolut','monzo','starling','starlingbank',
  'checkout','checkoutcom','paddle',
  'gocardless','multiverse','depop','gousto',
  'improbable','speechmatics','featurespace','behavox',
  'what3words','gymshark',

  // Nordic
  'northvolt','northvolt-ab','wolt','wolt-oy',
  'aiven','aiven-io','relex','relex-solutions',
  'supermetrics','vainu','swappie','swappie-oy',
  'smartly','smartlyio','truecaller','sinch',
  'pleo','pleo-io','hedvig','anyfin','lunar',

  // Swiss/Austrian
  'scandit','scandit-ag','beekeeper','beekeeper-ag',
  'proton','proton-ag','on-running','on-ag',
  'bitpanda','bitpanda-gmbh','doodle','doodle-ag',
  'acronis','mostly-ai','mostlyai',

  // Dutch/Benelux
  'adyen','mollie','messagebird','sendcloud',
  'picnic','picnic-technologies','miro','studocu',
  'wetransfer','framer','framer-bv','bynder',
  'elastic','tomtom','remote','remote-com',

  // Web3/Crypto
  'nethermind','nethermind-io','aave','lido','lido-dao',
  'safe','safe-global','starkware','starknet',
  'bitstamp','swissborg','immutable','paradigm',
  'layerzero','eigenlabs','chainalysis','elliptic',
  'fireblocks','polygon','polygon-labs',
  'optimism','op-labs','oplabs','arbitrum','offchain-labs',
  'uniswap','uniswap-labs','dydx','makerdao','maker-dao',
  'compound','compound-labs','curve','curve-fi',
  'synthetix','balancer','1inch','zksync','matter-labs',
  'aztec','aztec-network','celestia','near','near-foundation',
  'aptos','aptos-labs','sui','mysten-labs','mystenlabs',

  // Israeli Tech
  'monday','monday-com','wiz','wiz-io',
  'fiverr','similarweb','rapyd','riskified','forter',
  'armis','orca-security','orcasecurity',

  // Gaming
  'innogames','innogames-gmbh','wooga','wooga-gmbh',
  'kolibri-games','kolibrigames','goodgame','goodgame-studios',
  'bigpoint','bigpoint-gmbh','gameforge','gameforge-ag',
  'king','supercell','rovio','paradox','paradox-interactive',
  'stillfront','embracer',

  // US Tech (EU offices)
  'stripe','datadog','cloudflare','figma','notion',
  'vercel','supabase','linear','posthog','retool',

  // More EU tech
  'catawiki','vinted','hybris','sap-signavio',
  'tibber','tibber-no','tado','tado-gmbh',
  'zenjob','zenjob-gmbh','personio-internal',
  'rasa','rasa-technologies','rasa-gmbh',
  'staffbase','staffbase-gmbh',
  'babbel','babbel-gmbh','lesson-nine','lessonnnine',
  'ecosia','ecosia-gmbh',
  'foodspring','foodspring-gmbh',
  'mymuesli','mymuesli-gmbh',
  'flaschenpost','flaschenpost-se',
  'kaufland-ecommerce','kaufland',
  'ottonova','ottonova-ag',
  'wunderflats','wunderflats-gmbh',
  'coya','coya-ag',
  'hometogo','hometogo-gmbh',
  'thermondo','thermondo-gmbh',
  'medwing','medwing-gmbh',
  'omr','omr-gmbh',
  'jimdo','jimdo-gmbh',
  'xentral','xentral-erp','xentral-gmbh',
  'circula','circula-gmbh',
  'taxdoo','taxdoo-gmbh',
  'pricehubble','pricehubble-ag',
  'gropyus','gropyus-ag',
  'nextmind','next-mind',
  'carjump','carjump-gmbh',
  'ionos','ionos-se',
  'camunda','camunda-gmbh',
  'zeiss-digital','zeiss',
  'siemens-energy','siemens-advanta',
  'sixt','sixt-se',
  'flixbus-tech','flixtrain',
  'scout24','scout24-ag','immoscout','immoscout24',
  'check24','check24-gmbh',
  'holidu','holidu-gmbh',
  'expertlead','expertlead-gmbh',
  'stryber','stryber-gmbh',
  'tanso','tanso-gmbh',
  'coachhub','coachhub-gmbh',
  'lengoo','spryker','spryker-gmbh',
  'plunet','plunet-gmbh',
  'leanix','leanix-gmbh',
  'celus','celus-gmbh',
  'cognigy','cognigy-gmbh',
  'usu','usu-gmbh',
  'relayr','relayr-gmbh',
  'solarwatt','solarwatt-gmbh',
  'zolar','zolar-gmbh',
  'tesvolt','tesvolt-ag',
  'sonnen','sonnen-gmbh',
];

const slugs = [...new Set(SLUGS)];

async function checkPersonio(slug) {
  try {
    const r = await fetch(`https://${slug}.jobs.personio.de/xml`, {
      signal: AbortSignal.timeout(8000) // follow redirects
    });
    if (r.ok) {
      const text = await r.text();
      const count = (text.match(/<position>/g) || []).length;
      return count;
    }
  } catch {}
  return 0;
}

async function run() {
  console.log(`🔍 Scanning ${slugs.length} Personio slugs (following redirects)...\n`);
  const hits = [];

  const BATCH = 40;
  for (let i = 0; i < slugs.length; i += BATCH) {
    const batch = slugs.slice(i, i + BATCH);
    await Promise.all(batch.map(async slug => {
      const count = await checkPersonio(slug);
      if (count > 0) {
        hits.push({ slug, count });
        console.log(`  ✅ ${slug}: ${count} jobs`);
      }
    }));
    process.stdout.write(`\r  Progress: ${Math.min(i + BATCH, slugs.length)}/${slugs.length}`);
  }

  hits.sort((a, b) => b.count - a.count);
  console.log(`\n\n=== ${hits.length} COMPANIES FOUND ===`);
  console.log('\nSlugs for PERSONIO_SLUGS:');
  console.log(`  '${hits.map(h => h.slug).sort().join("','")}'`);
  console.log('\nRanked by open positions:');
  for (const h of hits) console.log(`  ${h.slug.padEnd(30)} ${h.count} jobs`);
}

run();
