// Remote Jobs Sync Script — fetches from 9 sources, deduplicates, upserts to Supabase
// Run via: node .github/scripts/jobs-sync.mjs
// Env: SUPABASE_URL, SUPABASE_KEY (service role)

import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_KEY');
  process.exit(1);
}

// ─── Tech keywords for tag extraction (regex-matched against descriptions) ───
const TECH_KEYWORDS = [
  'javascript','typescript','python','java','ruby','go','golang','rust','c\\+\\+','c#',
  'swift','kotlin','php','scala','elixir','haskell','perl','lua','dart','r\\b',
  'react','next\\.js','nextjs','vue','angular','svelte','nuxt','remix','gatsby',
  'node\\.js','nodejs','express','fastify','nest\\.?js','deno','bun',
  'django','flask','fastapi','rails','spring','laravel','asp\\.net',
  'aws','azure','gcp','google cloud','firebase','supabase','vercel','netlify',
  'docker','kubernetes','k8s','terraform','ansible','jenkins','ci/cd','github actions',
  'postgresql','postgres','mysql','mongodb','redis','elasticsearch','dynamodb','cassandra',
  'graphql','rest api','grpc','websocket',
  'machine learning','deep learning','nlp','computer vision','tensorflow','pytorch',
  'llm','langchain','openai','gpt','claude','gemini','ai','ml',
  'figma','sketch','adobe xd',
  'tailwind','css','sass','html',
  'git','linux','nginx','apache',
  'solidity','web3','blockchain','ethereum','smart contract',
  'ios','android','react native','flutter','mobile',
  'data engineering','data science','etl','airflow','spark','kafka','hadoop',
  'security','penetration testing','devsecops','soc','compliance',
  'agile','scrum','kanban','jira','confluence',
  'sql','nosql','sqlite','oracle','snowflake','bigquery','dbt',
  'tableau','power bi','looker','metabase',
  'microservices','serverless','event-driven','saas',
  'product management','ux','ui','design system',
  // Role-based keywords
  'sales','marketing','finance','accounting','legal','hr','human resources',
  'operations','support','customer success','business development','partnerships',
  'analyst','recruiter','recruiting','talent','people ops','enablement',
  'content','copywriter','writer','editor','communications','pr',
  'revenue','growth','strategy','consulting','solutions',
  'devrel','developer relations','evangelist','community',
  'program manager','project manager','chief','vp','director',
  'engineer','engineering','architect','infrastructure','platform','sre','reliability',
  'qa','quality assurance','test','testing','automation',
  'intern','internship',
  'frontend','backend','full.?stack','fullstack',
].map(kw => new RegExp(`\\b${kw}\\b`, 'i'));

const KEYWORD_LABELS = [
  'JavaScript','TypeScript','Python','Java','Ruby','Go','Golang','Rust','C++','C#',
  'Swift','Kotlin','PHP','Scala','Elixir','Haskell','Perl','Lua','Dart','R',
  'React','Next.js','Next.js','Vue','Angular','Svelte','Nuxt','Remix','Gatsby',
  'Node.js','Node.js','Express','Fastify','NestJS','Deno','Bun',
  'Django','Flask','FastAPI','Rails','Spring','Laravel','ASP.NET',
  'AWS','Azure','GCP','Google Cloud','Firebase','Supabase','Vercel','Netlify',
  'Docker','Kubernetes','Kubernetes','Terraform','Ansible','Jenkins','CI/CD','GitHub Actions',
  'PostgreSQL','PostgreSQL','MySQL','MongoDB','Redis','Elasticsearch','DynamoDB','Cassandra',
  'GraphQL','REST API','gRPC','WebSocket',
  'Machine Learning','Deep Learning','NLP','Computer Vision','TensorFlow','PyTorch',
  'LLM','LangChain','OpenAI','GPT','Claude','Gemini','AI','ML',
  'Figma','Sketch','Adobe XD',
  'Tailwind','CSS','Sass','HTML',
  'Git','Linux','Nginx','Apache',
  'Solidity','Web3','Blockchain','Ethereum','Smart Contract',
  'iOS','Android','React Native','Flutter','Mobile',
  'Data Engineering','Data Science','ETL','Airflow','Spark','Kafka','Hadoop',
  'Security','Penetration Testing','DevSecOps','SOC','Compliance',
  'Agile','Scrum','Kanban','Jira','Confluence',
  'SQL','NoSQL','SQLite','Oracle','Snowflake','BigQuery','dbt',
  'Tableau','Power BI','Looker','Metabase',
  'Microservices','Serverless','Event-Driven','SaaS',
  'Product Management','UX','UI','Design System',
  // Role-based labels
  'Sales','Marketing','Finance','Accounting','Legal','HR','HR',
  'Operations','Support','Customer Success','Business Development','Partnerships',
  'Analyst','Recruiter','Recruiting','Talent','People Ops','Enablement',
  'Content','Copywriter','Writer','Editor','Communications','PR',
  'Revenue','Growth','Strategy','Consulting','Solutions',
  'DevRel','Developer Relations','Evangelist','Community',
  'Program Manager','Project Manager','Executive','VP','Director',
  'Engineering','Engineering','Architect','Infrastructure','Platform','SRE','Reliability',
  'QA','QA','Testing','Testing','Automation',
  'Intern','Internship',
  'Frontend','Backend','Full Stack','Full Stack',
];

// ─── Greenhouse company slugs to fetch ───
const GREENHOUSE_SLUGS = [
  '1password','adyen','affirm','agoda','airbnb','airtable','alchemy','amplitude','anthropic',
  'aptoslabs','arbitrum','asana','atlassian','attentive','automattic','avalabs','basecamp',
  'binance','bitgo','block','braze','brex','buffer','buildkite','bybit','calendly','carta',
  'cerebral','chainlink','chime','circleci','cloudflare','cloverhealth','cockroachlabs','coinbase',
  'consensys','contentful','coreweave','coursera','cribl','databricks','datadog','deepmind',
  'discord','doist','doordashusa','dropbox','duckduckgo','duolingo','dydx','elastic','epicgames',
  'ethereumfoundation','faire','figma','fireblocks','fivetran','fleetio','flexport','formhealth',
  'gemini','ghost','gitlab','glossier','govtech','grafanalabs','greenhouse','gusto','hashicorp',
  'hotjar','hubspot','idme','iherb','instacart','intercom','invision','iterable','jfrog',
  'justworks','klaviyo','kraken','lattice','launchdarkly','lucidmotors','lyft','marqeta','melio',
  'mercari','mercury','mixpanel','mmhmm','mongodb','monzo','moonpay','motional','mozilla','neo4j',
  'netlify','nubank','nuro','okta','okx','onemedical','opendoor','optimism','pagerduty','payoneer',
  'phonepe','pinterest','planetscale','postman','reddit','relativity','remote','riotgames','ripple',
  'robinhood','salesloft','samsara','scaleai','scopely','sendbird','slack','sofi',
  'solanafoundation','squarespace','stabilityai','stockx','stripe','superblocks','sweetgreen',
  'tailscale','temporal','thedutchie','toast','toptal','trivago','twilio','twitch','udemy',
  'uniswap','unity3d','upgrade','vercel','verkada','warp','waymo','webflow','xendit','zapier',
  'ziprecruiter','zscaler',
  // Marketing / Content / Design / BD-heavy companies
  'spotify','notion','shopify','adobe','canva','mailchimp','hootsuite','sproutsocial',
  'buzzfeed','voxmedia','nytimes','medium','wix','squarespace','hubspot','mailerlite',
  'loom','miro','airtable','typeform','calendly','later','buffer','sprinklr',
  'nike','peloton','warbyparker','allbirds','everlane','glossier','casper',
  'netflix','hulu','paramount','warnermedia','nbcuniversal',
  'salesforce','zendesk','freshworks','intercom','drift','gong',
  'deel','oysterhr','remotecom','velocityglobal','papaya','omnipresent',
  'wunderkind','iterable','braze','segment','amplitude','mixpanel',
  'figma','sketch','invision','framer','webflow','readymag',
  'superhuman','linear','productboard','pendo','fullstory',
  'outreach','apollo','clearbit','zoominfo','lusha','seamlessai',
];

// ─── Ashby company slugs ───
const ASHBY_SLUGS = [
  '0g','10xteam','1password','1sphere','3imembers','8fleet-inc','9-mothers','9fin','Cyberhaven',
  'a-place-for-mom','a-team','a16zcrypto','abby-care','abe','abound','abridge','absentia-labs',
  'academia','accurx','achira','acorns','acquisition','activesite','adaption','adaptive',
  'adaptive-ml','adaptivesecurity','addi','additiveai','adonis','adtucon','aegis-ai','afterquery',
  'agent','agentio','agi-inc','aiand','aida','aidkit','airapps','airbound','airbyte','airgarage',
  'airops','airspace-intelligence.com','airtasker','airwallex','aiwyn','alan','alcazar-energy',
  'alembic','aleph','alephalpha','alexai','alleviatehealth','allium','alljoined','allspice',
  'almabase','almedia','alpenlabs','alternativepayments','altimate','ambiencehealthcare',
  'ambient.ai','ambrook','amca','ami','amo','amperos','amplo','anagram','anatomy-financial',
  'anglehealth','anima','anrok','ansiblehealth','answersnow','antares','anterior','antithesis',
  'anyscale','anysignal','anything','anyvan','apex-technology-inc','apexgrowth','applied',
  'applied-behavioral-services','appsmith','april','aqua-voice','aquarianlp','arago',
  'arb-interactive','arbiter-ai','arbor','arcade','arcade-ai','arch.co','archive','arena',
  'arkenstonedefense','arlo','around','arqu','array-behavioral-care','artemis','artisan','asari.ai',
  'ascertain','ashby','ashgro','asimov','aspora','assembledhq','assorthealth','assured',
  'assured-health','astera','astral','astro-mechanica','astronomer','asymmetric.re','ataraxis-ai',
  'athena-hq','athenaactuarial','atlan','atlas','atlasresidential','atob','atomic',
  'atomicindustries','atroposhealth','atticus','attio','august-health','aurelian','aurorasolar',
  'authzed','aven','avid4','avida','away','axelera','axiom','axiombio','axion','axle-health','baba',
  'backflip','backflip.ai','backmarket','bankjoy','barkbus','barnes','barti','base','base-power',
  'baseten','basiccapital','basis-ai','basis-research','bastion','baton','bayesianhealth','beam',
  'beamery','beamimpact','bedrock','bedrockocean','ben','benchling','bespokelabs','bestow',
  'better-mortgage','betterstack','betterup','bevel','biconomy','binance.us','bioptimizers',
  'blackbird-labs-inc','blacksmith','bland','blissway','blockhouse','blockworks','blossom-health',
  'blp-digital','blueberrypediatrics','blumen','bobyard','bookkeeper360','boost','botcrew','bounce',
  'brainco','brainly','braintrust','branchlab','bravehealth','bree','brellium','brightstar-ai',
  'brightwheel','brigit','brinc','brisk-teaching','bubble','build','buildout','bullpen-talent',
  'bun','bunch','bunkerhillhealth','bureau','burklandassociates','buspatrol','cal','camber',
  'cambio','cambly','campfire','campus','camunda','canals','candidhealth','cantina',
  'canvas-medical','cape','carbonx','cardless','careers.azx.io','cargado','cargo-one','carry',
  'cartesia','cas','casap','casca','causal','causaly','cbai','cchn','centivo','centralhq',
  'chainalysis-careers','chainlink-labs','chalkboard','chambercardio','chapter','character',
  'charthop','chatbase','checkly','chestnut','chromatic','chronosphere','chronospherejobs',
  'circuithub','citizen','civilgrid','claim-health','claritypay','claritypediatrics','clarium',
  'clasp-group','claylabs','clearco','clearvector','clerk','clickup','clipboard','clipbook','close',
  'cloudzero','clubhouse','cluely','coactive','coalesce','cobot','coda','coder','coderabbit',
  'codes-health','coefficientgiving','cognition','cohere','coinflow','coinhako','cointracker',
  'colonist','column','comfy-org','comity','commonroom','commons','commure','company','composio',
  'compound','comulate','concourse','conduct','conductorone','conduit','confiant','confluent',
  'connecthum','conscious-talent','continua','continue','contra','convey','coreflow',
  'coreoftheheart','cortea','counsel','coursecareers','cow-dao','cradlebio','creatify',
  'critical-energy','crosby','crusoe','cruxclimate','cryptio','cubby-beds','cube','cubesoftware',
  'cultureai','curri','cursor','cuspai','cybcube','cyber.fund','cyberhaven','cylinderhealth',
  'cytora.com','cyvl','d-matrix','dailypay','dakota','dandy','darkroom','dash0','datacurve',
  'dataguard','dataplor','datasnipper.com','datologyai','dave','david-ai','davidenergy',
  'davistechnologymanagement','day9','daydream-ai','dbt-labs','decagon','decart-ai','decimal',
  'deel','deepgram','deepl','deepnote','deepsky','deepslate','deeptune','definelycareers',
  'dehazelabs','delinea','deliveroo','delphi','delve','demandbase','deno','depthfirst',
  'develop-health','devsavant','dexmate','diagrid','directive','dispatch','distributed-spectrum',
  'ditto','diversified-botanics','docker','doppler','dosespot','doss','dottxt','double','doxy.me',
  'drata','dreamthree','dualentry','dubclub','duck-duck-go','duckbill','duet','duna','dune','dust',
  'dyna-robotics','e2b','earthforce','easygenerator','easyllama.com','echo','ecosia.org','edia',
  'edra','edsights','edvisorly','egra','eigen-labs','eightsleep','ekho','ekumenlabs','electric',
  'element451','elevenlabs','eliseai','eliza','ello','eloquentai','ema','embedding-vc','emerald-ai',
  'emora-health','empirical-security','empora','endex','endgame','endurance-energy','ens-labs',
  'episteme','equal-ventures','equip','ernest','espa','espresso','essentialai','etched','ether.fi',
  'ethereum-foundation','ethglobal','eventual','evenup','everai','everfield','everops','everself',
  'everstar','evertune','every-io','exa','exegy','expressable','extend','eyebot','ezhealth',
  'eztexting','factory','faculty','far.ai','farmraise','farsight','fathom.video','featherlessai',
  'feathr','fernstone','fieldguide','filmhub','fin','finch','finni-health','firecrawl',
  'firstbaseio','firstmate','firstround','firststreet','fitt','fizz','flagright.com','flai',
  'flashbots.net','fleetdm','fleetline','fleetpulse','fleetworks','flint','flipturn','floatme',
  'flocksafety','flora','flowengineering','flowhub','fluency','flux','fly','focused','found',
  'foundry-for-good','fourier','fourth-power','fractional-ai','freed','freeplay','frequence',
  'freshpaint','frontcareers','fuel-cycle','fulcrum','fullstory','fundamentalresearchlabs',
  'fundwell','further','furtherai','fuse','futurefitai','futureproofing','g2','g2i','gamechanger',
  'gamma','garage','general-medicine','generalintelligencecompany','generalist','genomics',
  'geoforce','get-ivy','gigaml','gitbook','givebutter','glacis-ai','glide','glimpse',
  'global-x-etfs','glomo','glow25','go-augment','go-nimbly','goanagram','goldsky','golinks','gong',
  'goodship','goodstack','goody','gorgias','gotphoto','govdash','goveagle','govsignals','govwell',
  'gptzero','granola','graphite','graphitehq','gravityclimate','greatquestion',
  'green-tree-school-and-services','greenlitecareers','gridcare','gridunity','gruntwork','grvt',
  'gt-bio','haast','hackerone','hadrian-automation','halliday','handshake','handspring','hang',
  'hanover-park','happyrobot.ai','harmonic','harvey','hasura','hatch','haus','hawk',
  'hawkeyeinnovations','haydenai','haystacknews','hcompany','healthaxis','healthprogresshub',
  'healthsherpa','hedra','heidihealth.com.au','height','heirloomcarbon','helion','helius',
  'hellobrightline','hellohera','hellopatient','helm-ai','helpscout','heron-power','heyjobs',
  'higharc','highbeam','highlightai','hightouch','hiive','hims-and-hers','hirehangar','hive.co',
  'hivehealth','hivesmart-consulting','hiya','hockeystack','homebase','homebound','homevision',
  'honeydew','hopper','horizon3ai','hotspexmedia','hoxtonfarms','hubstaff','hud','hudu','humaans',
  'human','human-computer-lab','humandelta','humans-and','humatahealth','hyperbolic','hypercubic',
  'hyperexponential','hyperhug','ibbx','ideals','ideogram','idler','illumio','immersivelabs',
  'imprint','improbable','impulse','inertia','inference','infinite','infinity-constellation',
  'infisical','innate','inngest','inspectiv','instructure','intellistack','interaction','interface',
  'interplay','interrahealth','intro','intus','invisionapp','ironcladhq','iverify','jampack-ai',
  'january','jbs-dev','jellyfish','jellyfishcareers','jerry.ai','jimdo.com','join9am','joinbetter',
  'joinsherpa','joor','joyfulhealth','judgmentlabs','juicebox','julius','jump','jump-app',
  'junction','junior','junipersquare','justplay-gmbh','justwin','k-id','kale','kalibri-labs',
  'kalshi','kamiwaza','kayak','keep','kernel','kilocode','kin','kindred','kirin','kit','kiwi',
  'known','knox-systems','kodex','kognitos','kognity','kojo','kombo','kong','kraken.com','krea',
  'kueski','kustomer','ladder','lambda','lancedb','langchain','lap','lark','latamcent',
  'latitudecareers','laurel','lawhive','layerfi','leadbank','leandata','leantechniques','leap',
  'leapsome','ledger','legionhealth','leland','lemlist','lemonade','lendable','leona','level',
  'levelpath','lgads','li.fi','libra','lido.fi','life-space-digital','lightdash','lightning',
  'lightspark','lightstep','lilt-corporate','limble','lime','linda','lindushealth','lindy','linear',
  'linera.io','linqapp','liquid-ai','listenlabs','liv-golf','liveblocks','livekit','livinghr',
  'lm-studio','loancrate','logiqal','loot-labs','lottie','lovable','loveholidays',
  'lpadesignstudios','luminai','luminary','lydian','lynk','lyric','m-kopa','mach','mach9',
  'machinify','macroscopic','madhive','magic','magic.dev','magical','magiceden','magicschool',
  'maincode','mainstay','mandolin','mangomint','manifest-law','manusai','mapbox','maple','marble',
  'marianaminerals','mariner-careers','marloo','marshmallow','masabi','maticrobots',
  'matter-intelligence','matter-labs','maximustribe','maybern','mazedesign','mazehq','mebe',
  'mechanize','medely','medraai','medscout','medsender','meetmarvin','megazone','menlosecurity',
  'mentis','mercor','merge','meridianlink','meshy','metaforms','metaview','meter','method',
  'mexdigital','midstream','mindbeam','mindly','mindvalley','mintlify','mirage','miri','miro',
  'miter','mobasi','mobbin.com','modal','modernfi','moderntreasury','modus','moego',
  'molecule-software','monaco','monarchmoney','monsters','montecarlodata','moonlake','moonshot-ai',
  'moonvalley-ai','moraleshr','mosaic','mosey','motherduck','motion','motorway','moxfive','moxie',
  'mubi','mudflap','mullvad','multiply','multiverse','mural','mux','mystenlabs','mytomorrows','n1',
  'n8n','nabihealth','nango','nansen','nash','nationgraph','nectar-social','nelo','neon',
  'nerdwallet','nest-health','nestmed','nestveterinary','netboxlabs','netgear','nethermind','netic',
  'netwealth','neuroscale','nevoya','new-story','newform','newfront','newlantern','nextpatient',
  'nexus.xyz','nexxa','nightfall-ai','nimbl','nivoda','noda-ai','noise-labs','nomos','norm-ai',
  'northwoodspace','nory','notable','notion','novita-ai','novo','nucleus','nudge','numeral',
  'numeric','nuna','nursa','oakland-feather-river-camp','observable-space','observeinc','obviant',
  'obvio','obvious','ocra','odys-aviation','odyssey','office-hours','omaze','omnea','omni',
  'omniscient','one-pass-solutions','oneapp','onebrief','onecrew','oneleet','onepot','onereach.ai',
  'oneschema','onhires','onramp','opal','openai','openevidence','opengov','openhands',
  'openhomefoundation','openrouter','opensea','opfoundation','opslevel','optimum','optro','opus1',
  'opusclip','orb','orbit','orbital','orca','orchard','orum','osmo','oso','oumi','outpost',
  'outpostnow','outset','outsmart','outtake','overflow','overviewenergy','owner','oxio','oxman',
  'oyster','p2p.org','paddle','palette-media','palmstreet','pano-ai','panoptyc','papaya-global',
  'parable','parabola-io','paradigm','paradox','parafin','paraform','paragon','parallel',
  'parashift','pareto-ai','parity','parker','partiful','partsbase','passage','passport','patch.io',
  'patreon','payabli','pebl','peek','people-culture-talent','peppr','perchwell','perk','permitflow',
  'perplexity','persona','persona.ai','phantom','phia','phil','phoebe','phoebe-work','phoenix',
  'phonic','physicalintelligence','pinecone','pitch','plaid','plain','planehr','plantingspace',
  'plasma','plasmidsaurus','platoapp','plaud','playground','playpowerlabs','playson','pleo',
  'pluralfinance','pluto-health','pmmalliance','pod-network','podium-automation','poesis',
  'polaranalytics','polymarket','poolside','popl','posh','posh-ai','poshmark','posthog','powerus',
  'pravah','prefect','prelim','primary','primeintellect','primer','primer.io','prior-labs','prisma',
  'procurementsciences','procurify','prodigy-education','product-now','profound',
  'project-expedition','prokeep','promise','promise-studios','prompt','proofofplay','propelus',
  'protege','provable','proxima-fusion','pulumi','puzzle.io','pylon','pylon-labs','quadrivia',
  'qualified','quant-aq','quantware','quarks-tech','quartermaster','quicknode','qumis','quora',
  'quotewell','rabot','radai','raiku','railway','rain','ramp','range','raspberry','raycast',
  'reacher','read-ai','ready','real','rebecca-school','recraft','red-gate','redpine','reducto',
  'reedsy','reevo','reflect-orbital','reflectionai','reflexrobotics','reflow','reframesystems',
  'regent','rehire','reindeer-ai','reinforce-labs-inc','reka','reklamehealth','relay','relayfi',
  'relayprotocol','remarcable-inc','remedyrobotics','render','renuity','replicated','replit',
  'replo','reprally','reprise','rerun','rescale','resend','resq','restream','retell-ai','retool',
  'rev','reve','revenuecat','revic','reviserobotics','revv-hq','rewind','rho','ridealso','rilla',
  'rillet','river','riveron','rize','roadsurfer.com','roboflow','robot-learning-co','roebling',
  'rogo','roo-code','roompricegenie','rothys','rowan','ruby-labs','rula','rundoo','runna','runway',
  'rwazi','rythm','s2','safelease','sagelabs.ai','sahara','salesape-ai','salient','sanctuary',
  'sandbar','sandboxaq','sanity','sapiom','sardine','satispay','savvy','scalemath','scaler',
  'scan-com','scarlet','scorewarrior','scribdinc','scribe','sdsc','seamflow','seconddinner',
  'sellfire','semgrep','seneca','sensmore','sent','sentient','sentra','sentry','seon','sequence',
  'serverobotics','sesame','sevaro','sevenai','sfcompute','shepherd','shiftkey','shortstory',
  'sibill','siena','sierra','sierra-studio','sieve','siftstack','signalwire','sigp','silver','sim',
  'simular','siro','sisu','sitemate','siteminder','skimmer','skymavis','skynrg','slant',
  'slash-financial','sleeper','slingshotai','slope','smallest','smalls','smallstep','smartleaf',
  'snappy','snd','snowball','snowflake','snyk','sobek-ai','socure','softwarevision','sola','solace',
  'somethings','somnia','sonio','sourcegraph','sourgum','span','span.app','spare','speak',
  'speakeasy','spear-ai','spearbio','specter','spexi','spherical','spiral','squads','squint.ai',
  'ssi','st-labs','stable','stacker','stackone','stainlessapi','standardfleet','starbridge',
  'starpath.space','startvim','stash','statista','statsig','stay22','stayai','staycation','steel',
  'stellar-health','stepful','stickermule','strategic-growth-partners','stream','streetgroup',
  'strongdm','stronghold','stuut-ai','stytch','substack','subzero','suite-studios','sully-ai',
  'sunday','sunflower-sober','suno','supabase','super.com','superdial','superduper','superhuman',
  'superlinear','superpower','suzy','swans','swarmer','sweedpos.com','sweep','swoop','sydecar',
  'symbiotic','symmetry','synquery','synthesia','synthflow','synthpop','tabs','tabz','taekus',
  'tajir','take2','taktile','talentsafari','talkiatry','talos-trading','tandem','tarro',
  'tavahealth','tavily','tavus','taxbit','taxfix.com','teal-health','teambridge','teamworks',
  'technimove','teleport','teleskope','tem','tempo','tempo-xyz','tenexlabs','tennr','tensorwave',
  'teraswitch','terraai','terranova','tessera-labs','texture','the-exploration-company','the-flex',
  'the-global-talent-co','the-learning-spectrum','the-sales-people','the-studio','theflex',
  'themindcompany','thesis','thewfsgroup','theydo','thndr','thought-machine','thrill-labs',
  'tigerdata','tilthq','timely','tin-can','tinybird','titan','titan-ai','tldr.tech','todoist',
  'toggl','toma','toms','toogeza','topline-pro','toposbio','traba','trainline','transfr',
  'transgrid-energy','traversal','trawa','treeswift','tremendous','triumph-arcade','truelogic',
  'trust-wallet','truthsystems','tryalma','tunnl','turnstile','turquoise-health','turso','twelve',
  'twelve-labs','twenty','twin-so','tyba','udisc','uipath','unify','union','union-tech','unit',
  'unit410','unitxlabs','universalagi','unlearn','unwrap','uplane','upside','upside-tech','upstash',
  'uptimeai','upvest','usekernel','usul','vanilla','vanta','vantageanalytics','vapi','vector',
  'vegaclaims','vellum','vendelux','vercel','versemedical','vertical-aerospace','verto','vetcove',
  'vibe','vibecode','vibiz','vinci4d','virtahealth','virtuous','visanahealth','vitalize','vitvio',
  'viz.ai','voldex','vori','vow','voxel','vynca','wagmo','walrus','wand','warp','watershed',
  'wealth-com','wealthsimple','weave','weaviate','webai','weekend','wellth','what3words','wheel',
  'whetstoneresearch','whippy','winona','wisp','wispr-flow','wistia','withcherry','withclutch',
  'withdaydream','withdefault','withpulley','withwisdom','witnessai','woflow','wokelo-ai',
  'wordsmith','wordware.ai','workweave','workyard','worldly','wrapbook','writer','wundergraph',
  'xbowcareers','yeet','yendo','yondr','you-health','yourco','zapier','zayzoon','zed','zeely',
  'zello','zencastr','zenjob','zero','zerorfi','zettabyte-space','zip','zippymh','zyphra',
];

// ─── Workable company slugs ───
const WORKABLE_SLUGS = [
  'huggingface','writesonic','oysterhr','midjourney',
];

// ─── Lever company slugs ───
const LEVER_SLUGS = [
  '15five','3pillarglobal','accesssoftek','accurate','achievers','activecampaign','addx',
  'aeratechnology','aero','agiloft','air-tek','airalo','aircall','aleph','allegiantair','alltrails',
  'analyticpartners','anchorage','angellist','anomali','appen','appen-2','applydigital','appzen',
  'arcadia','artera','articulate','assist-world','bazaarvoice','benchsci','better','binance',
  'blablacar','bloom','bluecatnetworks','bluelightconsulting','bounteous','brevo','brilliant',
  'brillio-2','bumbleinc','businesswire','butcherbox','cagents','capital','captivateiq','cellares',
  'centrifuge','cents','certifyos','chownow','ciandt','cic','civitech','clari','cleanspark',
  'cloudinary','coalfire','coingecko','coins','color','comply','connectly','contentsquare','cred',
  'crypto','datalabusa','deleteme','deliverect','demo','deputy','digimarc','digitalmediamanagement',
  'disher','dlocal','doola','dreamgames','drivetrain','educative','elfbeauty','emma-sleep','employ',
  'enable','equativ','erg','esper','eternal','everbridge','everlywell','factor','fampay','farfetch',
  'fevo','fi','field-ai','finch','find','finn','floqast','framer','freedompay','fresha','frontify',
  'gearset','getlabs','gettyimages','getwingapp','gohighlevel','goodleap','gopuff','goswift',
  'greenlight','gridware','h1','happyco','happyhiller','hcvt','healthcare','heartbeathealth',
  'highspot','hightechhigh','hive','hostinger','houzz','imentor','immutable','imo-online',
  'includedhealth','inductivehealth','influur','investorflow','ioconnectservices.com','ion','ivo',
  'jobandtalent','jumpcloud','kabam','kepler','kiddom','klivvr','kpler','kraken','kraken123',
  'kubra','labelbox','ladders','lalamove','lamudi','lendbuzz','levelai','levelup','lever',
  'leverdemo-8','linear','loadsmart','logz','loom','lucidworks','lumivero','lumotive','lyrahealth',
  'mactores','mahmee','masterycharter','matchgroup','matillion','meesho','megaport','mendix',
  'merklescience','metabase','metaprise.ai','metopera','metr','mindbloom','mindtickle','mistral',
  'nava','neighbor','netomi','newton','nielsen','nimblerx','ninjavan','nium','nominal','notion',
  'novatalent','numeris','offchainlabs','omnisend','outreach','palantir','palo-it','patsnap',
  'pattern','paytm','pditechnologies','peakgames','penumbrainc','people-ai','perforce','petvisor',
  'picklerobot','pipedrive','pivotal','placemakr','plaid','planettechnologies','planner5d','plexus',
  'plusgrade','pointclickcare','pp-la','ppfa','ppgny','prismic','proof','proper','prosper',
  'protective','protolabs','provi','quantcast','quantummetric','questanalytics','quokka',
  'rackspace','redsox','regrello','relay','replit','revel','revhealth','rhombus-systems','rise',
  'rivr','ro','robust-ai','rover','safe','saviynt','sensortower','shopback-2','shopify','signal',
  'singerlewak','smart-working-solutions','snaplogic','sonatype','spotify','sprucesystems',
  'stackblitz','standtogether','suger','superhuman','supermove','superside','sure','swordhealth',
  'sysdig','tala','teamsnap','teikametrics','teleport','telesat','theblockcrypto','thinkahead',
  'thinkingbox','toku','topanga','torchdental','trueml','trunkio','trustly','ttecdigital',
  'txidigital','unico','upguard','vacancies','veeva','vendavo','venteur','veo','vergesense',
  'versapay','vevo','vida','vivrelle','voodoo','vrchat','walkme','waveapps','wealthfront','webflow',
  'whereby','whoop','willowinc','wisdomai','workwave','wr','z1tech','zapier','zeta','zocks','zoox',
  // Marketing / Content / Design / BD-heavy companies
  'spotify','shopify','notion','nike','netflix','hulu','peloton','warbyparker',
  'allbirds','casper','sweetgreen','everlane','reformation','awaytravel',
  'hubspot','salesforce','zendesk','freshworks','gong','outreach',
  'hootsuite','sproutsocial','latercom','buffer','mailchimp','activecampaign',
  'canva','figma','sketch','framer','miro','loom',
  'medium','substack','buzzfeed','voxmedia',
  'wix','squarespace','webflow','contentful','sanity',
  'deel','oyster','remotecom','papaya','omnipresent',
  'clearbit','zoominfo','apollo','seamlessai','lusha',
  'pendo','amplitude','fullstory','mixpanel','segment','heap',
];

// ─── Helpers ───
function dedupHash(company, title) {
  const normalized = `${company.toLowerCase().trim()}|${title.toLowerCase().trim()}`;
  return crypto.createHash('md5').update(normalized).digest('hex');
}

function extractTags(text) {
  if (!text) return [];
  const found = new Set();
  for (let i = 0; i < TECH_KEYWORDS.length; i++) {
    if (TECH_KEYWORDS[i].test(text)) found.add(KEYWORD_LABELS[i]);
  }
  return [...found];
}

function normalizeJobType(raw) {
  if (!raw) return null;
  const t = raw.toLowerCase().replace(/[_-]/g, ' ').trim();
  if (t.includes('full') && t.includes('time')) return 'full_time';
  if (t.includes('part') && t.includes('time')) return 'part_time';
  if (t.includes('contract')) return 'contract';
  if (t.includes('freelance')) return 'freelance';
  if (t.includes('intern')) return 'internship';
  return raw;
}

async function fetchExistingKeys() {
  // Wait for connection pool to drain after massive parallel fetches
  await sleep(2000);
  
  // Fetch all existing dedup_hashes AND external_ids from DB to skip duplicates client-side
  const allHashes = new Set();
  const allExternalIds = new Set();
  let offset = 0;
  const pageSize = 1000;
  let retries = 0;
  while (true) {
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/jobs?select=dedup_hash,external_id&offset=${offset}&limit=${pageSize}`,
        { headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` } }
      );
      if (!res.ok) break;
      const rows = await res.json();
      if (rows.length === 0) break;
      for (const r of rows) {
        allHashes.add(r.dedup_hash);
        if (r.external_id) allExternalIds.add(r.external_id);
      }
      offset += pageSize;
      retries = 0; // reset on success
    } catch (e) {
      retries++;
      if (retries > 5) { console.error('  ❌ fetchExistingKeys failed after 5 retries'); break; }
      console.log(`  ⚠ fetchExistingKeys retry ${retries}/5: ${e.message}`);
      await sleep(3000 * retries);
    }
  }
  return { allHashes, allExternalIds };
}

async function supabaseUpsert(jobs) {
  // Deduplicate by external_id in-memory (prefer external_id over dedup_hash)
  const seen = new Map();
  for (const job of jobs) {
    const key = job.external_id || job.dedup_hash;
    if (!seen.has(key)) {
      seen.set(key, job);
    }
  }
  const unique = [...seen.values()];
  console.log(`   After in-memory dedup: ${unique.length} unique jobs`);

  // Pre-fetch existing keys to skip duplicates client-side
  console.log(`   📥 Fetching existing keys from DB...`);
  const { allHashes, allExternalIds } = await fetchExistingKeys();
  console.log(`   📥 Found ${allExternalIds.size} existing external_ids, ${allHashes.size} hashes in DB`);

  // A job is new only if BOTH its external_id AND dedup_hash are absent from DB
  // This prevents cross-source duplicates (same company+title from RemoteOK vs Greenhouse)
  const newJobs = unique.filter(j => !allExternalIds.has(j.external_id) && !allHashes.has(j.dedup_hash));
  const skippedCount = unique.length - newJobs.length;
  console.log(`   🆕 ${newJobs.length} new jobs to insert (${skippedCount} already exist)`);

  if (newJobs.length === 0) {
    return { inserted: 0, skipped: skippedCount };
  }

  // Batch insert only new jobs — 200 per batch, 50 concurrent
  const batchSize = 200;
  const concurrency = 5;
  let inserted = 0;
  const batches = [];

  for (let i = 0; i < newJobs.length; i += batchSize) {
    batches.push(newJobs.slice(i, i + batchSize));
  }
  console.log(`   📤 Inserting ${batches.length} batches of ~${batchSize} (${concurrency} parallel)...`);

  async function insertBatch(batch) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 120000);
      const res = await fetch(`${SUPABASE_URL}/rest/v1/jobs?on_conflict=external_id`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=ignore-duplicates,return=representation',
        },
        body: JSON.stringify(batch),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (res.ok) {
        const result = await res.json();
        return result.length;
      } else {
        const err = await res.text();
        // If dedup_hash conflict, try row-by-row (slower but handles cross-source dupes)
        if (err.includes('dedup_hash')) {
          let count = 0;
          for (const job of batch) {
            try {
              const r2 = await fetch(`${SUPABASE_URL}/rest/v1/jobs?on_conflict=external_id`, {
                method: 'POST',
                headers: {
                  'apikey': SUPABASE_KEY,
                  'Authorization': `Bearer ${SUPABASE_KEY}`,
                  'Content-Type': 'application/json',
                  'Prefer': 'resolution=ignore-duplicates,return=representation',
                },
                body: JSON.stringify([job]),
              });
              if (r2.ok) { const r = await r2.json(); count += r.length; }
            } catch {} // silently skip individual dupe failures
          }
          return count;
        }
        console.error(`  ❌ Batch error: ${err.substring(0, 200)}`);
        return 0;
      }
    } catch (e) {
      console.error(`  ❌ Batch failed: ${e.message}`);
      return 0;
    }
  }

  // Fire all batches with concurrency limit
  for (let g = 0; g < batches.length; g += concurrency) {
    const group = batches.slice(g, g + concurrency);
    const results = await Promise.all(group.map(b => insertBatch(b)));
    for (const r of results) inserted += r;
    console.log(`   ✅ Group ${Math.floor(g / concurrency) + 1}/${Math.ceil(batches.length / concurrency)} done (${inserted} inserted so far)`);
  }

  return { inserted, skipped: skippedCount + (newJobs.length - inserted) };
}

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ─── Source: RemoteOK ───
async function fetchRemoteOK() {
  console.log('\n── RemoteOK ──');
  try {
    const res = await fetch('https://remoteok.com/api', {
      headers: { 'User-Agent': 'Mozilla/5.0 (CVin.Bio job aggregator)' }
    });
    const data = await res.json();
    // First element is metadata, rest are jobs
    const raw = Array.isArray(data) ? data.slice(1) : [];
    const jobs = raw.map(j => ({
      source: 'remoteok',
      external_id: `remoteok_${j.id}`,
      dedup_hash: dedupHash(j.company || '', j.position || ''),
      title: (j.position || '').trim(),
      company: j.company || 'Unknown',
      company_logo: j.company_logo || j.logo || null,
      location: j.location || 'Remote',
      job_type: normalizeJobType(j.type) || 'full_time',
      salary: j.salary_min && j.salary_max ? `$${j.salary_min}-$${j.salary_max}` : (j.salary || null),
      description: (j.description || '').substring(0, 5000),
      tags: j.tags?.length ? j.tags.map(t => t.charAt(0).toUpperCase() + t.slice(1)) : extractTags(`${j.position || ''} ${j.description || ''}`),
      apply_url: j.apply_url || j.url || `https://remoteok.com/remote-jobs/${j.slug || j.id}`,
      category: j.tags?.[0] || null,
      published_at: j.date || null,
    })).filter(j => j.title && j.company);
    console.log(`  Found ${jobs.length} jobs`);
    return jobs;
  } catch (e) {
    console.error(`  ❌ RemoteOK error: ${e.message}`);
    return [];
  }
}

// ─── Source: BambooHR (per-company) ───
const BAMBOOHR_SLUGS = [
  '100percentgroup','1010games','10squared','10tengaming','10web','116andwest','12thstreetauto',
  '12thtribe','1648factory','17capital','17live','17triggers','1milk2sugars','1office','1steps',
  '1stforawarding','1stmile','1stnationalbankslu','1to1','1upnw','1valet','2020mobile',
  '206toursold','211nemichigan','211tampabay','21stcenturyrehab','22bet','22w2','2centricllc',
  '2circleinc','30fe','31greenltd','350','360communityservices','3ap','3cat','3fs','3keel',
  '3peaksadvisors','3yourmind','401auto','42crunch','434marketing','4dmedical','50can','50north',
  '5icloudsolutions','603legalaid','826boston','8rivers','97thfloor','98ventures','99drive','a4hc',
  'aaalandscape','aamci','aap','aapchr','aasafetyinc','aatransporting','abasolutions','abaxx','abd',
  'abellgroup','abfnhc','abiresearch','ableartswork','aboitiz','abortionfunds','aboutenergyuk',
  'abpharmacy','abqcf','absci','absedu','absidefense','abyss','academielafayette',
  'academyofalameda','accelbyte','accelion','accesscommunitycare','accessnow',
  'accessreproductivejustice','accessstar','accesssupportnetwork','acclaro','accountable2you',
  'accuratetemps','accwis','acddirect','acecaremgmt','aceinc','acelabio','acemetal','acerta','acgf',
  'achievebh','achieveit','acino','ackard','acleddata','aclions','acludc','aclunv','acolin','acord',
  'acornbiolabs','acornstrategy','acsinspiroz','actionaidinternational','actionaidzimbabwe',
  'actionsquared','activeviam','actonadu','acts29','adamsindustries','adamsmiles','adcraft',
  'addictiontreatmentservices','addium','adeptag','adhdonline','adi','adinstruments','adistec',
  'adna','adsalarm','adsignal','adso','adtechholding','adterra','advancemetrics','adventgroup',
  'adventistmediaministries','adventservices','adverscale','advertisepurple','aecc','aeis',
  'aerialcanvas','aerobotics','aerodynamics','affinitydigital','afg','afhs','aflatoun','afn',
  'africanclimatefoundation','africansafariwildlifepark','africastalking','afteam','ageofunion',
  'agilebridge','agilityfeat','agnesirwinschool','agorocarbon','agriconnect','agritechnovation',
  'agua','ahandyhomeinspector','ahcmo','ahkgroup','ahpd','aicadium','aicdac','aim','aimhigh',
  'aimsnei','aiopsgroup','aircontrolaz','aircraftperformancegroup','airprodiagnostics','airthings',
  'airx','aisle518','aisobservers','aiu','aivo','ajmenvironmental','akcelo','akerbiomarine',
  'akinox','akjchem','aklamio','akoyabio','akselos','alabamaagcredit','alabamapublictv',
  'alaskacenter','alaskacf','alaskaspca','albanycountygov','albertagrains','albertamt','alchemab',
  'alclvma','aldridgesecurity','aletheiahp','alexandriasheriffsoffice','algaktiv',
  'algorandfoundation','alicetechnologies','alimentiv','aline','alkira','allbeauty',
  'alleghenycounty','allhabitat','allianceaba','alliancebuilds','alliancehhcs','alliancetrustco',
  'alliedgold','allinenergy','alloptions','alloralabs','allout','allpressespresso','allsopsoftware',
  'alltogetherrecovery','alminerech','alnafrica','alpega','alphabrandmedia','alphafx',
  'alphahousecalgary','alt21','alta','altaconstruction','altenar','alterainvestments','alterian',
  'alterome','altitudegroup','altrogco','altusincii','aluminiumstewardship','alumis',
  'alzheimerjourney','amadeuscapitalaccount','amanacare','amazeeio','amazingmagnets',
  'amazonfrontlines','ambank','americanalpineclub','americanbankmontana','americandatanetwork',
  'americanflyers','americanlumber','americanrivers','americansunited','ameripharma','amgmed',
  'amii','amnestykenya','amputeecoalition','amsm','amwhealth','anaergia','anapaya','anaqua',
  'anchoragelandtrust','anchorageparkfoundation','anchorqea','andaria','andava','andersonair',
  'andglobal','anecdotes','anew1','anewhope','angelhost','animalercare','animalsasia','animaltrust',
  'animalz','animassurgical','anixe','anmut','ann','anonm','anonyome','answerport','antare',
  'antares','anteristech','anthem','anthill','anthonyharper','anufamilyservices','anvilsecure',
  'anyon','aoasis','aoicorp','aoracing','ap10','apaa','apadventista','apcawl','apexbuilding',
  'apexdki','apexgcs','apexkhomecare','apextraderfunding','apfc','apgecommerce','apichaya',
  'aplusgaragedoors','apngroup','apolloscooters','appalachian','applewoodfixit','approvepayments',
  'apr','aprime','aptose','aqt','aquaexpeditionshr','aquanty','aquaterra','aqueoussolutions','arca',
  'arcadian','arcetyp','archagana','archford','archipelagocos','arcoirisschool','arcpower',
  'arcprograms','arctickingdom','arctiq','ardeneng','ardenwood','ardmac','arenko','ariateurope',
  'arielre','arisehomes','arkeabio','arksen','armakuni','arraymarketing','arroyotrabuco','artbio',
  'artidea','artistsreenvisioningtomorrowinc','artivabio','arubahemotionalhealth','arvore','asbell',
  'ascendenthealth','ascendigo','ascensionrecovery','ascentprostaff','asemio','asfg','asgi',
  'ashememorial','ashesi','ashteadtechnology','asimo','asmllc','aspenfire','aspennature',
  'aspenridgell','aspireearlylearningacademy','aspireeducationalservices','aspiretech',
  'assemblybioinc','assistambulance','associatedambulance','astcorp','astrak','asuresoftware',
  'asylumaccessco','asyousow','atabus','atchleycpas','atex','athena','athenastudio',
  'athenslifefellowship','atheycreek','atiinc','atijet','atlantaglow','atlanticdigital',
  'atlanticoralsurgery','atlascredit','atlasexcavating','atlasgroupcos','atlashotels','atlatl',
  'atlbeltline','atomicroastery','attendanceondemand','attentivecareservice','atthegrounds','audax',
  'audimute','audoo','augustrosehc','auipower','auriens','ausland','australeducationgroup',
  'autocab','autochlor','autograph','autonettv','avaindustries','avantinsurance','avantpage',
  'avanzallc','avenuefive','avenuetwotravel','avfrd','aviationrepair','avidbots','avina','avjet',
  'avnan','avon','awcc','awcsolutions','awesomemotive','awh','awhnet','awp','axios','axjs','axya',
  'aypa','azayaranch','azerion','azolver','b2xcare','b4networks','babyscripts','backyardbookkeeper',
  'bag','bahamas','bahras','bahspets','baileyharris','baileylauerman','baileynelson','bakerave',
  'bakertillyrsg','balancetreatment','baldwinemc','baldwinfamilyhealthcare','baldwinshell',
  'balfour','balladgroup','ballerinafarm','balticapprenticeships','baltimorewatertaxi',
  'bamstrategy','banac','bandc','bandsintown','baptist','bare','barnacleparking','barnstormvfx',
  'barrinc','barringtonstageco','barristonlaw','bartowbuilders','base','basemakers',
  'basicresearch1','basigo','basketballengland','batimoinc','battenkill','baumtech','bayfarm',
  'bayswater','bayvenues','baywasolarsystems','bb4ck','bbagency','bbbne','bbcontracting','bbf',
  'bbmrieric','bc2','bcca','bcinvasives','bcndpcaucus','bcocpa','bddec','bdhall','bdozambia',
  'beaconconnections','beadindustries','bearingbronze','beatyctech','beatymasonry','beauregard',
  'beckautogroup','becore','bedc','beeflambnz','beehivepr','beelineloansinc','bekhealthcorp',
  'belaircare','belaydiagnostics','bellgroup','belmar','beltonmo','bemyguest','ben',
  'benchmarkdatasolutions','benderuk','beneng','bengenro','benjipays3','bentleyschool',
  'bentonvillear','beqom','bergstrom','berkeleyfirststeps','berkshiregrey','berlinpackaging',
  'bermudaskyport','bethanyassemblymi','bethebusiness','betonalfa','beverlysbirthdays',
  'beyondexpectation','beyondplay','bfaglobal','bforeai','bfweng','bga','bgcengineering',
  'bgcgarfield','bgmgroup','bhrrc','bhspc','bickhamservices','bidayamedia','bigleap',
  'bigstonecounty','bigtimepestcontrol','bikesonline','billigence','bimeda','binera','binnie',
  'binsentry','binsky','bioconnect','biofiredefense','biolite','biologicaldiversity','biomeafusion',
  'biophorum','bioratherapeutics','birchcreekenergy','birchmeregroup','birdbuddy',
  'birdcontrolgroup','birdscanada','bisc','bison','bitaksi','bitcoin','bitrise','bitsinglassca',
  'bitwerxinc','bitwizards','bkimechanical','bklconsultants','blackfeministfuture',
  'blackhillsblend','blackmountainroadpet','blackrock','blackrockasphalt','blackrockresort',
  'blackstoneenergy','blacksunplc','bladmin','blairfamilysolutions','blanclabs','blank','blastone',
  'bleems','blinknow','block64','blockaero','bloedelreserve','bloomadsglobalmedia','bloomapp',
  'bloomtherapycenter','bluearray','bluecadet','bluecanyontech','bluelayer','bluelotuschai',
  'blueorchard','bluepi','blueprintsubsea','bluestonepim','blufftonfd','blumetric',
  'blunierbuilders','bmcc','bmeinsurance','bmit','bn','bnktothefuture','bnrconsulting',
  'bobpultechevrolet','boffoproperties','bofish','boilermasters','boilerroom','boldcommerce',
  'boldprogressives','boltontechnology','bonaventurelab','bonhams','bonnessinc','bontonassociates',
  'bookouture','boombit','boomerconsulting','boonesupportedliving','boostcyac','bosta',
  'bostonanalytical','bostonlyricopera','botpress','boulderruralfire','boundarystonepartners',
  'boundless','bowery','bowtie','boxpower','boxtlimited','bprd','bpsbioscience','bradfordearlyed',
  'bragggaming','brainbox','brainrocket','brainstorm','braintrusttutors','branchtechnology',
  'branco','brandlive','brankas','bravebe','bravebison','bravomedia','brdaelectric',
  'breakthroughmontessori','brekhustile','breuckelenathletic','brhd','bricartsmedia',
  'bridgephilanthropicconsulting','bridgespcs','bridgetownnaturalfoods','brigadebgc',
  'brightbeginningskids','brighthope','brighthouse','brightiron','brightline','brighttax','brighty',
  'brinerbuilding','bringoz','brinkersjewelers','britishvethospital','brittradius','brms',
  'broadcastmgmtgroup','broadviewnetworks','broadway','broccolini','brockpest','brokerchooser',
  'brooklynlaboratoryschool','brooks','brotherhoodsistersol','brpcc','brydens','bsi','bspcpa',
  'bsr1','bssd','bta','bucketlist','buddle','buddlefindlay','buddyboss','budge','budgetease',
  'budibase','buffalogardens','buildcommonwealth','buildinghopeinthecity','buildology','buildsafe',
  'bulmanndock','buoyhealth','burai','burdgdunham','burnsandfarrey','burrowslightbourn','busbud',
  'businessinstincts','businessprocessingsolutions','bustransportation','butlerlaw','button',
  'buttonis','buyken','bvifinance','bvifsc','bvitourism','bvmcapacity','bxcc','byassociationonly',
  'byrnezizzi','c3tricities','c40','caahep','caanv','cabinetpeaks','cabinforestry','cachet',
  'cacindinc','cacjamaica','cadencetranslate','caedpartners','cafairplan','cagc','cahull','cairo',
  'calartscap','calbright','calcasieulibrary','caleja','calgary','calgaryjohnhoward','callabco',
  'callenlenz','calproinspectiongroup','calsolarinc','caltog','caltrout','calvarypsl','calvoices',
  'calyanwaxco','cambridgeaudio','campbelltaylorwashburn','campeon','campfireak','campfireco',
  'campharborview','campuskey','canacad','canadahanson','canadapooch',
  'canadianallianceofphysiotherapyregul','canadianclimateinstitute','canadianfiberoptics',
  'cancersupportcommunity','candide','candisolar','caninecraze','canyoncontracting','canyonhills',
  'cap','capcade','capegroupca','capitafinancialnetwork','capitollanguageservices','caplena',
  'capnz','caporegon','capricornholdings','capstonesolutions','carbon60','carboncure',
  'cardijncollege','cardinal','cardinaleducation','carebook','carecounseling','careertech',
  'carehousing','careoworld','carepay','carepros','caringacross','caringnetwork','caristo',
  'caritasau','carleycorp','carlsmed','carms','carolinasolarservices','carval','casadolcecasa',
  'casc','caseiq','caseys','cassini','castoredc','catalystcounseling','catchmaster','catconsult',
  'catface','catholiccharitiesdiocese','catulpa','cawh','caymanentcity','cb20','cbaytrust','cbcl',
  'cbi','cbtreatmentcenter','ccasantafe','ccawpa','cccnetwork','cccnip','ccegolfcars','ccem',
  'ccetompkins','cchihr','cchs','ccic','cciemployment','ccim','ccinc','cciottawa','ccmalta','ccncp',
  'ccocanada','ccosda','ccpa','ccsamerica','ccsao','cctc','cd','cdcw','cdcyukon','cdental','cdg',
  'cdispaces','cdpl','cdsi','cece','cedarstone','cedp','ceis','celearningsystems','cellulant',
  'celsius','celticchicago','cenfri','centerforcoalfieldjustice',
  'centerforlargelandscapeconservation','centerpoint','centracom','centralcalasthma',
  'centralchurch','centralchurchnyc','centralozarks','centralvalleyelectric',
  'centralwindowcleaning','centricmarketing','centro','centron','centurysolutionsgroup','ceporg',
  'ceras','cerbexa','cercanomanagement','ceresai','ceresproject','certex','certifiedangusbeef',
  'certifiinc','cet','cexio','cfci','cfe','cfef','cfgch','cfhd','cfltreatmentcenters','cfmni',
  'cfmt','cfpbmc','cfsconsulting','cfvc','cgcd','cgfag','cgibson','cgs','chainstack',
  'chalmerscenter','channelassistca','chantengineering','chapal','chapelpointe','characterstrong',
  'charadance','chargelab','chargy','charitonvalley','charlestoncollegiate',
  'charlottecentercitypartners','charmfertility','charter','charteroakhomecare','chasf','chci',
  'checkcenters','checkoffyourlist','chemcosystems','chemtek','chenbro','chereeberry',
  'cheryindustrial','chespenn','chfbc','chgroup','chi','chickaloon','childcareaware','childpeace',
  'childrensgym','chime','chimp','chinooktx','chnw','choicelunch','choiceptc','chowdeck',
  'christiancountylibrary','christianheritage','christianpost','christireece','chrysos','chugachts',
  'ci2','cialdnb','cicc','ciellos','cielorg','cifar','cigrovestx','cihadf','cilaschool','ciltd',
  'cim','cinc','cineflix','cinesitelondon','cinesitemontreal','cinesitevancouver','cira','circahr',
  'circlecardiovascularimaging','circleccdc','circledesk','circuit5','ciri','cirm','cisnwmi',
  'ciswo','citherapies','citizengo','citwa','citykidz','cityofbeavercreek','cityofhamilton',
  'cityofhorseshoebay','cityofjackson','cityoflakeport','cityofmarion','cityofrockport',
  'cityofstmarys','civicainfrastructure','civicus','civilians','civitascapital','cjairport','cjc',
  'clarity','claritycx','claritytech','clarkconstruct','clarkre','clarkwilsonllp','classicfls',
  'classifiedcycling','classtechnologies','clayclerk','cleaningconcierge','cleanriteri',
  'cleantekinc','clear','clearbridge','clearobject','clearspace','clearwaterconstructioninc',
  'clearwaygroup','cleio','clemonsmgmt','clevermethod','cleverprofits','clfns','clgs',
  'clhmentalhealth','clickandgrow','clickfunnels','climartis','climatech','climatefocus',
  'climatefundmanagers','climatepolicy','climatiqtech','climbingcentregroup','clincloud',
  'clinicaromero','clinicforspecialchildren','cliosnacks','clockwork','closedloop','closertohome',
  'cloudbrigade','cloudfirst','cloudheadgames','cloudhop','cloudland','cloudmargin','cloudsmith',
  'clovealliance','cludo','clvgroup','clward','cmciks','cmecorporation','cmgt','cmhaca','cmhahkpr',
  'cmhapeel','cmhawecb','cmis','cmlabs','cmsllc','cmtsllc','cnas','cnwr','coachem','coaf',
  'coastalclaims','cobizcpa','cobot','coc','cochraneco','codafication','codecool','codemettle',
  'codimitepvt','cofchurch','cognira','cognitivesystems','cognits','cogo','cohocollective',
  'coinmarketcap','cokerlegal','colden','colearn','collectiveacegmbh','collegehill',
  'collinsmachine','coloradolegalservices','colorsxstudios','comlinksolutions','comlux',
  'commercialpaintingco','commissionaires','commonhealthaction','commonjustice','commonpurpose',
  'commonscompany','commonsensenetworks','commonsku','commonwise','communityactionskagit',
  'communitybiblechurch','communitylifellc','communitylivingdufferin','communityoutreach',
  'communitytransitws','company','company119','compassdevco','compassionandchoices',
  'compasspathways','compgihealth','compinghr','completesol','compulsiongames','compuraymedical',
  'computerdataservices','concirrusltd','concord','concretetech','condley','condoauthorityontario',
  'conetec','conexiom','congerbuilt','connectchildcare','connectcpa','connectionsforfamilies',
  'connellypartners','connorconsulting','conrado','consensus','consensusinc','consol',
  'consolidated','constantine','constellaintelligence','constructdigital','constructivebio',
  'consultssda','consulum','contentguru','context1','contextglobal','contextlabs','contexture',
  'contfinco','continentalmanufacturing','contractexteriors','controlledenviro','convergenceisrael',
  'cookbrothersbars','cookingwithkids','coolchurch','coollaw','coople','copacino',
  'coppertreesolutions','coralbeachandtennisclub','core3','coregeomatics','coretransformers',
  'coreuk','coria','cornelisnetworks','cornelltechnicalservices','cornerstonefader',
  'cornerstonesupportservices','cornerstonevalley','corovets','corpcareservices','corpsnetwork',
  'cortina','coschedule','cosgravelaw','costofwisconsin','cotn','couch',
  'counciloneducationforpublichealth','counseling4kids','counterpoint','countrysidevetcare',
  'countyrescueservices','couriernewsroom','coutoconstruction','covechurchministries',
  'covenanttech','coveocean','covergenius','covertswarm','coviance','covu','coxecurry','coyoterock',
  'cpehn','cpjorg','cppi','cqfluency','cr2','crccsvic','crcfo','cre','createto','creativechurch',
  'creativemarketing','creativeresearchsolutions','creativespeechsolutions',
  'creatoraccountabilitynetwork','creatv','credentcare','creditbook','creditrepaircloud',
  'creditsystemsintl','cressetgroup','creweadvisors','crholdingslimited','crinsurance','criscpa',
  'crisisaction','criteriacorp','croftsystems','cronometer','cronoseuropa','cronoslabs',
  'crosscreeknursery','crosslcms','crossroadscharterschools','crossroadshealth','crossroadsmission',
  'crowebgk','crownautogroup','crtriangle','crystaltravel','csgeneticsltd','csidmc','csiltd',
  'csipacific','csjax','cssindustrial','csswashtenaw','csusai','ctgbrands','ctherm','cthumanities',
  'cti','ctiinc','ctmins','cubecare','cubelabs','culturalsurvival','cunninghamcontracts',
  'cureepilepsy','currenxie','curriegroup','curtinmaritime','cusointernational','customhomemedic',
  'custominterface','customsoftwaresystems','cutwel2','cuunderconstruction','cva','cvg','cvha',
  'cvims','cvnm','cvos','cvsc','cvssvets','cwcos','cwlt','cxfort','cyc','cydaptivsolutions',
  'cygcap','cylynt','cynwavesolutions','cyrc','cys','cysec','d1g1t','d2x','d3systems',
  'dagarchitects','dakcs','dakotacarrier','dakotawoodlands','dakwakada','dalee','dalstudentunion',
  'damstratechnology','danacole','danaid','dandgcompanies','danica','danielfraimanconstruction',
  'dappradar','darkslope','darrschackowinsurance','daso','data4','databox','datacoresystems',
  'datameer','datapelago','dataprophet','datascience','datavalet','dauphin','davidkohn',
  'davidnicebuilders','daviesallen','davismoore','dawnaerospace','dayoneintegrativeservices',
  'daytranslations','dbgroup','dcara','dcbel','dccollaborative','dciconsult','dcmol','dcs','ddcos',
  'deciphex','decisivedividenduni','deckwise','decode','deepisolation','deepsea','deepwindoffshore',
  'defiant','definitionchurch','degservices','dehamerlandscaping','delegatesolutions','delinebox',
  'delphidigital','delta40','deltagroup','deltasecurity','deltavinc','delvedc',
  'demariabuildingcompany','demersbeaulne','demetres','demmelearning','denizen','denova',
  'dentistadvisors','depaul','derevo','dermalogica','deserttech','designeradvantage','designlab',
  'designs','destinationbc','destinyrescue','detroitit','detroitparentnetwork',
  'developmentaloptions','devhd','deville','devnw','dfn','dfnetresearch','dga','dgi',
  'dharmannstudios','dhdc','dhjj','diagnostykadigitalhub','dicamlandscaping','dietzlerconstruction',
  'digco','digdeep','diginex','digitainsoftware','digitaldays','digitaled','digitalfrontiers',
  'digitalplanet','dijeauconstruction','dileonardo','diligentpharma','directaccessathome',
  'directagents','directcareresources','directom','discoursemedia','discoverafricagroup',
  'discoverylandco','discussio','displaydata','displaysweet','distillersr','diverseworkspdx',
  'dividedsky','divinityfamilyservices','dizolve','dmgblockchain','dnadesign','docaid','docsdiesel',
  'doctoranywhere','doctorshospital','dodsgroupltd','dogwoodalliance','dogwoodmedia','dohop',
  'dolinsgroup','domogroup','dontpaniclabs','dorepartnership','dorot','dotcms','doublemaviation',
  'douglasguardian','douglaspcs','doverco','doveschoolsoklahoma','doveschoolstulsa',
  'dovetailandinterlakes','dovevirtual','doyle','dps','dpworldvancouver','drainedge','drapercity',
  'drbarbarasturm','drclean','dreaam','dreamcenterevansville','dreamcorps','dreamhaven',
  'dreamprogram','dropgroup','dropsuite','drruscio','drugpolicy','druidhillscdc','dsqtechnology',
  'dssasia','dstaffing','dstllc','dteehf','dtpd','dtree','dualinventive','dubak','ducker','duco',
  'dunetechnology','duplo','duradigital','duxburybeach','duxtoncapital','dvmelite','dws','dxs',
  'dymin','dynamicconcepts','dywidag','e360','e3g','e7solutions','eaglebuilderslp','eaglequest',
  'eaie','eajservices','earlymedical','earthalivect','earthbalance','earthbound','earthcraft',
  'earthfreshatl','earthoptics','earthrightsinternational','earthshotprize','eastdilsecured',
  'eastlandfood','eastoaklandcollective','eastpointenergy','eastwestcenter','eastwestcollege',
  'ebiquity','ecallogy','ecglasshr','echotechnologies','eco','ecogra','ecokedu','ecologyproject',
  'ecomwise','econoler','ecosulis','ecotech','ectcharity','ectel','edenroc','edgeworks','edifyorg',
  'editshare','edpro','educationstrategyconsulting','efifoundation','efmpc','eggfarmersofcanada',
  'ehcc','eikenhout','eiminc','eisgroup','eiturbanmobility','ejscenter','ekohe','ekonapower',
  'eksobionics','elanorhotels','elaw','electropagesltd','electroroute','elementalenzymes',
  'elementalled','elementary','elementthree','elephas','eleventhhourgames','elfuturo','elicio',
  'elitecamps','elitedanceacademy','elitedigital','elitehomerehab','elitestaffingandconsulting',
  'elitetm','elkgroveparks','elmdenegroup','eltropy','elvh','embed','embers','emedgroup',
  'emeraldcloudlab','emergentclimate','emgacquisitions','emilanderson','emilyshope','emitknowledge',
  'emmanuelcommunitychurch','emoryday','empirepls','emporix','empoweredservices','emptor','ems',
  'emtd','emvs','enable','enablenetworks','enablingqapital','encepta','encircleapp',
  'encompasssupport','endace','endcitizensunited','endeavoursolutions','energiseenergy',
  'energyexemplar','energyroofingco','energyworldnet','energyx','enfinite','engage3','engagestar',
  'engageware','enghouse','enginedigital','enlightenoperationalexcellence','enlyft','enpowered',
  'enscharterschool','ensiteusa','ensurge','entratus','envhh','enviolo','environmentalleague',
  'envisioninggreen','envitia','eo','eoeveryone','eonhealth','eosaircraftinc','epicchq',
  'epicpharmacy','epperheimerinc','epsgroupinc','epsilonassociates','eptec','equalityfund',
  'equalrights','equantiis','equilliumbio','equiposoventix','equity','erdosmiller','ereztech',
  'ergosolutions','eriemutual','eriksen','erling','esglobalsolutions','eskasonischoolboard',
  'esoppartners','espositoconstruction','espositoelectric','espressive','essiejusticegroup','etax',
  'eteamsponsor','ethereum','ethicalpower','ethixbase360','ethos','ethoscare','ethoseng','etika',
  'etr','etsllc','eugenecascadescoast','eugenechamber','euna','europa','evalan','evangel',
  'evanshunt','evconstruction','eventconnect','eventmobi','eventsair','eventussystems',
  'everettsautoparts','evergreenefficiency','evergreenoutdoorcenter','everguard','everstake',
  'eversum','everydata','everydaymassive','everymanjack','everymarket','evidenceaction','evisions',
  'evoketechnologies','evolutionq','evolutionwellnessnc','evolve','evolvemkd','ewbinc','exa',
  'exceldriverservices','excelpropane','excelsiorwellness','exceptionalwellnesscounseling',
  'exclusivecleaning','executiveoption','exocelbio','exogroup','exostellar','expedock','expivia',
  'explorance','exportpackers','expreecu','expressiongames','extonsfoods','extracellular',
  'extrastaff','extremitycare','eystwales','ezypay','fabledata','facit','factorytechnologies','fai',
  'fairoakspark','faithcoenterprises','faithlife','fallriverelectric','familyark','familyfutures2',
  'familypromiseinc','familyreliefresources','familytransitionplace','fanbase','fapeinado',
  'farharoofing','fariscapital','faristeam','farmersstatebank','farmlandfoods',
  'farnsworthartmuseum','farotech','fastepp','fasthorseinc','fatiguescience','faxoutreach','fbcs',
  'fbtax','fcaa','fcchudson','fcds','fe','fedsoc','feisst','felicianservices','felix','felixforyou',
  'fellowapp','fems','fenetresconcept','fertifa','fesslerbowman','fevertree','ffbd',
  'ffcbfundingcorp','ffoxservices','fhtechnc','fibersmith','fido','fieldinstitute',
  'fightinequality','figure','figure1','filamentgames','fileinvite','finalstrikegames',
  'financeincorporated','finbourne','finceptiv','finchmaloney','fincoreltd','finitecarbon',
  'finnomena','finoragroup','finsana','finsolutia','finspec','fintechos','fireflynw',
  'fireflypartners','firmanirrigationandtreeservice','firmo','firrp','firstalliancechurch',
  'firstamendmentcoalition','firstcareservices','firstfederalcommunitybank','firstlightai',
  'firstnationscapital','fiscalfx','fishingpointhc','fispan','fittes','fitzmaurice','fivejars',
  'fivestones','fixposition','fl0','flagshipbio','flagstaffshelterservices','flashfood','flaviar',
  'flchealth','fleetalliance','flemingmedical','flextrade','flightschedulepro','flipany',
  'floomenergylaw','florenceeiseman','flourishventures','flutterwavego','flxpoint','flyingbark',
  'fmsaerospace','fnsb','foe','foho','fontisenergy','foodbanksmississauga','foodee','foodhero',
  'foodhub','foodpeople','foodrecoverynetwork','forcemanager','forecasthq','forefrontpower',
  'forensicaccess','formulafig','forsite','fortehealth','fortris','fortunatemedia','fortwhyte',
  'forvismazarssingapore','forwardcareers','fosfeminista','fossilfuelnpt','fotokite','fourgen',
  'fourinc','foxgroupcanada','foxlogistics','foxnspfra','fpchq','fpwa','frac','framecad',
  'fransenpittman','fraserco','fraserengineering','fraxion','fray','freakoutglobal','fredolivieri',
  'fredrogers','freedmanhealth','freedomchurchsc','freedomhomecarellc','freedomprep',
  'freemanlandscape','freepress','fremontbrewing','frequency','freschesolutions','freshstart',
  'freshtrackscanada','fresnelsoftware','freudigmanbillings','friendsofacadia',
  'friendsofbroomfield','friendsofruby','friendsofwaterfrontpark','friendswoodcc',
  'fringebenefitplans','frontieraerospaceaccount','frontiercfo','frontiercooperative',
  'frontierrailroad','frontierschools','frontlinecallcenter','frontlinevc','frontlogix','frost',
  'fryeartmuseum','fscpa','fsp','fsstechnologies','fstichem','fswe','ftkcs','ftoc','fudo','fuel',
  'fuelpositive','fulcrumairinc','fullbeaker','fullcircle','fullcircle1','fullersgroup',
  'fullsupportgroup','fundcount','fundsdlt','funnow','furniturerow','fusang','fusethree',
  'futurecarecorp','futureon','futuresbc','futuresforall','futureswithoutviolence','fvcdc',
  'fwdthink','fwslash','fxcollaborative','fxpro','fz','g2','g2cap','gabordesignbuild','gadellnet',
  'galaxygaming','galeassociates','galeckisearch','galenband','galtfoundation','galvion','gambyt',
  'gamelounge','gamemodeone','gangverk','ganintegrity','gardnerbuilders','gargle','garrtool',
  'gasketgames','gasproservices','gatewayepc','gatewaypublicschools','gatewayvet','gbdevco','gbl',
  'gblhr','gbsgroup','gbta','gcph','gcsjanitorial','gearsforbreakfast','geaugapublichealth',
  'geckogreen','geekbot','gemco','geminiams','gems','gemtec','generatecanada','generation',
  'genesisdigital','genesiselectrical','genomecanada','genpride','genserenergy','gentrack',
  'geoscan','geospectrum','gerhart','geta','getjusto','getrepowered','getzhealthcare','gf55',
  'gfainc','gfef','gfgholdings','ggreeneconstruction','ggtworldwise','ghgsat','ghid','giagy',
  'giatecscientific','gibraltar','gifted','gigastar','gilbert','gilbertcentre','gillespies',
  'girlscoutsosw','girlsincofchicago','girlsincofsantafe','git','gitkraken','givecloud','gk',
  'gladinc','gladstone','glas','glassborochilddevelopmentcenters','glasscanvas','glassesusa',
  'glavinsured','gleim','glenarbour','glendimplexau','glm','globalcitizen','globalenergymonitor',
  'globalfundforwomen','globalinitiative','globalland','globalprairie','globaltel',
  'globalwatercenter','glopal','glovergroupltd','glowacademy','glucode','gmci','gmfsteel','gmgi',
  'gminingventures','gnbac','gnwkcf','goasg','gobiquityinc','gocavs','goctc','godbyhpe','gofly365',
  'goforhr','gogebicmedical','goglobal','gohighlevel','goldbugtrial','goldenhills','goldenstate',
  'goldenstatecider','goldenstatetriad','goldstandard','gomedstar','goodwell','goodwillready',
  'goodwilltnva','gorilla76','gorillatech','gosaas','goservpro','gospooky','gotouche',
  'gotrminnesota','gpmena','graberpost','gracefellowship','gracefellowshipchurch','gradient',
  'grafixarts','grainchain','grainpro','gralpharchitect','granitereit','grapecityindia','graphem',
  'graphiant','graphitedigital','graphwise','grassrootsinternational','gravyty','grcompany',
  'greatamericanmediaservices','greatario','greaterminnesota','greatwhitenorth','greenco',
  'greenempowerment','greenhousecomms','greenlakecountyus','greenlatinos','greenlifeenergy',
  'greenlightworldwide','greenparkcontent','greenpeaceorg','greenschool','greensolarsystems',
  'greenspacerecycling','greenspoonsales','greentomatomedialimited','greenview','gregoryfca',
  'gregslawn','grey','greybrook','greyeaglepork','greystoneconstruction','grhsmo1','grid4',
  'gridbeyond','gridedge','gridgain','gridx','griffith','grounded','groundworkusa','group161',
  'groupegibault','growingkidslearningcenter','growingroomcdc','groworxglobal','growpath',
  'growpublicschools','growthleads','grpride','gruberlaw','grubstreet','grubtech','grunenthal',
  'grupoantolin','gs1nz','gsba','gsbusinesscommunications','gsdngo','gsengineering','gsolegal',
  'gssi','gsvam','gta','guardhouse','gudel','guelphchc','guesthouse','gungho','gupta','gurustudio',
  'gvhs','gvi','gvl','gvrd','gwek','gwinc','gworks','gwp','gwpsanpc','gxpcc','gympluscoffee','h2',
  'haasf1team','hacademy','haccnet','hagerman','hailsolve','hakluyt','halfmoon','halifaxfanusa',
  'halo','haloprime','hambletonhandyman','hamilton','hamiltonbrown','hammondengineers',
  'hamptonroads','hamptonroadscommunity','hanzo','happyfinish','harambee',
  'harbordesignsmanufacturing','hardwirellc','hardycorp','hardyserv','harmonicfundservices',
  'harpergc','harperrainsknight','harrisgroupcpa','harvestusa','haslams','hatalom','haugimp',
  'haven','haverfordtownship','haviland','hayessolicitors','haymonhomes','hazendalwineestate',
  'hcahamilton','hcchospital','hdsilga','headspin','headway','healthandcommerce','healthcaringkw',
  'healthcoga','healthpreneur','healthresearchbc','healthwaregroup','heanet','heartlandcounseling',
  'heartstrings','hedgepointglobal','heightslife','heimdalsecurity','heirloom','heirloomproperty',
  'heliosenergia','helixkc','hellochef','helloflynn','helloproducts','hellskitchen','helmes',
  'helmsandsons','helpcloud','hematologics','herbalgoodness','heritagehealthservices','heritageis',
  'hetheringtongroup','hexens','hhendy','hhnw','hhofet','hickenair','hicksmanufacturing',
  'highstreet','highwaybaas','hilite','hillrobinson','hillsidefellowship','hillsonguk',
  'hiphopcaucus','hireops','historicnewengland','hitstrat','hiveway','hivos','hkm','hla','hlc',
  'hlunitedway','hmarkets','hmr','hnmc','hochiki','hocsinc','hoffmanagency','hokanson',
  'holtbrothersinc','homefirstservices','homerule','homesforgood','hoovershatchery','hopecm',
  'hopecommunityservices','hopefarm','hopeofeastcentralillinois','horticulturenz',
  'hospicecarepartnersusa','hospiceofredmond','hotelbethlehem','hotelco51','hotosm','houlak',
  'houlihancapital','housebuyersofamerica','housingassistance','housingcalifornia',
  'houstonlandscapesetc','hrblis','hrdc','hrfh','hrmidwest','hrnetrefer','hrsynergyllc','hshihc',
  'hsnri','hssv','hsvarc','htminsurance','htmniseko','htoemp','hualapai','hubtechnologysolutions',
  'hubtel','humanafterall','humane','humanevet','humanexventures','humanityfinancial','humanyze',
  'humecenter','hummingbirdresources','hunchads','hungerfordproperties','huntelectric',
  'hunterhealth','hutchcc','hutchpaving','hwcm','hycu','hyperlayer','hypernative','i3pd','iar',
  'iasb','ibabel','ibc','ibs','ibsco','iccbpo','icct','icdrilling','icibuilds','icic','icolohr',
  'iconcreative','icron','ictcctic','idbank','ideallivingmanagement','identityfusion','idex',
  'idfive','idfusion','idiguam','idnerd','idplans1','ie2construction','ieefa','ifesworld','ifpim',
  'igamingidol','igamingplatform','igcc','igg','ignitepositivechanges','igopeople','ihbs','iipay',
  'iisd','ikamper','ikeja','ilgpa','illuminatefinancial','illumynt','ilsc','imagecarecenters',
  'imageengine','imagineenglewoodif','imaginellc','imbank','imhotepcharter','imi','imk','immiland',
  'impactcap','impactcs','impactenv','impalastudios','imrg2000','inclusioncayman','inco',
  'incomdirect','indicalab','indiegraf','indigenousclimateaction','indigoconsulting','indinero',
  'indrarenewabletechnologies','industriallouvers','inetco','infiniteglobal','infiniteviewsllc',
  'inflowhi','infrafly','infravision','infrrd','ingenious','ingeniumschools','ingenuitydesign',
  'ingletonwood','ingotbrokers','inheritingearth','initiate','inlumi','innercityweightlifting',
  'innovahealth','innovateatlanta','innovationhighschool','innovations','innovativeautomation',
  'innovex','innovobenefits','innovu','innpower','insightsoftmax','insighttimer','insomnialabs',
  'inspera','inspirefoundation','instadeep','insticator','instructionalcoaching','insuco',
  'insurancecaredirect','insurancemarket','insurancetechnologyservices','intec','intechopen',
  'integratedwaterservices','integrity360','intel471','intellecteu','intellihartx','intelmatix',
  'interadcorp','interiorhealthalaska','internetalchemy','internetsociety','interplay',
  'interprenet','interworkscloud','intouchinsight','intragen','intrinsicdigital','introhive',
  'intuitech','intuitsolutions','intuji','inuitcircumpolar','invendagroup','inventprise',
  'investmentadviser','investorcom','investottawabayviewyards','investure','involvedgroup','inxile',
  'iodigi','iodparc','iommediaventures','iontra','iownit','ipd','ipeople','ipinfo','ipme','iqgeo',
  'iraclub','ircp','irgra','iridium','irishtitan','irisworldwide','ironbridge',
  'ironsideinsurancegroup','irtn','irvinepartners','isacybersecurity','isbusan','iserv','isl',
  'islandinstitute','islandwood','isoutsource','israaid','issgh','issueonereform','isth','it360',
  'it8','itabo','itadltd','itassolutions','itavg','itcap','itproactive','itps','itsolutionsco',
  'ittf','itworks','iugo','ivycharge','ivyfarm','iworq','iwpr','iyield','j2solutionsinc',
  'jacksonthornton','jackspoint','jajafinance','jam','jamboree','jammiesenvironmental','jarrold',
  'jarvis','jaspa','javavino','jbconsulting','jbenton','jbssolutions','jcaero','jccscpa','jcescvla',
  'jconnelly','jctind','jeffcolib','jeffersonrise','jema','jemgroup','jemhr','jetdirectmortgage',
  'jetfly','jewettcameron','jfcspgh','jfedstl','jfklaw','jfknto','jgmusa','jhlconstructors',
  'jhstbay','jiko','jimdent','jmanuel','jmanuellille','jmanuelparis','jmaportal','jmcope',
  'jmelectronicengineering','jmsequipment','jnl','jobandtalent','jobbatical',
  'jobswithjusticesanfrancisco','jobzonedemploi','jodymiller','johnmcneilstudio','johnmini',
  'johnsonsriverside','johnwallisacademy','joinpdx','jokake','joliethospice','jonesanddemille',
  'jonesmandel','jordanpark','jorsek','josephjacobjewelers','journeycapital','joycefoundation',
  'joymo','jpiifoundation','jpisolutions','jpr','jrandco','jrbarger','jsheld','jstreet','jubileefc',
  'judicialco','juicekeys','juliansanderslaw','junipercreates','justicedemocrats','justicelawcorp',
  'justicenorth','justmystyle','justo','jwv','kac','kadince','kairoscanada','kalambagames',
  'kalcodrywall','kami','kandou','kanrad','karamfoundation','kartchner','kashainc','kaskocattle',
  'katanox','kathairos','katzie','kawacapitalmanagement','kawanti','kaybenlandscaping',
  'kaydongroup','kbebuilding','kbfmagiccabinet','kbra','kcconline','kcglobalmedia',
  'kciconstruction','kcrcommunity','kearneygroup','keeldigital','keepersadvisory','keepit',
  'keishenv','kellerassociates','kelleyuustal','kenora','kentohealth','kepler1','keptpro',
  'kermitppi','kettering','keway','keymediahr','keyrussa','keystonerailrecovery','kff','kfmed',
  'kicksite','kidneymn','kidsu','kierwright','kiln','kimoby','kinbro','kineticedgept',
  'kingandqueenco','kings','kingscott','kingsleymontessori','kingstonist','kingsway',
  'kinposselected','kinsley','kiosoft','kirkegaard','kirkmarket','kirkpatrickprice','kitchenmag',
  'kiverdi','kkday','klar','kleankanteen','kleocommunitylifecenter','klsearthworks','kmahealthva',
  'kmedigital','kmicro','knak','knappett','kneat','knickerbockergroup','knkx','knockinginc',
  'knovalearning','knoxtoronto','koala','kobalt','kodem','koehnpainting','kogerhomecare',
  'kohlfelddistributing','kohort','kohr','kolkfarms','kolmeo','konfio','korem','korowai','korte',
  'korumlegal','kotahi','koydol','kpmcpa','kraunelectric','krausebrokerageservices','krazy','kredi',
  'krfr','krmdev','kruxanalytics','kryptonfs','krysglobal','kslcapital','ktf','kubermatic',
  'kurtosys','kuttatech','kuunda','kvg','kvp','kyra','kytn','l2cyber','laamistadinc','laborie',
  'labx','lacahsa','laesf','laivly','lakegregory','lakesidefire','lambertandassociates',
  'lambtonkent','lami','lanciaconsult','landisllc','landmarksolutions','landr','lanesgroup',
  'languagebird','lano','lansdaleborough','lanubiaconsult','laprairie','laprc','lapromisefund',
  'laramieairport','larcheerie','larvol','lasbest','lasroc','lastresortrecovery','lastwall','later',
  'launchglobal','laurentisenergy','lautenbachrecycling','lavanda','lawfoundationbc',
  'lawnandpestsolutions','lawny','lawpath','lawrenceburg','lawsocietyie','lawsonlundell','lawvu',
  'lba','lbmx','lbphd','lcmo','lcr','lcslab','lct','lda','ldsafetymarking','leaco','leadexsystems',
  'leaf','leanpath','leap29','leapca','leapfrog','leapsquare','learnd','learningforward',
  'learnlife','leedsalabama','leemontessori','leetrans','leevin','legacybuildingsolutions','legato',
  'legendboats','leighenterprises','lekoil','lemonedge','lemonio','lemonskystudios','lencorex',
  'lendesk','lenhartmason','leparvet','lethbridgepolice','lettusgrow','levanders','level9virtual',
  'levellegal','lgbtfunders','lgmeats','lhcmt','lieberman','lifeenhancement','lifeinsight',
  'lifelenstechnologies','lifelenz','lifemi','lifepushllc','lifesitenews','lifestraw','lifewave',
  'liftcommunityservices','liftinteractive','ligadata','lightasinglecandle','lighthouse',
  'lighthouseelectric','lighthousetechio','lightshipsec','limelightconsulting','limelightmarketing',
  'lindsayconstruction','linearit','linkfire','linkupteletherapy','linkusawi','lisbongroup',
  'lisleparkdistrict','listentech','liveforlifeutah','liveglam','livepayments','livespot360',
  'livwellchs','lklp','lmaweb','lminternational','lmpgroup','lmrtechnicalgroup','lnsresearch',
  'loancouk','locafy','locationcollective','loftwork','logansimpson','logelhomes','logmet',
  'logpoint','loka','lolared','londonsquare','lonsec','loopbackanalytics','looperinsights',
  'lootrentals','lorennancke','lorisystems','lottiefiles','lotuswater','lovascogroup',
  'lovelandexcavating','lowerstreet','loweswholesale','lpfas','lt','ltlgroup','lucastree',
  'lucidlink','luckysaint','luckyspot','lucyd','ludicrum','luf','lukka','lumency','luminarybakery',
  'luminate','luminus','luna','lunacon','lunaroutpost','lupl','lushomo','luvbridal','luxaviation',
  'luxeparkingmanagement','lvt','lwcc','lxt','lyon','lyonspaint','lyric','lyssna','m2dot','m3dm',
  'm5utilities','maamwesying','mabeyhire','macbracey','macc','macdonaldshhc','macrobond',
  'madebysway','madeincookware','maestrotech','magmalabs','magnapower','magnetic','magnoliamedical',
  'magnumphotos','mailchannels','maineconservationvoters','mainframe','mainstreamrp','maintair',
  'maishameds','makeship','makola','makorecruiting','maksystem','malalafund','malcolmdrilling',
  'malingroup','malonesolutions','maltorg','mammothtv','manahan','manaosoftware','mangaroafarms',
  'mangomaterials','mangrovelithium','mann','mantrafitness','mapa','mapbrewing','mapservices',
  'maracalearning','marant','marblehead','marcopololearning','mare','marianaoncology','marinedrive',
  'marinelife','marinopr','marioncountyclerk','mariostowing','maritimehelicopters',
  'marketingessentials','markstein','maropost','marqueebrands','marquettemi','marqvision',
  'marshallutilities','marshallwhite','marss','martello','martinconcrete','marvelmarketers',
  'masalto','masonamerica','masonkorea','massago','massdevelopment','masterscapes','masv',
  'materialexchange','matiss','matpelbuilders','matter','matthew25','mattr','maverickeng',
  'mavericksoftware','maxa','maxbetonline','maxcarehrs','maxion','maxxis','mbcparksrec','mbdaus',
  'mbdesign','mbfoundation','mboone','mcbcorp','mccallumrock','mccinc','mcfa','mcfcs','mcfn',
  'mcgregoreba','mchcwi','mckinleyadvisors','mcleanschool','mcontracting','mcprep','mcss',
  'mcsteelnorth','mdanalytics','mdif1','mdn','mdotm','meadowbrookchurch','meadowridgeschool',
  'mealticket','measurabl','meatable','meatymeats','mec','mechanicalsolutions','meda',
  'medallionbank','medasf','medcommsexperts','medelite','medenterprises','mediadesign','medialab',
  'medirect','mednet','mednetworkak','medstarambulance','medsurvey','meedan','megaphone',
  'megazebragmbh','memiah','meniga','menlo','meq','merakicreativegroup','merakihealth',
  'merciaassetmanagement','mercuryfilmworks','mercuryo','mercyurgentcare','mergon','meridianllc',
  'merrick','mesh','messagepoint','messengeravl','metacompliance','metalenz','metalquest',
  'metricmindsgmbh','metricstrategies','metrogolf','metromechanical','metronews','metrooneservices',
  'metroplanning','metroservicegroup','metrowestnutrition','meyerspetcare','meyocks','meysen','mfd',
  'mfgsci','mgbeveragesystems','mgnevents','mhfnz','mhiuk','miadvocacy','michaelsenergy','michif',
  'michiganlabs','microharvest','micrometrics','microvellum','midcoast','midminnesotaentertainment',
  'midsuncassociation','midwestrailcarrepair','miedema','mighty','mii','miinto','mikisewgroup',
  'milbarhydrotest','milestable','milestonehealthpartners','millscnc','milrem','milyli',
  'mindbridge','mindfullifeproject','mindgrub','mindsightbehavioral','minneolahealth','miquido',
  'miraclefeet','miraterra','miscs','miseenplace','missionagency','missionaz','missioneast',
  'missiongroup','mitacs','mitchellwhale','mitto','mjdau','mjolnirsecurity','mkbholdings',
  'mlacanada','mmcaa','mmfa','mmg','mndiscoverycenter','mobilizegreen','mocanyc','modernautobody',
  'modo','modoccontracting','moises','moldeddimensions','molecularyou','monarchcabinetry',
  'monarchfamilyservices','mondaycreativeinc','monge','montanainternet','montanalegalservices',
  'montanapartyrentals','montanasupplyco','montclairhospitality','montrose','montroseholdings',
  'montway','moonsailnorth','moontideagency','mordencollege','morganindustries','morleybuilders',
  'morlocknoren','morpc','morrisassociates','morrisonexpress','morrisonshearer','mortongroveparks',
  'mosaicbc','mosaichr','moscadesign','mosers','most','mothershipcoffee','motorsandcontrols',
  'motorsport','mountainhumane','mountainland','mounthorebchristian','movaci','moveplangroup',
  'mpatime','mpsbaltic','mptcs','mrbway','mrelief','mrghr','mrjohnpit','mrsassociates','ms3','msc',
  'msf','msfltd','msfsa','mslogisticsltd','mspbots','msrs','msu','msvotes','mtlebanon','mtmdesign',
  'mtsa','mtwyouth','muddycreek','muensterhospital','mulilo','muros','murphybrosdesign','murrayco',
  'mustardseedca','mutualone','muwa','mvaz','mvcredit','mvmhr','mwmech','mwss','mybambu','myccu',
  'mydrcu','myeloidtherapeutics','myersbillion','myhcd','myhopeair','mylogically','mymoria',
  'mynorthside','mypatientspace1','mypicture','myrvla','mytbas','mythicalaccount','mytlc','nacca',
  'nadc','naeh','naisiouxfalls','naitsa','nalhd','naminh','nanomosaic','nanushka','napervillepl',
  'narrativestrategies','nathab','nationalbank','nationaldelivery','nationaledu','nativeforward',
  'nativegov','nativeproject','nativeunion','natronacountylibrary','naturaldes','navconsulting',
  'navinurses','navipartner','navitas','nayakcorp','nbn','nca','ncaz','ncfire','nciins','ncns',
  'ncose','ncuk','ncwlibraries','ndcam','ndp','neareast','nearmap','neboces','necsda','nectar',
  'neighborhoodsun','nelp','nemely','neofonie','neoimmunetech','neptunelines','nequinoxstudios',
  'nerdware','neservices','nesst','nestcoin','netadmins','netbeez','netcenter','netcraft',
  'netdigix','netint','netsweeper','netvendor','neuanalytics','newbirthoffreedom',
  'newchildrensmuseum','newcityus','newcomienzos','newelhealth','newfts','newhopecorps','newicon',
  'newkd','newlandmke','newlifepainting','newlondonarchitecture','newmans','newmomsinc','newpath',
  'newroadstreatment','newsmatics','newtopia','newvisionhealth','newzoo','nexforduniversity',
  'neximhealthcare','nexjhealth','nextenvironmental','nextgenamerica','nexusinno','nfb',
  'nftcouncil','ngaiteranginz','nhainc','nhc247','nheincteam','nhtinc','niceshops','nicindustries',
  'nicklpass','nideckergroup','nilus','nimbleactivewear','nimbusconsulting','nimonik','ninjatrader',
  'ninthplanetbev','nitha','niyamit','niyel','njhrc','nkarchitects','nkpr','nksfb','nmflb','nnapf',
  'noanet','noblerot','noelasmar','noema','nofraud','nomecc','nonviolentpeaceforce','noones',
  'nopecinfo','nordersupply','norson','northbayindigenous','northbrooklib','northcentralelectric',
  'northeastvolleyballclub','northern','northernlightsvet','northstar','northwindgrp',
  'northwindtechnicalservic','nosp','nourish','nourishinghopechi','novasphere','novatecheng','nove',
  'novelmicrodevices','novumbank','nowcircular','nowports','nozebra','npe','npfc','npffpn','nprc',
  'nptandcrc','nrs','nsifoods','nslegalaid','nssra','ntara','nti','nubimetrics','nureva',
  'nursenextdoor','nursiecosmeticsbeauty','nurturaveda','nutrigreentulsa','nutriquest','nvision',
  'nvva','nwaccessfund','nwaea','nwave','nwbt','nwch','nwcpud','nwgb','nwpd','nwra','nycavp',
  'nylontechnology','nymbus','nymcard','nymi','nyobolt','nysefc','nystromelectric','o180','oaciq',
  'oaec','oag','oakbrookpark','oakmi','obyteshr','ocasa','occboyscouts','occrp','oceansidecove',
  'oconnormortuary','oct','octaviacarbon','ocuco','odkmedia','odonata','officeprinciples',
  'officernd','offstreet','ofntsc','ohioambulance','ohiosportsacademy','oicdtpac','oicr',
  'okaloosatax','okarthritis','okaymedia','olddominiongroup','olivebranch','oliversolutions',
  'olparks','olsonsteel','omeat','omnibridgeway','omnigroup','omnimed','omnitechnologies',
  'omnitherapeutics','one','oneacadiana','onebeyond','onecomm','onedesignco','onefinestay','oneil',
  'onejustice','oneplanai','onestoppoolpros','oneteamonedream','onetechcapital','onetreeplanted',
  'oneviewhealthcare','onferope','onindia','onlea','onramplab','onsharp','onsiteconstructionllc',
  'onsiteenergyinc','ontariohospitalassociation','ontheclock','onthemoney','ontinue','onwa',
  'onwardsearch','ooma','oomphinc','ooni','opalfoodandbody','opecmd','opench','opencosmos',
  'opendoorexperience','opendorse','openenglish','openfieldx','openjawtech','openmindt',
  'openspaceforartsandcommunity','openstay','operaphiladelphia','operative','operatorsunlimited',
  'oppl','opportunityknocksnow','optimalnetworks','optimalworkshop','optimerainc','optiom',
  'optionsit','opus3artists','opuscoffee','orag','orangeinvestments','orangeloops','orangeskyau',
  'orases','orbitapps','orcid','ordergroup','oregonhospitals','origamirehab','origina',
  'origindigital','ork','orphalan','orw','osborn','osbornbarrparamore','osirisgroup','otcflow',
  'other','ott','ottawakent','ottawasenators','otus','ounalashka','ourhouseshelter','outfittersint',
  'outlierventures','outreachworks','outsurance','outyouth','ovclawyermarketing','ove',
  'oversightboard','overstory','overwatchimaging','ovou','ovphealthcare','owi','ownsolutions',
  'oxbow','oxfordbiotherapeutics','oxipitalai','oxya','ozarkopp','oze','ozoneproject','p31','p38',
  'p3group','pachamamacoffee','pacific','pacificmentalhealth','pacrimmarketing','pactfi','paga',
  'paginemediche','paizo','pal','paladininc','paleycenter','palisadepest',
  'palmettoyachtmanagement1','pandagm','pandpglass','panmure','panteleon','paq','paradigmae',
  'paralympic','parametricsmedical','parealtors','parentingplace','parkinsurance','parkview',
  'parkvwchurch','parsectechnologies','parser','parttimecfo','pasedfoundation','passbolt','passion',
  'patchstack','pateam','pathcrisis','pathways','patspastured','pauktuutit',
  'paulbunyancommunications','paulrobeson','pave','pawilds','pay','payara','paybyphone','payfacto',
  'payrange','paytabs','payzli','pbhha','pbsengineers','pcateam','pccharter','pchs','pcm',
  'pcsglobal','pctelincorp','pdms','pdp','pdrcpa','pdrvirginia','peak','peakgroup','peakinitiative',
  'peariverelectric','pearldairy','pearlmeyer','peatix','pebc','pechangatribalgovernment','peddle',
  'peekvision','peelenv','pegllc','pelion','pemcco','pen','pencil','pencor','pendletonsolutions',
  'penfoldstime','peninsulacleanenergy','penningtonparkchurch','people','peopleglobalpraxis',
  'peoplelovingnashville','peoplesaction','peoplesclinic','peoplesolutions','peoplevisor',
  'perfectpallets','performancesolutions','peridotgroup','perimetermed','persimmony','pestx',
  'peterstownship','petwow','pexapark','pfscm','pgl','ph2','phantomspace','phase3mc','phe',
  'phigenics','philadelphiaballet','phillipj','phippsconservatory','phoenixhealthcare',
  'phoenixlaser','photofax','piano','picateam','pickit','pictures','piedmontlube','pierpont',
  'piletilevi','pinehavenfarm','pinkcallers','pinnacle','pinnaclestaffing','pinteam','pinteamgmbh',
  'pioneeraerosupply','pioneergen','piranhanightclub','pitchpointsolutions','pivotalfuture',
  'pivothr','piwapan','piworks','pixeltoysltd','pizzadelicious','pjhm','plainfieldchristianchurch',
  'plainstowing','planitmars','plank','plantwithpurpose','platinumpreowned','playnorth','plextrac',
  'pliant','plugandplaytechcenter','plusonerobotics','plymouthdistrictlibrary','pmacanada','pmat',
  'pmgintelligence','pminternational','pmiworldwide','pmsi','pndengineers1','pneco','pnecycle',
  'poainternet','poc','pocketpills','podimetrics','pointeadvisory','polaramp','polestaream',
  'policingequity','pollination','polyunity','pomelogroup','pontosense','poopourri','populusgroup',
  'portagecybertech','portlandgirl','portlandinternetworks','portofmorrow','portofskagit',
  'portsmouthva','portwest','positiveintelligence','positrace','possolutions','postedcompanies',
  'potentialproject','pottermore','power4pilates','powercalifornia','powermonitors','powerplay',
  'powervision','ppsriverregion','pra','pracedo','praekelt','praxisinstitute','prcc','prci','prco',
  'preciseley','precisiondev','precisionnutrition','precizionpartners','preface','pregnancyjustice',
  'premiere','premiermarketing','premierservice','pressentergroup','pressurekleen','preti',
  'preventionworks','preventx','prex','prezi','pria','priceindustrial','primaryfreight',
  'primeproperty','principal1','principleone','printerlogic','priorityonepayroll','prismfly',
  'prismmaritime','privateai','privatelabelstaff','proavsolutions','proavsolutionsqld','probi',
  'procarehm','proctorandstevenson','productops','profast','profitandgrowth','profitero',
  'profoundtreatment','progresif','progressmfg','progresso','prohns','projectable','projectbread',
  'promed','prominentedge','promise686','properstar','propertyme','propharmausa','proscia',
  'prospect','prospection','prospera','protectgroup','proteinsources','proteq','protocase',
  'provectus','provectusalgae','provideinc','provincialcu','provoc','provoke','proximity',
  'proximitydesigns','prpl','prtc','psasystems','psbhq','psignite','psrassociates','pssmsi',
  'psychologyspecialistsofmaine','ptac','ptla','ptpla','publictrustadvisors','pughcpas',
  'pulsemedica','punchcut','puregrenada','purelogicit','pushsecurity','pyramidtransport',
  'q3restaurantgroup','qalipu','qcairport','qcatalyst','qehome','qms','qoyod','qs','qtcinc','qtu',
  'qualitytempstaffing','qualityworksconsulting','quandri','quantanite','quantifi','quantinium',
  'quantumbrilliance','quantumclinic','quantumdice','quantumspace','questel','quintuscorporation',
  'quotewerks','qvt','r2net','rabbies','racc','racerocks','radcliffe','radianaerospace',
  'radiancemedspa','radiantvs','raenest','rafn','rahf','rahr','rainbowvillage','rainierscholars',
  'ralcoelectric','rallynet','ralmax','ralphmoyle','randomstudio','rangeforce','ranovus','raona',
  'rapaport','rapidratings','ravalli','ravenadvisory','raybourn','rayelectric','razor',
  'razoredgesystems','rba','rbotechnology','rccp','rcdrv','rchpahc','rcmississauga','rcmtransport',
  'rcpconstruction','rcsinc','rct','rdcnc','rdmlawyers','reachfortomorrow','reachmobi','reachu',
  'ready5restoration','readyedu','readymode','realeyes','reasonone','reataeandmw','rebcsc',
  'rebeccakitsonlaw','rebuy','receptionhouse','recognisebank','recollective','recordpoint',
  'redbarrels','redcaffeine','redcirclelodge','redcom','redefiners','redemptionplus','redflag',
  'redlodgejobs','redmondconstruction','redpointmedia','redrover','reductioninmotion','redwinghra',
  'refractionpoint','refractoryservice','refugeesinternational','regionalgroup','rei','relaxgaming',
  'relayr','reliablemn','reliato','relicentertainment','remixtx','remoteli','remotepartneraccount',
  'renewableresourcesgroup','renewbeauty','renewcares','renocavanaugh','reorbit','reospartners',
  'resaroai','researchsol','researchtrianglehighschool','resilienttoday','resman',
  'resolvetosavelives','resourcegeneration','responselabs','restlessdevelopment',
  'restoreoaklandinc','resurgo','retinaconsultantssandiego','retiresmart','reubensbrews',
  'revantage','revantageasia','revau','revium','revolgy','revoltbi','rewind','rewire',
  'reynoldsrestorationservices','rgbarry','rgroupla','rhinolabs','rhinox','rhstrategic','ri','rica',
  'ricepsychology','richmondvona','richtech','ricketyroo','rickhansenfoundation','ridango',
  'ridgeandvalley','rightbrainnetworks','rightlane','rightsline','ripplecompanies','ripplefiber',
  'risecpa','risevest','risilience','riveancapital','riverkeeper','riversedgeadvisors','rize',
  'rjcapital','rjkielty','rlb','rlg','rmautogroup','rmgcllc','rmhcbayarea','rms','robertslack',
  'robinsontech','robo','rock','rocketmedia','rockinrudys','rockportnetworks','rockride','rockys',
  'roclub','rocrents','rogii','rolla','rollee','ronbouchard','ronhoover','ronmor','roofingcompany',
  'roomtogrow','rooof','rootedwi','ropelpaso','rosadogroup','rosanopartners','rosecityrollers',
  'rosenthalproperties','roulant','rouyapr','rovd','rowecasaorganics','royalroofinginc','royercorp',
  'rpmautocenter','rpmglobal','rr46','rracapital','rrgs','rsecoop','rsllhr','rslogistics',
  'rt7digital','rtccom','rtfnetwork','ruddresources','ruffwear','rumbleup','rumpl',
  'runwithitsynthetics','russellmcveagh','rustcompanycpa','rustyparrotlodge','ruthmiskintraining',
  'rvbs','rwaengineering','ryangootee','s4','saaia','saalt','sac','sacredsociety','safeharborsc',
  'safenetwork','safetrust','safetychain','safransed','sagamokanishnawbek','sagesse','sai360',
  'salalsvsc','salinahealth','salinapublic','saltandsmoke','saltchurch','saltmine','salzmannhughes',
  'samaritanlancaster','samesunbanff','samnutrition','samsters','samu','sanavida','sandbox',
  'sandler','sandylane','sankuphc','sans','sapi','sarssm','sasso','sastairs','satellogic',
  'satorihealthca','saucecommunications','savanta','save','savetheredwoods','savethesound',
  'savinggracepreschool','savvymoney','sawdaysandcanopyandstars','sawtoothsoftware','sbcfs',
  'sbdautomotive','sbquantum','sbr','sbw','sc811','scaffolding','scalepad','scancom',
  'scarsellabros','scbc','scbuildersinc','scccl','sccm','sccommunityloanfund','scgreencharter',
  'scharheating','scicominfrastructureservices','sciris','sciteam','sconstruction','scorpiogroup',
  'scottytechnologies','scppa','scs','scudamores','sdaihc','sdfair','sdgcounties','seabrooknh',
  'seadream','seakeeper','sealandbuildinggroup','sealeharris','seaoatsgroup','searchandgather',
  'searchlight','searchstax','seasideplumbing','seattlefoodtech','sebastiancorp','seccl','secdev',
  'secnewgateuk','secondmind','seconduse','section6','securelending','securis','securitize',
  'securitymetrics','securitypal','securonix','sedarotech','seealliance','seechange','seekonk',
  'seismicsquirrel','seiulocal521','seiuusww','sekcap','sekon','selectorsoftware','semaphore',
  'seminal','sempac','sempltd','seniorhomehelp','seniorlawcenter','seniorpsych','sensestreet',
  'sensorup','senstar','seochc','seoplus','seqserv','sequence','sequencebio',
  'serasanadrippingsprings','serasanakaty','serasanasw','serolife','servicetec','servicethread',
  'sesnet','sestek','sfcb','sfo','sg','sgcompany','sgi','sgservices','shadowfax','shaferbros',
  'shankmanandassociates','sharedhope','sharedvaluesolutions','sharesies','sharetown','shareword',
  'sharphueinc','shawscott','sheplersferry','sherocommerce','sherpa','sherpadesign',
  'sherrillpestcontrol','shg','shibumi','shifttransit','shimanoaustralia','shinebrightcare',
  'shiner','shiningstarpcs','shipex','shipshewana','shondaland','shopback','shopgate','shorthand',
  'showcasedancestudio','showpass','sidefx','sidekickhealth','sidwater','sifft','signal1',
  'signsandlinesbystretch','siliconranch','silkcommerce','silverhill','silvericing',
  'silverliningaba','silverlogic','silverstar','silverstripe','simetrik','simpligov',
  'simpsonhousingservices','singhal','singlesourcesystems','singleton','siouxmanufacturing',
  'siprocal','sirestoration','sirex','siro','sistemaaccount','sixthman','sjs','skift','skillcast',
  'skilledtradesofwestalabama','skillfield','skillsusatexas','skilresourcecenter','skinmds',
  'skispainting','skuuudle','skybound','skydweller','skydwellerus','skyfire','skylineeducation',
  'skylum','slicelabs','slintegrated','slite','smardt','smartacre','smartbox','smartfrogandcanary',
  'smartocto','smartskin','smashtess','smedia','smiletrain','smith','smokingguninc',
  'smoothcommerce','smosh','smrsi','smyal','snicsolutions','snpolytechnic','soar','soas','socbox',
  'socialdriver','societebrewing','sofascore','softiron','softube','sohodragon','solace','solex',
  'solidaridadnetworkeca','solidaritycenter','solidatus','solink','solmillenniummed','solon',
  'solutionsdriven','solutionsmetrix','solv4ex','solvewithvia','somamedicalcenter','somichcpa',
  'sonatafytechnology','songtradr','sonomalandtrust','sopecoh','sorensengross','sorensoncapital',
  'sorgecpa','soteranalytics','soundplanninggroup','soundstripe','southallchurch','southbridge',
  'southpointeacademy','southwestflfence','sovsc','spacebound','spacecentre','spacedrip',
  'spaceinternational','spalah','sparklemafia','sparkmicrogrants','sparksmc','sparkthejourney',
  'sparrowsnest','sparsolutions','spartan7','spartancarriergroup','spc1','spcawc','spcawestchester',
  'spcm','speakeasyinc','speakup','spearbio','specialtycounseling','spectacle','spectrumhealth',
  'spevco','spineart','spinielloco','spiralscout','spirii','spirithealth','spm','spokanetribe',
  'sportable','sportglobal','sportlogiq','sporttrade','spotlesscleaningnc','spottersecurityinc',
  'spreporting','springfieldleather','springfinancial','spsconnect','sqfin','squirro','sscva',
  'ssdigitalmedia','sseguras','sta','staffzone','stalbansclub','stambros','stammbio','stamped',
  'stance','standardfiber','standrewsturi','standwithus','starcjc','stardock','starelectric',
  'stargatehydrogen','starlimna','startouch','starzplayarabia','statelinechurch',
  'statesuniteddemocracy','statflo','stclairsrc','steadpoint','stebby','stedmunds','steelway',
  'steerstudios','steigerwaldt','stellaralgo','stellarcare','stellatechnology','stengelhill',
  'sterlingfire','stewarttalent','stfranciscenter','stichtingicfg','stillwatersci','stmarg',
  'stockdalecapital','stoneshot','stop','storj','stormagic','storyconstruction','stpcs','strade',
  'stranddev','strategicdefensesolutions','strattoncraig','streamlinestudios','streimer',
  'strivegaming','strongbridge','structuretx','stscapital','studios','studiotf1america',
  'studiowildcard','studyprograms','studytube','substance','suburbanenterprises','successbc',
  'successfinderinc','sucittastealth','sudburycu','sugarwish','sui','sullivanhauling',
  'sullivanmotors','sullivanstanley','summaequity','summercollab','summitfire','summitproducts',
  'summittech','sundae','sungas','sunriseexpress','sunriseproductions','sunshineacad',
  'sunshinegospel','sunwealth','super7','superiorairmanagement','superiorpak','supertext',
  'supplywisdom','supportersdk','supportiv','supportiveci','supremeservices','surepoint',
  'surescreengroup','suscotland','svante','svcc','svdpdisaster','swanky','swartzrestoration','swat',
  'swchc','sweetcow','swiftnav','swirees','switchboardlgbt','switchmediaau','swoyfc','swssedh',
  'swyfft','sybridgetech','syncra','synergillc','synergysettlements','synergywellnesscenter',
  'syntasauk','syrcl','syreon','system73','systemcrew','systemera','systemicjustice','systemxi',
  'taager','tachyus','tadsl','tagmedia','tailormadecompounding','tailormadelawns','taipeimsf',
  'takefivedogcare','talentgarden','talkatoo','talkingpts','tango','tangramflex',
  'tanhealthcareaccount','taskize','tatrasgroup','taxaoutdoors','taxistudio','taytosnacks',
  'tbmentalhealth','tbs','tchdnow','tcsasia','tct','tctcost','tctnetwork','tcypher','tdcpagroup',
  'tdec','tdg','tdgc','tdh','teachforarmenia','teachingattherightlevel','teamblueox','teamcamelot',
  'teamchildfund','teamconnection','teamcubation','teamintegrity','teamjapa','teamlewis',
  'teamrailsr','teamturnkey','tearaahungaora','techcyte','techdinamics','technalink','technosylva',
  'teckro','teg','tegritycontractors','tehama','tekla','teknicor','tekwav','telarus','telecomp',
  'telegraphcreative','tentbox','tenth','tentree','terasakiinstitute','teravisiongames',
  'terranovanow','terrasense','terrestrialenergy','teslarsoftware','tevalis','texelairconz',
  'texmed','textileexchange','tfcc','tfgnet','tgccpa','tggaccounting','thapremierclientkp',
  'thatcompany','the10group','theaccessproject','theapplabb','thearchco','theascotpartnership',
  'theauditgroup','thebao','thebestgroup','thebiggsgroup','thebiome','thebrandguild','thebrasserie',
  'thecallgurus','thecenturyfoundation','theclassiccenter','thecommons','thecommonschurch',
  'thecompasscenter','thecontemporaryaustin','thecoregroup','thecpin','thecrossingatbigcreek',
  'thefooddepot','theforage','theharbourschool','theheinzendowments','theinnbetween',
  'thejeffersonhealthplan','thekey','thelabnyc','thelastmile','thelightinggroup','theliocegroup',
  'themantheigroup','themaxfoundation','themedicalsg','themeljrmartyzajacfoundation',
  'thememoryclinic','themetchurch','thenationalobserver','theneatocompany','thenewgen','thenewly',
  'thentia','theoneill','theottawafoodbank','thepathschool','thepeopleschurch','thepublicsa',
  'theranches','therapycare','therealizationgroup','therefineryhouse','therishercompanies',
  'thermalrs','thermalspecialties','thesecondstep','theshiftnetwork','thesource','thestop',
  'thestrategicfirm','thetablecsa','thethinkingtraveller','thethrivenetwork','thetimothycenter',
  'theurgentcare','thevanguardschool','thevetcentre','thewatertrust','thewaveint','theweitzcompany',
  'thewellnesscentre','thewitmergroup','thinkanalytics','thinkcyber','thinkglobalschool',
  'thinkkaleidoscope','thinkmagellan','thirdhorizonstrategies','thirdspaceproperties',
  'thisisredflag','thomasjpaul','thompsonriverlumber','thomsongordongroup','thorup',
  'thousandcurrents','threesixtygroup','threespot','thresholdhousing','thrivetc',
  'throneentertainment','tiendamia','tiereleven','tigoenergy','tildencoil','tiled',
  'timberlinedrillinginc','timezest','timistours','timoneygroup','titanoil','tiugo','tknife',
  'tlaaminfirst','tlcenter','tlcsolutions','tlichoic','tmcamping','tmde','tmgworld','tmtgolf',
  'tnps','tnr','tnuck','toebeconstruction','tof','togetherforgirls','tohonooodham','tombras',
  'tomgov','tompkinswake','toolbx','topdata','topdown','topemployers','tornbanner',
  'torontobluejays','torrero','totalis','totalpoliticsgroup','toters','tototheo','toughcommerce',
  'tourismemtl','tourjasper','toursbylocals','towermarketing','townofdanville','townop','tpf',
  'tpud','traceinternational','trackfive','tractionrec','traderphdllc','tradspestcontrol',
  'trafficorp','transimeksa','transitionbio','transoftsolutions','travelzoo','treasurecoastaba',
  'treasuryprime','treble','treetime','treetrust','trendyminds','trentvineyard','trevipay','trezz',
  'tria','tribecapediatrics','tricountyhealth','tricrobotics','trident','tridenttransport',
  'triggerfish','triggerise','trilogy','trimgroup','trinityhospice','triplecreekranch',
  'tristaterestores','tritech','triumph','triverustrijet','trodo','trondek','trophiai','tropicana',
  'tropicbioscience','trowbridge','trpr','trtglobalsolutions','trualta','trudynamic','trueaero',
  'truecontext','truenorthitg','truevo','truewealth','truleap','trupropel','truspace','trusscore',
  'trussvet','trustana','trustwallet','truthcollective','trycycledata','tsf','tsn','ttacorp',
  'ttcmg','tthi','ttisi','tttstudios','tubman','tuckerdisability','tuffiassandberg','tuj','tula',
  'tulip','tunnelit','turbineai','turfandtreecare','turinganalytics','turn','turnkeyafrica',
  'tvsinc','twelvetonemusicschool','twinlakescounseling','twinportsderm','twinstake','twohat',
  'tympahealth','tympahealthtechnologiesinc','tymusbeverlypllc','tysonmendes','tyto','u10',
  'u1sports','uasu','ubawellness','ubco','ubongo','ucemc','ufinet','ufs','uge','uhlco','uja','uken',
  'uledger','ulnoowegca','umatillaelectric','umbralab','unacast','unbelievablemachine','unboundnow',
  'understandingwar','undivided','unetsafe','unionchurch','uniquemanagement','unitedbeautysupply',
  'unitedcapmn','unitedec','unitedsmarttech','univisioncomputers','unleashedacademy','unode50',
  'unrvld','unsm','untiedtsvegetablefarm','uovowine','upacjenta','upequity','uphill','uphold',
  'uppai','uppartners','uppervalleyhaven','uprisingcenter','upsidepreschool','upstateforever',
  'uptakestrategies','uptime','upwithwomen','urang','urbanecologycenter','urbanest','urbania',
  'urbansharing','usaforunhcr','usboell','uscdcb','uscreen','usepilot','userpilot',
  'utahlegalservices','utahwarriors','utd','utech','utg','utorg','utrs','uwswva','v12footwear',
  'vaccibody','valentureinstitute','valeonetworks','validic','valleybankofkalispell',
  'valleymedical','valleyne','valocityglobal','valuebuildersystem','vamanufacturers','vamonosit',
  'vancouverfarmersmarket','vandenrecycling','vanguardclinical','vanier','vanigentbiopharm',
  'vanmoof','vantagelogistics','vantagepointchurch','vaporministries','vartega','vausa','vayaspace',
  'vcchc','veganuary','vellum','venarisecurity','vendasta','venn','venosnh','ventientenergy',
  'venture','venturechristian','ventureforcanada','ventureslab','venuee','veracityid','veriday',
  'vermontcatholiccharities','verodcapitalmanagement','versafile1','versasec','vertexca',
  'vertexroofing','verticalscope','vertigis','vertis','verveit','vervetx','vexxhost','vfs',
  'vgsystems','viaevaluationaccount','viagiotech','vicpark','victimsupportscotland',
  'victoriasexualassault','victorychurch','videoslots','vidoshnorth','vie','viewsonic','vifr',
  'vilcap','villagepresbyterianchurchofnorthbrook','vincentinc','viotas','virgalawfirm',
  'virginiamoca','virtualpeaker','virtualworkernow','virtuoso','virtuozzo','visagetechnologies',
  'viscaweb','visionsourcehendersonville','visitseattle','visitspokane','vistacapitalpartners',
  'vistairhr','vistamusic','visterrainc','vitalhub','vitalresearch','vivanaturals','vivecrop',
  'vividmachines','vivtechnologies','vizxglobal','vizzuality','vkey','vmccny','vocel','void',
  'voigtie','voneus','vortexcompanies','vpcl','vptpower','vrify','vrscorporation','vshb','vsi',
  'vtcsm','vuehealth','vueplanner','vuereal','vulcanx','vyos','vytelle','wabanakipublichealth',
  'wachteltree','wagwalking','waibel','waidininggroup','wallbox','wallfabrics','wallop',
  'wangengroup','washingtonco','watchtowr','wateraidamerica','waterfirst','waterloofiber',
  'watersconst','watersedge','wattglobal','wattselectric','waveaquatics','wavefrontsoftware',
  'waveworks','wavo','waysidepress','waystone','wbmelback','wcdhd','wcgconstruction','wciinc',
  'wcscanada','wcwcd','wearecda','wearediamond','wearerosie','wearewmx','weatherstream',
  'webreality','webtools','wecommerce','wecp','wego','weishauptdesign','welab','welbi','welchllp',
  'wellcentricdc','wellnessspa','wellpointe','wellspring','welove9am','wep','weseedchange','wesley',
  'wessexinternet','westair','westendfamilycounselingservice','westendstrategy',
  'westernbuildingsupply','westernrestaurantsupply','westernsteel','westlandsuk',
  'westlibertyuniversity','westsidejustice','westtexasautorecovery','westvalleydetox','wgames',
  'wgtv','wha1','wharrisgsc','whca','whcchome','whisk','whisperingpines','whitbywood',
  'whiteboardmarketing','whitecapsfc','whitelabelcasinos','whiteroom','whitewaterwest','whitinger',
  'whitman','wholegraindigital','wieucaroadbaptistchurch','wildanimalsanctuary','wildcatoiltools',
  'wildix','wildplay','wiley','wilken','willamalanedistrict','willbee','williscc','williston',
  'willplumb','wilsonconst','winandwinnow','winchestercarlisle','winchesterinterconnect',
  'windenergyoftexas','windmilldevelopmentgroup','wingsofhope','wingsrecovery','winktechnologies',
  'winonaareaambulance','winterholben','wipliance','wisav','wiseworld','wisharemedia','wisltd',
  'wisor','wkrecc','wkt','wmaviation','wmtdigital','wnaengineering','wncinc','wolcenstudio',
  'wolfgangdigital','wolfsdorf','wolfsteel','womenemployed','womenforwomen','wonderacademy',
  'wonderstate','woodbridgehomes','woolwichcommunityhealthcentre','woom','work4u','workingfamilies',
  'workshop','worksmartgroup','workunlimited','worldbenchmarkingalliance','worldbicyclerelief',
  'worldhopeinternational','worldmobile','worldreader','worldvision','worldwinner','worldwrapps',
  'worthwhile','wpga','wpgov','wqscc','wraparoundmd','wrlgold','wrs','wrxgrp','wsb','wtci','wtcpl',
  'wusc','wwhf','wwnc','wyo','wyomingbusiness','wyomingcda','wyomingoutdoorcouncil','xapo','xata',
  'xavierlawfirm','xciting','xlabsystems1','xs','xscion','xtm','xtrm','xypro','xyz',
  'yardsticktechnologies','ycbm','ychgov','yellomedia','yellowcard','yempo','yeshouse','yess','yfc',
  'ylabs','ylc','ylemenergy2','yli','ymcacayman','yoganandaseva','yorkgroup',
  'youroutdoorlivingspace','youthguidance','youthopportunity','yrh','ysbiv','ysm','ytid','ytt',
  'yuppiechef','ywcautah','zaelot','zafin','zaizi','zaloni','zbg','zeframllc','zelp','zendesk',
  'zendrop','zenetec','zentalis','zephyrtoolgroup','zeropoint','zgmemployees','ziarecoverycenter',
  'zibber','zigabyte','zilia','zimmermanmulch','ziosk','zivid','zmactransport','zogics','zoomph',
  'zoonewengland','zpesystems','ztr','zurb','zutacore','zwick',
];

async function fetchBambooHR() {
  console.log('\n── BambooHR ──');
  const allJobs = [];

  const tasks = BAMBOOHR_SLUGS.map(slug => async () => {
    try {
      const res = await fetch(`https://${slug}.bamboohr.com/careers/list`, {
        headers: { 'Accept': 'application/json' },
        redirect: 'manual',
      });
      if (res.status !== 200) { console.log(`  ⚠ ${slug}: ${res.status}`); return []; }
      const data = await res.json();
      const openings = data.result || (Array.isArray(data) ? data : []);
      const companyJobs = openings.map(j => {
        const loc = j.location || {};
        const location = [loc.city, loc.state, loc.country].filter(Boolean).join(', ') || 'Unknown';
        return {
          source: 'bamboohr',
          external_id: `bhr_${slug}_${j.id}`,
          dedup_hash: dedupHash(slug, j.jobOpeningName || ''),
          title: (j.jobOpeningName || '').trim(),
          company: slug.charAt(0).toUpperCase() + slug.slice(1),
          company_logo: null,
          location: j.isRemote === '1' ? `Remote - ${location}` : location,
          job_type: j.employmentStatusLabel ? normalizeJobType(j.employmentStatusLabel) : null,
          salary: null,
          description: null,
          tags: extractTags(j.jobOpeningName || ''),
          apply_url: `https://${slug}.bamboohr.com/careers/${j.id}`,
          category: j.departmentLabel || null,
          published_at: null,
        };
      }).filter(j => j.title);

      // --- TECH COMPANY HEURISTIC FILTER ---
      const isTechCompany = companyJobs.some(j => 
        /engineer|developer|swe|software|frontend|backend|fullstack|data scien|machine learning|ai\b|product manager|ux design|qa /i.test(j.title)
      );
      if (!isTechCompany) return [];

      if (companyJobs.length) console.log(`  ✅ ${slug}: ${companyJobs.length} jobs (Tech)`);
      return companyJobs;
    } catch (e) {
      console.log(`  ⚠ ${slug}: ${e.message}`);
      return [];
    }
  });

  const results = await workerPool(tasks, 20);
  results.forEach(r => { if (Array.isArray(r)) allJobs.push(...r); });

  console.log(`  Total: ${allJobs.length} jobs from BambooHR`);
  return allJobs;
}

// ─── Source: Remotive ───
async function fetchRemotive() {
  console.log('\n── Remotive ──');
  try {
    const res = await fetch('https://remotive.com/api/remote-jobs?limit=500');
    const data = await res.json();
    const jobs = (data.jobs || []).map(j => {
      const tags = j.tags?.length ? j.tags : extractTags(`${j.title} ${j.description || ''}`);
      return {
        source: 'remotive',
        external_id: `remotive_${j.id}`,
        dedup_hash: dedupHash(j.company_name, j.title),
        title: j.title,
        company: j.company_name,
        company_logo: j.company_logo || null,
        location: j.candidate_required_location || 'Remote',
        job_type: normalizeJobType(j.job_type),
        salary: j.salary || null,
        description: j.description?.substring(0, 5000) || null,
        tags: Array.isArray(tags) ? tags : extractTags(`${j.title} ${j.description || ''}`),
        apply_url: j.url,
        category: j.category || null,
        published_at: j.publication_date || null,
      };
    });
    console.log(`  Found ${jobs.length} jobs`);
    return jobs;
  } catch (e) {
    console.error(`  ❌ Remotive error: ${e.message}`);
    return [];
  }
}


// ─── Source: Arbeitnow (Paginated) ───
async function fetchArbeitnow() {
  console.log('\n── Arbeitnow ──');
  let allJobs = [];
  try {
    for (let page = 1; page <= 5; page++) {
      console.log(`  Fetching page ${page}...`);
      const res = await fetch(`https://arbeitnow.com/api/job-board-api?page=${page}`);
      const data = await res.json();
      const jobs = (data.data || []).map(j => ({
        source: 'arbeitnow',
        external_id: `arbeitnow_${j.slug}`,
        dedup_hash: dedupHash(j.company_name, j.title),
        title: j.title,
        company: j.company_name,
        company_logo: null,
        location: j.remote ? 'Remote' : (j.location || 'Unknown'),
        job_type: (j.job_types || []).join(', ') || 'full_time',
        salary: null,
        description: j.description.substring(0, 5000),
        tags: j.tags && j.tags.length ? j.tags : extractTags(`${j.title} ${j.description || ''}`),
        apply_url: j.url,
        category: null,
        published_at: j.created_at ? new Date(j.created_at * 1000).toISOString() : null,
      })).filter(j => j.location && j.location.toLowerCase().includes('remote'));
      allJobs = [...allJobs, ...jobs];
      if (data.data?.length < 10) break; // End of pages
    }
    console.log(`  Found ${allJobs.length} total jobs from Arbeitnow`);
    return allJobs;
  } catch (e) {
    console.error(`  ❌ Arbeitnow error: ${e.message}`);
    return allJobs;
  }
}

// ─── Source: WeWorkRemotely ───
async function fetchWeWorkRemotely() {
  console.log('\n── WeWorkRemotely ──');
  try {
    const res = await fetch('https://weworkremotely.com/remote-jobs.rss');
    const xml = await res.text();
    const jobs = [];
    const itemRegex = /<item>[\s\S]*?<\/item>/g;
    let match;
    while ((match = itemRegex.exec(xml)) !== null) {
      const item = match[0];
      const getTag = (tag) => {
        const tMatch = item.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`));
        return tMatch ? tMatch[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim() : '';
      };
      
      const titleFull = getTag('title');
      let company = 'Unknown', title = titleFull;
      if (titleFull.includes(': ')) {
        const parts = titleFull.split(': ');
        company = parts[0];
        title = parts.slice(1).join(': ');
      }
      
      jobs.push({
        source: 'weworkremotely',
        external_id: `wwr_${getTag('guid')}`,
        dedup_hash: dedupHash(company, title),
        title,
        company,
        company_logo: null,
        location: getTag('category') || 'Remote',
        job_type: 'full_time',
        salary: null,
        description: getTag('description').substring(0, 5000),
        tags: extractTags(`${title} ${getTag('description')}`),
        apply_url: getTag('link'),
        category: null,
        published_at: new Date(getTag('pubDate')).toISOString(),
      });
    }
    console.log(`  Found ${jobs.length} jobs`);
    return jobs;
  } catch(e) {
    console.error(`  ❌ WWR error: ${e.message}`);
    return [];
  }
}

// ─── Source: Himalayas ───
async function fetchHimalayas() {
  console.log('\n── Himalayas ──');
  try {
    const res = await fetch('https://himalayas.app/jobs/api?limit=500');
    const data = await res.json();
    const jobs = (data.jobs || []).map(j => ({
      source: 'himalayas',
      external_id: `himalayas_${j.id}`,
      dedup_hash: dedupHash(j.companyName || j.company_name || '', j.title),
      title: j.title,
      company: j.companyName || j.company_name || 'Unknown',
      company_logo: j.companyLogo || j.company_logo || null,
      location: j.location || 'Remote',
      job_type: normalizeJobType(j.type || j.jobType),
      salary: j.salary || null,
      description: (j.description || j.excerpt || '').substring(0, 5000),
      tags: j.tags?.length ? j.tags : extractTags(`${j.title} ${j.description || ''}`),
      apply_url: j.applicationUrl || j.url || `https://himalayas.app/jobs/${j.id}`,
      category: j.categories?.[0] || j.category || null,
      published_at: j.publishedAt || j.published_at || null,
    }));
    console.log(`  Found ${jobs.length} jobs`);
    return jobs;
  } catch (e) {
    console.error(`  ❌ Himalayas error: ${e.message}`);
    return [];
  }
}

// ─── Source: Jobicy ───
async function fetchJobicy() {
  console.log('\n── Jobicy ──');
  try {
    const res = await fetch('https://jobicy.com/api/v2/remote-jobs?count=200');
    const data = await res.json();
    const jobs = (data.jobs || []).map(j => ({
      source: 'jobicy',
      external_id: `jobicy_${j.id}`,
      dedup_hash: dedupHash(j.companyName || '', j.jobTitle),
      title: j.jobTitle,
      company: j.companyName || 'Unknown',
      company_logo: j.companyLogo || null,
      location: j.jobGeo || 'Remote',
      job_type: normalizeJobType(j.jobType),
      salary: j.annualSalaryMin && j.annualSalaryMax
        ? `$${j.annualSalaryMin}-$${j.annualSalaryMax}`
        : null,
      description: (j.jobDescription || '').substring(0, 5000),
      tags: j.jobIndustry ? [j.jobIndustry] : extractTags(`${j.jobTitle} ${j.jobDescription || ''}`),
      apply_url: j.url,
      category: j.jobIndustry?.[0] || null,
      published_at: j.pubDate || null,
    }));
    console.log(`  Found ${jobs.length} jobs`);
    return jobs;
  } catch (e) {
    console.error(`  ❌ Jobicy error: ${e.message}`);
    return [];
  }
}

// ─── Source: Greenhouse (per-company) ───
async function fetchGreenhouse() {
  console.log('\n── Greenhouse ──');
  const allJobs = [];

  const tasks = GREENHOUSE_SLUGS.map(slug => async () => {
    try {
      const res = await fetch(`https://boards-api.greenhouse.io/v1/boards/${slug}/jobs`);
      if (!res.ok) { console.log(`  ⚠ ${slug}: ${res.status}`); return []; }
      const data = await res.json();
      const companyJobs = (data.jobs || [])
        .map(j => ({
          source: 'greenhouse',
          external_id: `gh_${slug}_${j.id}`,
          dedup_hash: dedupHash(j.company_name || slug, j.title),
          title: j.title.trim(),
          company: j.company_name || slug,
          company_logo: null,
          location: j.location?.name || 'Remote',
          job_type: null,
          salary: null,
          description: null,
          tags: extractTags(j.title),
          apply_url: j.absolute_url,
          category: null,
          published_at: j.updated_at || j.first_published || null,
        }));
      if (companyJobs.length) console.log(`  ✅ ${slug}: ${companyJobs.length} jobs`);
      return companyJobs;
    } catch (e) {
      console.log(`  ⚠ ${slug}: ${e.message}`);
      return [];
    }
  });

  const results = await workerPool(tasks, 50);
  results.forEach(r => { if (Array.isArray(r)) allJobs.push(...r); });

  console.log(`  Total: ${allJobs.length} jobs from Greenhouse`);
  return allJobs;
}

// ─── Source: Ashby (per-company) ───
async function fetchAshby() {
  console.log('\n── Ashby ──');
  const allJobs = [];

  const tasks = ASHBY_SLUGS.map(slug => async () => {
    try {
      const res = await fetch(`https://api.ashbyhq.com/posting-api/job-board/${slug}`);
      if (!res.ok) { console.log(`  ⚠ ${slug}: ${res.status}`); return []; }
      const data = await res.json();
      const companyJobs = (data.jobs || [])
        .map(j => ({
          source: 'ashby',
          external_id: `ashby_${slug}_${j.id}`,
          dedup_hash: dedupHash(data.organizationName || slug, j.title),
          title: j.title,
          company: data.organizationName || slug,
          company_logo: null,
          location: j.location || j.locationName || 'Remote',
          job_type: j.employmentType ? normalizeJobType(j.employmentType) : null,
          salary: null,
          description: (j.descriptionPlain || j.description || '').substring(0, 5000),
          tags: extractTags(`${j.title} ${j.descriptionPlain || j.description || ''}`),
          apply_url: j.jobUrl || `https://jobs.ashbyhq.com/${slug}/${j.id}`,
          category: j.department || j.team || null,
          published_at: j.publishedAt || null,
        }));
      if (companyJobs.length) console.log(`  ✅ ${slug}: ${companyJobs.length} jobs`);
      return companyJobs;
    } catch (e) {
      console.log(`  ⚠ ${slug}: ${e.message}`);
      return [];
    }
  });

  const results = await workerPool(tasks, 50);
  results.forEach(r => { if (Array.isArray(r)) allJobs.push(...r); });

  console.log(`  Total: ${allJobs.length} jobs from Ashby`);
  return allJobs;
}

// ─── Source: Workable (per-company) ───
async function fetchWorkable() {
  console.log('\n── Workable ──');
  const allJobs = [];

  const tasks = WORKABLE_SLUGS.map(slug => async () => {
    try {
      await sleep(2000); // Rate limit protection
      const res = await fetch(`https://apply.workable.com/api/v3/accounts/${slug}/jobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: '', location: [], department: [], worktype: [], remote: [] }),
      });
      if (!res.ok) { console.log(`  ⚠ ${slug}: ${res.status}`); return []; }
      const data = await res.json();
      const companyJobs = (data.results || [])
        .map(j => ({
          source: 'workable',
          external_id: `wb_${slug}_${j.shortcode}`,
          dedup_hash: dedupHash(slug, j.title),
          title: j.title,
          company: slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
          company_logo: null,
          location: j.remote ? `Remote${j.location?.city ? ` - ${j.location.city}` : ''}` : (j.location?.city || j.location?.country || 'Unknown'),
          job_type: j.type === 'full' ? 'full_time' : j.type === 'part' ? 'part_time' : j.type ? normalizeJobType(j.type) : null,
          salary: null,
          description: null,
          tags: extractTags(j.title + ' ' + (j.department || []).join(' ')),
          apply_url: `https://apply.workable.com/${slug}/j/${j.shortcode}/`,
          category: (j.department || [])[0] || null,
          published_at: j.published || null,
        }));
      if (companyJobs.length) console.log(`  ✅ ${slug}: ${companyJobs.length} jobs`);
      return companyJobs;
    } catch (e) {
      console.log(`  ⚠ ${slug}: ${e.message}`);
      return [];
    }
  });

  const results = await workerPool(tasks, 3);
  results.forEach(r => { if (Array.isArray(r)) allJobs.push(...r); });

  console.log(`  Total: ${allJobs.length} jobs from Workable`);
  return allJobs;
}

// ─── Source: Lever (per-company) ───
async function fetchLever() {
  console.log('\n── Lever ──');
  const allJobs = [];

  const tasks = LEVER_SLUGS.map(slug => async () => {
    try {
      const res = await fetch(`https://api.lever.co/v0/postings/${slug}?mode=json`);
      if (!res.ok) { console.log(`  ⚠ ${slug}: ${res.status}`); return []; }
      const data = await res.json();
      const companyJobs = (Array.isArray(data) ? data : [])
        .map(j => ({
          source: 'lever',
          external_id: `lever_${slug}_${j.id}`,
          dedup_hash: dedupHash(j.text ? slug : slug, j.text || ''),
          title: (j.text || '').trim(),
          company: slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
          company_logo: null,
          location: j.categories?.location || 'Remote',
          job_type: j.categories?.commitment || null,
          salary: null,
          description: (j.descriptionPlain || '').substring(0, 5000),
          tags: extractTags(`${j.text || ''} ${j.descriptionPlain || ''}`),
          apply_url: j.hostedUrl || j.applyUrl || `https://jobs.lever.co/${slug}/${j.id}`,
          category: j.categories?.department || j.categories?.team || null,
          published_at: j.createdAt ? new Date(j.createdAt).toISOString() : null,
        }));
      if (companyJobs.length) console.log(`  ✅ ${slug}: ${companyJobs.length} jobs`);
      return companyJobs;
    } catch (e) {
      console.log(`  ⚠ ${slug}: ${e.message}`);
      return [];
    }
  });

  const results = await workerPool(tasks, 50);
  results.forEach(r => { if (Array.isArray(r)) allJobs.push(...r); });

  console.log(`  Total: ${allJobs.length} jobs from Lever`);
  return allJobs;
}

// ─── Source: SmartRecruiters (per-company) ───
const SMARTRECRUITERS_SLUGS = [
  // APAC
  'Grab','DeliveryHero','Wise','Freshworks',
  // Global with APAC presence
  'Visa','Canva','ServiceNow',
  // Migrated from Greenhouse
  'Bigcommerce','Polygontechnology',
  // Remote-first additions
  'DocuSign',
];

async function fetchSmartRecruiters() {
  console.log('\n── SmartRecruiters ──');
  const jobs = [];

  for (const slug of SMARTRECRUITERS_SLUGS) {
    try {
      let offset = 0;
      let total = 0;
      do {
        const res = await fetch(`https://api.smartrecruiters.com/v1/companies/${slug}/postings?limit=100&offset=${offset}`);
        if (!res.ok) { console.log(`  ⚠ ${slug}: ${res.status}`); break; }
        const data = await res.json();
        total = data.totalFound || 0;
        for (const j of (data.content || [])) {
          const loc = j.location || {};
          const city = loc.city || '';
          const country = loc.country || '';
          const location = [city, country].filter(Boolean).join(', ') || 'Remote';
          jobs.push({
            source: 'smartrecruiters',
            external_id: `sr_${slug}_${j.id || j.uuid}`,
            dedup_hash: dedupHash(j.company?.name || slug, j.name || ''),
            title: (j.name || '').trim(),
            company: j.company?.name || slug,
            company_logo: null,
            location,
            job_type: j.typeOfEmployment?.label || null,
            salary: null,
            description: null,
            tags: extractTags(j.name || ''),
            apply_url: j.applyUrl || `https://jobs.smartrecruiters.com/${slug}/${j.id}`,
            category: j.department?.label || j.function?.label || null,
            published_at: j.releasedDate || null,
          });
        }
        offset += 100;
        await sleep(500);
      } while (offset < total && offset < 1000);
      console.log(`  ✅ ${slug}: ${Math.min(total, jobs.length)} jobs`);
    } catch (e) {
      console.log(`  ⚠ ${slug}: ${e.message}`);
    }
  }

  console.log(`  Total: ${jobs.length} jobs from SmartRecruiters`);
  return jobs;
}

// ─── Source: Workday (per-company, POST API) ───
const WORKDAY_BOARDS = [
  { slug: 'propertyguru', host: 'propertyguru.wd105.myworkdayjobs.com', path: 'PropertyGuru', company: 'PropertyGuru' },
];

async function fetchWorkday() {
  console.log('\n── Workday ──');
  const jobs = [];

  for (const board of WORKDAY_BOARDS) {
    try {
      let offset = 0;
      let total = 0;
      do {
        const res = await fetch(`https://${board.host}/wday/cxs/${board.slug}/${board.path}/jobs`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ appliedFacets: {}, limit: 20, offset, searchText: '' }),
        });
        if (!res.ok) { console.log(`  ⚠ ${board.slug}: ${res.status}`); break; }
        const data = await res.json();
        total = data.total || 0;
        for (const j of (data.jobPostings || [])) {
          jobs.push({
            source: 'workday',
            external_id: `wd_${board.slug}_${j.bulletFields?.[0] || offset}`,
            dedup_hash: dedupHash(board.company, j.title || ''),
            title: (j.title || '').trim(),
            company: board.company,
            company_logo: null,
            location: j.locationsText || 'Remote',
            job_type: null,
            salary: null,
            description: null,
            tags: extractTags(j.title || ''),
            apply_url: `https://${board.host}/en-US/${board.path}/job${j.externalPath || ''}`,
            category: null,
            published_at: j.postedOn || null,
          });
        }
        offset += 20;
        await sleep(300);
      } while (offset < total);
      console.log(`  ✅ ${board.slug}: ${Math.min(total, jobs.length)} jobs`);
    } catch (e) {
      console.log(`  ⚠ ${board.slug}: ${e.message}`);
    }
  }

  console.log(`  Total: ${jobs.length} jobs from Workday`);
  return jobs;
}

// ─── Source: Foorilla (HTML scraping via HTMX) ───
// Uses ?remote=true filter + pagination + parallel worker pool

// Worker pool: runs N tasks concurrently
async function workerPool(tasks, concurrency = 10) {
  const results = [];
  let idx = 0;

  async function worker() {
    while (idx < tasks.length) {
      const i = idx++;
      try {
        const result = await tasks[i]();
        if (result) results.push(result);
      } catch (e) { /* skip */ }
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, tasks.length) }, () => worker()));
  return results;
}

function parseFoorillaJob(slug, html) {
  // Parse structured HTML for job data
  const titleMatch = html.match(/<h\d[^>]*>([^<]+)<\/h\d>/);
  const companyMatch = html.match(/@([A-Za-z0-9_.\- ]+)/);
  const locationMatch = html.match(/(?:📍|location|Location|loc)[:\s]*([^<\n]+)/i);
  const applyMatch = html.match(/href="(https?:\/\/[^"]+)"[^>]*(?:Apply|apply)/i) ||
                    html.match(/href="(https?:\/\/[^"]*(?:lever|greenhouse|ashby|workday|personio|jobs|careers|apply)[^"]*)"/i);

  // Extract tags from bracket notation [React] [Python] etc
  const tagRegex = /\[([A-Za-z0-9+#. ]+)\]/g;
  const tags = [];
  let tagMatch;
  while ((tagMatch = tagRegex.exec(html))) {
    const tag = tagMatch[1].trim();
    if (!['SE','MI','EN','EX'].includes(tag)) tags.push(tag);
  }

  // Extract salary
  const salaryMatch = html.match(/(?:[$€£¥][\d,]+[KkMm]?(?:\s*[-–]\s*[$€£¥]?[\d,]+[KkMm]?)?|[\d,]+\s*(?:USD|EUR|GBP))/);

  // Extract job type
  const typeMatch = html.match(/(?:Full Time|Part Time|Contract|Freelance|Internship)/i);

  // Extract experience level
  const expMatch = html.match(/\[(SE|MI|EN|EX)\]/);

  const title = titleMatch?.[1]?.trim();
  const company = companyMatch?.[1]?.trim();
  if (!title || !company) return null;

  const idMatch = slug.match(/-(\d+)\/$/);
  const externalId = idMatch ? `foorilla_${idMatch[1]}` : `foorilla_${crypto.createHash('md5').update(slug).digest('hex').substring(0, 10)}`;
  const applyUrl = applyMatch?.[1] || `https://foorilla.com${slug}`;

  return {
    source: 'foorilla',
    external_id: externalId,
    dedup_hash: dedupHash(company, title),
    title,
    company,
    company_logo: null,
    location: locationMatch?.[1]?.trim() || 'Remote',
    job_type: typeMatch ? normalizeJobType(typeMatch[0]) : null,
    salary: salaryMatch?.[0] || null,
    description: null,
    tags: tags.length ? tags : extractTags(title),
    apply_url: applyUrl,
    category: expMatch?.[1] || null,
    published_at: null,
  };
}

async function fetchFoorilla() {
  console.log('\n── Foorilla ──');
  const CONCURRENCY = 100;

  // Use multiple keyword queries as separate "sessions" to bypass pagination cap
  const KEYWORDS = [
    '', // default
    // Roles
    'engineer','developer','frontend','backend','fullstack','devops','sre','platform',
    'data','machine learning','ai','ml','nlp','deep learning','computer vision',
    'product','designer','ux','ui','design','researcher','scientist',
    'manager','director','vp','head','lead','principal','staff','senior','junior','intern',
    'analyst','qa','tester','automation','quality',
    'marketing','growth','seo','content','copywriter','social media',
    'sales','account','business development','partnerships','customer success',
    'support','operations','finance','hr','recruiting','people',
    'legal','compliance','security','infosec','cybersecurity',
    // Languages & Frameworks
    'python','javascript','typescript','react','angular','vue','svelte',
    'node','golang','go','rust','java','kotlin','swift','scala','elixir',
    'ruby','rails','php','laravel','c++','c#','.net','sql',
    'nextjs','remix','nuxt','django','flask','fastapi','spring',
    // Infra & Cloud
    'cloud','aws','azure','gcp','kubernetes','docker','terraform','ansible',
    'linux','networking','database','postgresql','mongodb','redis','kafka',
    'api','microservices','distributed','infrastructure',
    // Domains
    'blockchain','web3','crypto','defi','nft','smart contract','solidity',
    'fintech','healthtech','edtech','biotech','gaming','ecommerce',
    'mobile','ios','android','flutter','react native',
    'embedded','firmware','hardware','robotics','iot',
    // Misc
    'remote','hybrid','onsite','contract','freelance','part time',
    'startup','series','venture','saas','b2b','b2c',
    'singapore','london','berlin','amsterdam','toronto','sydney','tokyo',
    'india','europe','asia','apac','latam','africa',
  ];

  try {
    // Phase 1: Collect slugs from all keyword sessions in parallel
    const allSlugs = new Set();

    const extractSlugs = async (keyword) => {
      const q = keyword ? `?q=${encodeURIComponent(keyword)}` : '';
      const url = `https://foorilla.com/hiring/jobs/${q}`;
      try {
        const res = await fetch(url, { headers: { 'HX-Request': 'true' } });
        if (!res.ok) return 0;
        const html = await res.text();
        const slugRegex = /hx-get="(\/hiring\/jobs\/[^"]+\/)"/g;
        let match, found = 0;
        while ((match = slugRegex.exec(html))) {
          const slug = match[1];
          if (/\-\d+\/$/.test(slug) && !allSlugs.has(slug)) {
            allSlugs.add(slug);
            found++;
          }
        }
        return found;
      } catch { return 0; }
    };

    // Run keyword sessions with concurrency limit
    const keywordTasks = KEYWORDS.map(kw => async () => {
      const found = await extractSlugs(kw);
      if (found > 0) console.log(`  🔍 "${kw || 'default'}": ${found} new slugs (total: ${allSlugs.size})`);
      return found;
    });
    await workerPool(keywordTasks, 10);

    // Also paginate the default listing for pages 2-20
    for (let page = 2; page <= 20; page++) {
      const res = await fetch(`https://foorilla.com/hiring/jobs/?page=${page}`, { headers: { 'HX-Request': 'true' } });
      if (!res.ok) break;
      const html = await res.text();
      const slugRegex = /hx-get="(\/hiring\/jobs\/[^"]+\/)"/g;
      let match, found = 0;
      while ((match = slugRegex.exec(html))) {
        const slug = match[1];
        if (/\-\d+\/$/.test(slug) && !allSlugs.has(slug)) {
          allSlugs.add(slug);
          found++;
        }
      }
      if (found > 0) console.log(`  📄 Page ${page}: ${found} new slugs (total: ${allSlugs.size})`);
      if (found === 0) break;
      await sleep(200);
    }

    console.log(`  📋 Total unique slugs: ${allSlugs.size}`);
    if (allSlugs.size === 0) return [];

    // Phase 2: Fetch details in parallel using worker pool
    const slugArr = [...allSlugs];
    const tasks = slugArr.map(slug => async () => {
      const res = await fetch(`https://foorilla.com${slug}`, {
        headers: { 'HX-Request': 'true' },
      });
      if (!res.ok) return null;
      const html = await res.text();
      return parseFoorillaJob(slug, html);
    });

    console.log(`  ⚡ Fetching details with ${CONCURRENCY} parallel workers...`);
    const jobs = await workerPool(tasks, CONCURRENCY);
    console.log(`  ✅ Parsed ${jobs.length} jobs from Foorilla`);
    return jobs;
  } catch (e) {
    console.error(`  ❌ Foorilla error: ${e.message}`);
    return [];
  }
}

// ─── Cleanup: remove jobs older than 30 days ───
async function cleanupOldJobs() {
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/jobs?synced_at=lt.${cutoff}`,
    {
      method: 'DELETE',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Prefer': 'return=representation',
      },
    }
  );
  if (res.ok) {
    const deleted = await res.json();
    console.log(`\n🗑️ Cleaned up ${deleted.length} jobs older than 30 days`);
  }
}

// ─── Main ───
async function main() {
  console.log('🚀 Jobs Sync — Starting');
  const startTime = Date.now();

  // ── PHASE 1: High-value sources (parallel, 50 concurrent each) ──
  console.log('\n═══ Phase 1: Core sources ═══');
  const [remoteok, remotive, arbeitnow, wwr, himalayas, jobicy, greenhouse, ashby, workable, lever, smartrecruiters, workday] = await Promise.all([
    fetchRemoteOK(),
    fetchRemotive(),
    fetchArbeitnow(),
    fetchWeWorkRemotely(),
    fetchHimalayas(),
    fetchJobicy(),
    fetchGreenhouse(),
    fetchAshby(),
    fetchWorkable(),
    fetchLever(),
    fetchSmartRecruiters(),
    fetchWorkday(),
  ]);

  const phase1Jobs = [...remoteok, ...remotive, ...arbeitnow, ...wwr, ...himalayas, ...jobicy, ...greenhouse, ...ashby, ...workable, ...lever, ...smartrecruiters, ...workday];
  console.log(`\n📊 Phase 1 collected: ${phase1Jobs.length} jobs`);

  // Process and upsert Phase 1 immediately
  const phase1Valid = filterAndNormalize(phase1Jobs);
  if (phase1Valid.length > 0) {
    const { inserted, skipped } = await supabaseUpsert(phase1Valid);
    console.log(`✅ Phase 1: Inserted ${inserted}, Skipped ${skipped}`);
  }

  // ── PHASE 2: BambooHR (5,138 slugs, needs separate socket pool) ──
  console.log('\n═══ Phase 2: BambooHR ═══');
  await sleep(5000); // Let sockets fully drain
  const bamboohr = await fetchBambooHR();
  console.log(`📊 Phase 2 collected: ${bamboohr.length} jobs`);

  const phase2Valid = filterAndNormalize(bamboohr);
  if (phase2Valid.length > 0) {
    const { inserted, skipped } = await supabaseUpsert(phase2Valid);
    console.log(`✅ Phase 2: Inserted ${inserted}, Skipped ${skipped}`);
  }

  // Cleanup old jobs
  await cleanupOldJobs();

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n🏁 Done in ${elapsed}s — Total: ${phase1Jobs.length + bamboohr.length} jobs processed`);
}

// ── Shared filter/normalize logic ──
function filterAndNormalize(allJobs) {
  const BLOCKED_COMPANIES = ['impuls hrk'];
  const BLOCKED_TITLE_WORDS = ['(m/w/d)', 'm/w/d', 'w/m/d', 'entwickler', 'mitarbeiter', 'gesucht', 'du liebst', 'werde unser', 'praktikum'];

  const validJobs = allJobs.filter(j => {
    if (!j.title || !j.company || !j.apply_url) return false;
    if (j.company.includes('...') || j.company.length <= 2) return false;
    if (BLOCKED_COMPANIES.includes(j.company.toLowerCase().trim())) return false;
    const lowerTitle = j.title.toLowerCase();
    if (BLOCKED_TITLE_WORDS.some(w => lowerTitle.includes(w))) return false;
    if (/^\d{5,}/.test(j.title.trim())) return false;
    if (/[\u4e00-\u9fff\u3040-\u30ff\uac00-\ud7af\u0400-\u04ff]/.test(j.title)) return false;
    return true;
  });
  console.log(`   Valid jobs: ${validJobs.length} (filtered ${allJobs.length - validJobs.length} bad)`);

  // Title normalization
  for (const job of validJobs) {
    let t = job.title;
    t = t.replace(/&amp;/gi, '&').replace(/&lt;/gi, '<').replace(/&gt;/gi, '>').replace(/&quot;/gi, '"').replace(/&#39;/gi, "'").replace(/&nbsp;/gi, ' ');
    const match = t.match(/^(.{20,}?)\s*[\-\/]\s+.+/) || t.match(/^(.{20,}?)\s*\(.+/);
    if (match) t = match[1].trim();
    t = t.replace(/\s+/g, ' ').trim();
    job.title = t;
  }

  // Stamp synced_at
  const now = new Date().toISOString();
  for (const job of validJobs) job.synced_at = now;
  return validJobs;
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
