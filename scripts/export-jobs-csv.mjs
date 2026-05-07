// Two-phase job export: Phase 1 fetches lightweight fields fast,
// Phase 2 backfills descriptions in tiny sequential batches.

import { createClient } from '@supabase/supabase-js';
import { createWriteStream, readFileSync, writeFileSync } from 'fs';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const OUTPUT = process.env.HOME + '/Downloads/cvinbio.csv';

function stripHTML(html) {
  if (!html) return '';
  let t = html;
  // Decode entities FIRST so encoded tags become real tags
  const decodeEntities = (s) => s
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')
    .replace(/&#xa0;/g, ' ').replace(/&#x[0-9a-f]+;/gi, ' ').replace(/&#\d+;/g, ' ')
    .replace(/&mdash;/g, '—').replace(/&ndash;/g, '–').replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'").replace(/&rdquo;/g, '"').replace(/&ldquo;/g, '"')
    .replace(/&bull;/g, '•').replace(/&hellip;/g, '…');
  t = decodeEntities(t);
  // Strip tags
  const stripTags = (s) => s
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<\/div>/gi, ' ')
    .replace(/<\/h[1-6]>/gi, '\n')
    .replace(/<[^>]+>/g, '');
  t = stripTags(t);
  // Decode again in case of double-encoding, then strip again
  t = stripTags(decodeEntities(t));
  return t.replace(/\n{3,}/g, '\n\n').replace(/[ \t]+/g, ' ').trim();
}

function escapeCSV(val) {
  if (!val && val !== 0) return '-';
  const s = String(val).replace(/\r?\n/g, ' ').replace(/"/g, '""');
  return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s}"` : s;
}

// ── Precise Skill Extraction ──
const SKILL_MAP = [
  // ENGINEERING
  [/\bPython\b/i, 'Python'],
  [/\bJavaScript\b/i, 'JavaScript'],
  [/\bTypeScript\b/i, 'TypeScript'],
  [/\bJava\b(?!Script)/i, 'Java'],
  [/\bGolang\b|\bGo\s+(?:programming|language|developer|engineer)/i, 'Golang'],
  [/\bRust\b(?=.*(?:programming|language|compiler|cargo|crate|systems))/i, 'Rust'],
  [/\bC\+\+\b/i, 'C++'],
  [/\bSolidity\b/i, 'Solidity'],
  [/\bReact\b(?!\.?\s*Native)/i, 'React'],
  [/\bReact\s*Native\b/i, 'React Native'],
  [/\bNode\.?js\b/i, 'Node.js'],
  [/\bNext\.?js\b/i, 'Next.js'],
  [/\bVue\.?js\b|\bVuejs\b/i, 'Vue.js'],
  [/\bAngular\b/i, 'Angular'],
  [/\bGraphQL\b/i, 'GraphQL'],
  [/\bPostgreSQL\b|\bPostgres\b/i, 'PostgreSQL'],
  [/\bMySQL\b/i, 'MySQL'],
  [/\bMongoDB\b/i, 'MongoDB'],
  [/\bRedis\b/i, 'Redis'],
  [/\bKafka\b/i, 'Kafka'],
  [/\bAWS\b|\bAmazon Web Services\b/i, 'AWS'],
  [/\bGCP\b|\bGoogle Cloud\b/i, 'GCP'],
  [/\bAzure\b/i, 'Azure'],
  [/\bDocker\b/i, 'Docker'],
  [/\bKubernetes\b|\bk8s\b/i, 'Kubernetes'],
  [/\bTerraform\b/i, 'Terraform'],
  [/\bCI\/CD\b|\bCI\/CD\b/i, 'CI/CD'],
  [/\bGit\b(?!Hub)/i, 'Git'],
  [/\bLinux\b/i, 'Linux'],
  // AI/ML
  [/\bMachine Learning\b|\bML\b(?=.*(?:model|pipeline|engineer|system))/i, 'Machine Learning'],
  [/\bDeep Learning\b/i, 'Deep Learning'],
  [/\bNLP\b|\bNatural Language Processing\b/i, 'NLP'],
  [/\bTensorFlow\b/i, 'TensorFlow'],
  [/\bPyTorch\b/i, 'PyTorch'],
  [/\bLLM\b|\bLarge Language Model/i, 'LLM'],
  [/\bLangChain\b/i, 'LangChain'],
  // BLOCKCHAIN
  [/\bEthereum\b/i, 'Ethereum'],
  [/\bSolana\b/i, 'Solana'],
  [/\bDeFi\b/i, 'DeFi'],
  [/\bNFT\b/i, 'NFT'],
  [/\bHardhat\b/i, 'Hardhat'],
  [/\bFoundry\b/i, 'Foundry'],
  [/\bIPFS\b/i, 'IPFS'],
  [/\bZK\s*Proof/i, 'ZK Proofs'],
  // DATA
  [/\bSQL\b/i, 'SQL'],
  [/\bSnowflake\b/i, 'Snowflake'],
  [/\bBigQuery\b/i, 'BigQuery'],
  [/\bAirflow\b/i, 'Airflow'],
  [/\bdbt\b/i, 'dbt'],
  [/\bTableau\b/i, 'Tableau'],
  [/\bPower\s*BI\b/i, 'Power BI'],
  [/\bLooker\b/i, 'Looker'],
  [/\bETL\b/i, 'ETL'],
  [/\bData Analysis\b/i, 'Data Analysis'],
  [/\bData Engineering\b/i, 'Data Engineering'],
  // MARKETING
  [/\bSEO\b/i, 'SEO'],
  [/\bSEM\b/i, 'SEM'],
  [/\bGoogle Ads\b/i, 'Google Ads'],
  [/\bGoogle Analytics\b/i, 'Google Analytics'],
  [/\bHubSpot\b/i, 'HubSpot'],
  [/\bSalesforce\b/i, 'Salesforce'],
  [/\bCRM\b/i, 'CRM'],
  [/\bContent Marketing\b/i, 'Content Marketing'],
  [/\bEmail Marketing\b/i, 'Email Marketing'],
  [/\bPaid Media\b/i, 'Paid Media'],
  [/\bGrowth Marketing\b/i, 'Growth Marketing'],
  [/\bPerformance Marketing\b/i, 'Performance Marketing'],
  [/\bA\/B Testing\b/i, 'A/B Testing'],
  [/\bCopywriting\b/i, 'Copywriting'],
  [/\bCommunity Management\b/i, 'Community Management'],
  [/\bInfluencer Marketing\b/i, 'Influencer Marketing'],
  // DESIGN
  [/\bFigma\b/i, 'Figma'],
  [/\bAdobe Creative Suite\b|\bAdobe CC\b/i, 'Adobe Creative Suite'],
  [/\bUI\/UX\b|\bUX\/UI\b|\bUI Design\b|\bUX Design\b/i, 'UI/UX Design'],
  [/\bPrototyping\b/i, 'Prototyping'],
  [/\bMotion Design\b/i, 'Motion Design'],
  [/\bAfter Effects\b/i, 'After Effects'],
  // FINANCE
  [/\bFinancial Modeling\b/i, 'Financial Modeling'],
  [/\bExcel\b/i, 'Excel'],
  [/\bGAAP\b/i, 'GAAP'],
  [/\bIFRS\b/i, 'IFRS'],
  [/\bFP&A\b|\bFP\&A\b/i, 'FP&A'],
  [/\bAccounting\b/i, 'Accounting'],
  [/\bAuditing\b/i, 'Auditing'],
  [/\bTreasury\b/i, 'Treasury'],
  [/\bFinancial Reporting\b/i, 'Financial Reporting'],
  [/\bForecasting\b/i, 'Forecasting'],
  [/\bBudgeting\b/i, 'Budgeting'],
  [/\bNetSuite\b/i, 'NetSuite'],
  [/\bQuickBooks\b/i, 'QuickBooks'],
  // LEGAL/COMPLIANCE
  [/\bKYC\b/i, 'KYC'],
  [/\bAML\b/i, 'AML'],
  [/\bGDPR\b/i, 'GDPR'],
  [/\bSOC\s*2\b/i, 'SOC 2'],
  [/\bSOX\b/i, 'SOX'],
  [/\bRisk Management\b/i, 'Risk Management'],
  [/\bRegulatory Compliance\b/i, 'Regulatory Compliance'],
  [/\bDue Diligence\b/i, 'Due Diligence'],
  [/\bContract Negotiation\b/i, 'Contract Negotiation'],
  // HR
  [/\bWorkday\b/i, 'Workday'],
  [/\bGreenhouse\b/i, 'Greenhouse'],
  [/\bHRIS\b/i, 'HRIS'],
  [/\bTalent Acquisition\b/i, 'Talent Acquisition'],
  // SALES/OPS
  [/\bB2B Sales\b/i, 'B2B Sales'],
  [/\bAccount Management\b/i, 'Account Management'],
  [/\bLead Generation\b/i, 'Lead Generation'],
  [/\bProject Management\b/i, 'Project Management'],
  [/\bStrategic Planning\b/i, 'Strategic Planning'],
  [/\bCustomer Success\b/i, 'Customer Success'],
  [/\bVendor Management\b/i, 'Vendor Management'],
  // EXTRA TECH
  [/\bApache Spark\b/i, 'Apache Spark'],
  [/\bScala\b/i, 'Scala'],
  [/\bR\b(?!&|\s*&)(?=.*(?:programming|statistical|RStudio|tidyverse|ggplot))/i, 'R'],
  [/\bElasticsearch\b/i, 'Elasticsearch'],
  [/\bRabbitMQ\b/i, 'RabbitMQ'],
  [/\bSwift\b/i, 'Swift'],
  [/\bKotlin\b/i, 'Kotlin'],
  [/\bFlutter\b/i, 'Flutter'],
  [/\bDjango\b/i, 'Django'],
  [/\bFlask\b/i, 'Flask'],
  [/\bSpring Boot\b/i, 'Spring Boot'],
  [/\bRuby on Rails\b|\bRails\b/i, 'Ruby on Rails'],
  [/\bPHP\b/i, 'PHP'],
  [/\bC#\b|\.NET\b/i, 'C#/.NET'],
  [/\bRedshift\b/i, 'Redshift'],
  [/\bDatabricks\b/i, 'Databricks'],
  [/\bSpark\b(?!le)/i, 'Apache Spark'],
  [/\bHadoop\b/i, 'Hadoop'],
  [/\bJenkins\b/i, 'Jenkins'],
  [/\bGitHub Actions\b/i, 'GitHub Actions'],
  [/\bDatadog\b/i, 'Datadog'],
  [/\bSplunk\b/i, 'Splunk'],
  [/\bNew Relic\b/i, 'New Relic'],
  [/\bJira\b/i, 'Jira'],
  [/\bConfluence\b/i, 'Confluence'],
  [/\bSlack\b/i, 'Slack'],
  [/\bZendesk\b/i, 'Zendesk'],
  [/\bIntercom\b/i, 'Intercom'],
  [/\bSegment\b/i, 'Segment'],
  [/\bMixpanel\b/i, 'Mixpanel'],
  [/\bAmplitude\b/i, 'Amplitude'],
  [/\bStripe\b/i, 'Stripe'],
  [/\bTwilio\b/i, 'Twilio'],
  [/\bShopify\b/i, 'Shopify'],
  [/\bWordPress\b/i, 'WordPress'],
  [/\bMarketo\b/i, 'Marketo'],
  [/\bMailchimp\b/i, 'Mailchimp'],
  [/\bGA4\b|\bGoogle Tag Manager\b/i, 'Google Analytics'],
  [/\bSAP\b/i, 'SAP'],
  [/\bOracle\b/i, 'Oracle'],
  // BROADER MATCHES for common roles
  [/\bgrowth marketing\b|growth hacking\b/i, 'Growth Marketing'],
  [/\bpaid\s*(social|search|acquisition|campaign)/i, 'Paid Media'],
  [/\banalytics\b/i, 'Data Analysis'],
  [/\bscrum\b|\bagile\b/i, 'Agile/Scrum'],
  [/\bdata\s*warehouse/i, 'Data Engineering'],
  [/\bdata\s*pipeline/i, 'Data Engineering'],
  [/\bAPI\b/i, 'API Development'],
  [/\bmicroservices\b/i, 'Microservices'],
  [/\bRESTful\b|\bREST API/i, 'API Development'],
  [/\bautomation\b/i, 'Automation'],
  [/\bQA\b|\bquality assurance/i, 'QA Testing'],
  [/\bSelenium\b|\bCypress\b|\bPlaywright\b/i, 'Test Automation'],
  [/\bproduct\s*management\b/i, 'Product Management'],
  [/\buser\s*research\b/i, 'User Research'],
  [/\bwireframe/i, 'Prototyping'],
  [/\bsketch\b/i, 'Sketch'],

];

function extractSkills(title, text) {
  const combined = (title || '') + ' ' + (text || '');
  if (!combined.trim()) return '-';
  const found = new Set();
  for (const [regex, label] of SKILL_MAP) {
    if (regex.test(combined) && !found.has(label)) {
      found.add(label);
      if (found.size >= 8) break;
    }
  }
  return found.size > 0 ? [...found].join('; ') : '-';
}

function inferSeniority(title) {
  const t = (title || '').toLowerCase();
  if (/\b(intern|internship|trainee|co-op|coop)\b/.test(t)) return 'Intern';
  if (/\b(junior|jr\.?|entry|associate|graduate|new grad)\b/.test(t)) return 'Junior';
  if (/\b(director|vp|head|chief|c-level|cto|ceo|cfo|coo|president|manager|mgr|executive)\b/.test(t)) return 'Leadership';
  if (/\b(senior|sr\.?|lead|principal|staff|distinguished)\b/.test(t)) return 'Senior';
  return 'Mid';
}

function inferDepartment(title) {
  const t = (title || '').toLowerCase();
  // Specific before generic — order matters!
  if (/data scien|machine learn|ml engineer|ai engineer|deep learn|nlp\b|llm\b|computer vision/i.test(t)) return 'Data Science / AI';
  if (/data analyst|business analyst|bi analyst|analytics engineer/i.test(t)) return 'Analytics';
  if (/data engineer|etl\b|data platform/i.test(t)) return 'Data Engineering';
  if (/software|engineer|developer|\bswe\b|frontend|front.end|backend|back.end|fullstack|full.stack|devops|\bsre\b|\bios\b|android|mobile dev/i.test(t)) return 'Engineering';
  if (/\bqa\b|quality assurance|test engineer|\bsdet\b/i.test(t)) return 'Engineering';
  if (/\binfra|cloud engineer|platform engineer|site reliab/i.test(t)) return 'Engineering';
  if (/technical staff|staff engineer|architect/i.test(t)) return 'Engineering';
  if (/\bhardware\b|\bfirmware\b|\bembedded\b|\bmechanical eng/i.test(t)) return 'Engineering';
  if (/design|ux\b|ui designer|product design|graphic|creative director|art director/i.test(t)) return 'Design';
  if (/product manag|product owner|product lead|\btpm\b|technical program|product director|product vp/i.test(t)) return 'Product';
  if (/program manag|project manag|\bscrum\b|\bagile\b/i.test(t)) return 'Product';
  if (/marketing|growth market|\bseo\b|\bsem\b|\bbrand\b|content strat|demand gen|digital market|performance market/i.test(t)) return 'Marketing';
  if (/communications|public relations|pr manager|copywrite|editor\b|content partner|content lead/i.test(t)) return 'Marketing';
  if (/\bsales\b|account exec|business develop|revenue|quota|territory|sales rep/i.test(t)) return 'Sales';
  if (/solutions? engineer|solutions? architect|pre.?sales|sales engineer|solutions? consult|client partner/i.test(t)) return 'Sales';
  if (/recrui|talent |people ops|human resource|\bhr\b|hr manager|hr business|hr generalist|compensation|benefits admin/i.test(t)) return 'People / HR';
  if (/finance|financial|accounting|accountant|payroll|controller|treasury|fp.?a\b|\btax\b|audit|pricing/i.test(t)) return 'Finance';
  if (/legal|counsel|attorney|lawyer|paralegal|compliance|regulatory|risk manag/i.test(t)) return 'Legal / Compliance';
  if (/customer success|customer support|customer service|support engineer|technical support|help desk|client success/i.test(t)) return 'Customer Success';
  if (/account manag|client manag|relationship manag|customer manag|client solutions/i.test(t)) return 'Account Management';
  if (/operat|logistics|supply chain|procurement|warehouse|fleet/i.test(t)) return 'Operations';
  if (/security|infosec|cyber|information security|identity.*access/i.test(t)) return 'Security';
  if (/nurse|physician|clinical|medical|pharma|therapist|dentist|health/i.test(t)) return 'Healthcare';
  if (/teacher|professor|instructor|education|curriculum|tutor/i.test(t)) return 'Education';
  if (/research|scientist/i.test(t)) return 'Research';
  if (/\badmin\b|office manag|executive assist|receptionist/i.test(t)) return 'Admin';
  // Broader fallbacks
  if (/consultant|advisory|strateg/i.test(t)) return 'Sales';
  if (/\bintern\b|internship|apprentice|trainee|co-op/i.test(t)) return 'Operations';
  if (/\bdirector\b|\bvp\b|\bhead of\b|\bchief\b|\bcountry manag|\bgeneral manag|\barea manag|\bregional manag/i.test(t)) return 'Leadership';
  if (/\bmanager\b|\blead\b|\bsupervisor/i.test(t)) return 'Operations';
  if (/coordinator|specialist|associate|analyst/i.test(t)) return 'Operations';
  if (/\bcook\b|\bdriver\b|\bwarehouse\b|\bcashier\b|\bbarista\b|retail|store\b/i.test(t)) return 'Operations';
  if (/\bagent\b|\brepresentative\b|\bassistant\b/i.test(t)) return 'Operations';
  return 'Other';
}

function inferRemote(location) {
  const l = (location || '').toLowerCase();
  return /\bremote\b/.test(l) ? 'Yes' : /\bhybrid\b/.test(l) ? 'Hybrid' : 'On-site';
}

function inferJobType(type) {
  const t = (type || '').toLowerCase();
  if (/full.?time/.test(t)) return 'Full-Time';
  if (/part.?time/.test(t)) return 'Part-Time';
  if (/contract/.test(t)) return 'Contract';
  if (/intern/.test(t)) return 'Internship';
  return 'Full-Time';
}

function normalizeLocation(loc) {
  if (!loc) return '-';
  let l = loc
    .replace(/\s*\(HQ\)/gi, '')
    .replace(/\s*\bOffice\b/gi, '')
    .replace(/\s*\bHeadquarters?\b/gi, '')
    .replace(/\s*[;|]\s*/g, '; ')       // normalize separators
    .replace(/\s{2,}/g, ' ')             // collapse whitespace
    .replace(/,\s*,/g, ',')              // remove double commas
    .replace(/^[;,\s]+|[;,\s]+$/g, ''); // trim leading/trailing

  let parts = l.split('; ').map(p => {
    let s = p.trim();
    if (/Remote\s*[-–(]\s*(.+?)\)?$/i.test(s)) {
      let c = s.match(/Remote\s*[-–(]\s*(.+?)\)?$/i)[1].trim();
      if (/^(USA|U\.S\.|U\.S\.A\.)$/i.test(c)) c = 'United States';
      return `Remote, ${c}`;
    }
    if (/(.+?)\s*[-–]\s*Remote$/i.test(s)) {
      let c = s.match(/(.+?)\s*[-–]\s*Remote$/i)[1].trim();
      if (/^(USA|U\.S\.|U\.S\.A\.)$/i.test(c)) c = 'United States';
      return `Remote, ${c}`;
    }
    if (/Remote\s+U\.?S\.?A?\.?$/i.test(s)) return 'Remote, United States';
    return s
      .replace(/\bUS\b/g, 'United States')
      .replace(/\bUK\b/g, 'United Kingdom')
      .replace(/\bNYC\b/gi, 'New York City')
      .replace(/\bSF\b/gi, 'San Francisco')
      .replace(/\bLA\b/gi, 'Los Angeles')
      .replace(/\bDC\b/gi, 'Washington, DC')
      .replace(/\bDE\b/g, 'Germany')
      .replace(/\bFR\b/g, 'France')
      .replace(/\bNL\b/g, 'Netherlands')
      .replace(/\bCA\b(?!,)/g, 'California')
      .replace(/\bNY\b(?!,)/g, 'New York')
      .replace(/\bTX\b(?!,)/g, 'Texas')
      .replace(/\bWA\b(?!,)/g, 'Washington')
      .replace(/\bIL\b(?!,)/g, 'Illinois')
      .replace(/\bMA\b(?!,)/g, 'Massachusetts')
      .trim();
  });
  
  l = parts.join('; ');
  // Deduplicate: "Singapore, Singapore" -> "Singapore"
  const dupes = l.split(/,\s*/);
  if (dupes.length === 2 && dupes[0].trim().toLowerCase() === dupes[1].trim().toLowerCase()) {
    l = dupes[0].trim();
  }
  return l || '-';
}

function normalizeSalary(salary) {
  if (!salary) return '-';
  let s = salary.trim();
  if (!s) return '-';
  // Already formatted
  if (/\$/.test(s)) return s;
  // Try to format raw numbers: "150000-200000" → "$150,000 - $200,000"
  const rangeMatch = s.match(/(\d[\d,]+)\s*[-–to]+\s*(\d[\d,]+)/);
  if (rangeMatch) {
    const lo = parseInt(rangeMatch[1].replace(/,/g, ''));
    const hi = parseInt(rangeMatch[2].replace(/,/g, ''));
    if (lo > 1000) return `$${lo.toLocaleString()} - $${hi.toLocaleString()}`;
  }
  const singleMatch = s.match(/(\d[\d,]+)/);
  if (singleMatch) {
    const v = parseInt(singleMatch[1].replace(/,/g, ''));
    if (v > 1000) return `$${v.toLocaleString()}`;
  }
  return s;
}

function extractSalaryFromDesc(text) {
  if (!text) return '';
  // Match salary ranges: $120,000 - $180,000 / $120K-$180K / €65,000-€83,000 / £50k-£70k
  const patterns = [
    // $120,000 - $200,000 (with optional USD/EUR/GBP/yearly/annually)
    /(?:[$€£])\s?(\d{1,3}(?:,\d{3})+)\s*(?:[-–—to]+)\s*(?:[$€£])\s?(\d{1,3}(?:,\d{3})+)\s*(?:USD|EUR|GBP)?\s*(?:\/\s*(?:year|yr|annually|annual|per annum))?/i,
    // $120K - $180K
    /(?:[$€£])\s?(\d{2,4})[kK]\s*(?:[-–—to]+)\s*(?:[$€£])\s?(\d{2,4})[kK]/i,
    // $120,000 (single value with context)
    /(?:salary|compensation|pay|base|OTE|earning)[^.]{0,40}(?:[$€£])\s?(\d{1,3}(?:,\d{3})+)/i,
    // Hourly: $50 - $80 /hour or per hour
    /(?:[$€£])\s?(\d{2,4})\s*(?:[-–—to]+)\s*(?:[$€£])\s?(\d{2,4})\s*(?:\/|per)\s*(?:hour|hr)/i,
    // Plain ranges: 120000-200000 near salary context
    /(?:salary|compensation|pay range|base)[^.]{0,30}(\d{2,3}),?(\d{3})\s*[-–—to]+\s*(\d{2,3}),?(\d{3})/i,
  ];

  for (const pat of patterns) {
    const m = text.match(pat);
    if (!m) continue;
    
    // Hourly rate pattern (4th)
    if (pat === patterns[3]) {
      return `$${m[1]} - $${m[2]}/hour`;
    }
    // K-notation (2nd)
    if (pat === patterns[1]) {
      const lo = parseInt(m[1]) * 1000;
      const hi = parseInt(m[2]) * 1000;
      return `$${lo.toLocaleString()} - $${hi.toLocaleString()}`;
    }
    // Range pattern (1st)
    if (pat === patterns[0]) {
      const currency = text.match(/[$€£]/)?.[0] || '$';
      return `${currency}${m[1]} - ${currency}${m[2]}`;
    }
    // Single value with context (3rd)
    if (pat === patterns[2]) {
      return `$${m[1]}`;
    }
    // Plain range (5th)
    if (pat === patterns[4]) {
      const lo = parseInt(m[1] + m[2]);
      const hi = parseInt(m[3] + m[4]);
      return `$${lo.toLocaleString()} - $${hi.toLocaleString()}`;
    }
  }
  return '';
}

async function fetchWithRetry(from, to, fields, attempt = 1) {
  const { data, error } = await supabase
    .from('jobs')
    .select(fields)
    .order('id', { ascending: true })
    .range(from, to);
  if (error && attempt < 4) {
    await new Promise(r => setTimeout(r, 2000 * attempt));
    return fetchWithRetry(from, to, fields, attempt + 1);
  }
  if (error) throw new Error(`Range ${from}-${to}: ${error.message}`);
  return data || [];
}

async function main() {
  console.time('Total');

  // ── Phase 1: Fetch all jobs WITHOUT description (fast) ──
  const { count } = await supabase.from('jobs').select('id', { count: 'exact', head: true });
  console.log(`📊 ${count} jobs total`);

  const BATCH = 1000;
  const CONC = 5;
  const totalPages = Math.ceil(count / BATCH);
  const allJobs = new Array(count);
  let fetched = 0;

  console.log(`\n⚡ Phase 1: Fetching metadata (${totalPages} batches × ${CONC} concurrent)...`);
  for (let i = 0; i < totalPages; i += CONC) {
    const wave = [];
    for (let j = i; j < Math.min(i + CONC, totalPages); j++) {
      const from = j * BATCH;
      const to = from + BATCH - 1;
      wave.push(fetchWithRetry(from, to, 'id, title, company, apply_url, location, job_type, salary, tags, source, published_at'));
    }
    const results = await Promise.all(wave);
    for (const batch of results) {
      for (const job of batch) {
        allJobs[fetched++] = job;
      }
    }
    process.stdout.write(`\r  ${fetched}/${count} jobs...`);
  }
  console.log(`\n✅ Phase 1 done: ${fetched} jobs`);

  // ── Phase 2: Fetch descriptions (sequential, small batches by ID) ──
  console.log(`\n📝 Phase 2: Fetching descriptions...`);
  const DESC_BATCH = 200;
  const descMap = new Map();
  let descFetched = 0;

  // Collect all IDs
  const ids = allJobs.filter(Boolean).map(j => j.id);

  for (let i = 0; i < ids.length; i += DESC_BATCH) {
    const batchIds = ids.slice(i, i + DESC_BATCH);
    try {
      const { data } = await supabase
        .from('jobs')
        .select('id, description')
        .in('id', batchIds);
      if (data) {
        for (const row of data) {
          if (row.description) descMap.set(row.id, row.description);
        }
        descFetched += data.length;
      }
    } catch (e) {
      // skip failed batch
    }
    if ((i / DESC_BATCH) % 20 === 0) {
      process.stdout.write(`\r  ${descFetched}/${ids.length} descriptions...`);
    }
  }
  console.log(`\n✅ Phase 2 done: ${descMap.size} descriptions`);

  // ── Build rows ──
  console.log(`\n📄 Building rows...`);
  const HEADER = 'URL,Company,Company URL,Job Title,Location,Remote,Job Type,Seniority,Department,Skills,Compensation,Description\n';
  const rows = [];
  
  const imported = await import('./banned-jobs.js');
  const BANNED_PATTERNS = imported.default ? imported.default.BANNED_PATTERNS : imported.BANNED_PATTERNS;
  const bannedRegex = new RegExp(BANNED_PATTERNS.join('|'), 'i');
  
  const fs = await import('fs');
  const companyDomains = JSON.parse(fs.readFileSync('./scripts/company-domains.json', 'utf8'));

  for (const job of allJobs) {
    if (!job) continue;
    if (bannedRegex.test(job.title)) continue; // Filter out irrelevant service/hourly jobs
    const desc = descMap.get(job.id) || '';
    if (!desc) continue;
    const cleanDesc = stripHTML(desc);
    
    // Extract actual company domain (not ATS domain)
    const companyUrl = (() => {
      try {
        const compClean = (job.company || '').toLowerCase();
        if (companyDomains[compClean]) return companyDomains[compClean];
        
        const urlObj = new URL(job.apply_url);
        const host = urlObj.hostname.replace('www.', '');
        const atsHosts = ['ashbyhq.com', 'lever.co', 'greenhouse.io', 'bamboohr.com',
                     'workday.com', 'myworkdayjobs.com', 'smartrecruiters.com',
                     'recruitee.com', 'breezy.hr', 'applytojob.com', 'jazz.co',
                     'jobvite.com', 'ultipro.com', 'icims.com', 'taleo.net',
                     'workable.com', 'dover.com', 'rippling-ats.com', 'teamtailor.com',
                     'wellfound.com', 'ycombinator.com', 'himalayas.app',
                     'weworkremotely.com', 'remoteok.com', 'angel.co'];
                     
        if (atsHosts.some(ats => host.includes(ats))) return '-';
        
        const parts = host.split('.');
        if (parts.length >= 2) {
            const prefixes = ['jobs', 'careers', 'boards', 'apply', 'hire', 'career', 'work', 'join', 'recruiting', 'talent'];
            if (prefixes.includes(parts[0])) return 'https://' + parts.slice(1).join('.');
            return 'https://' + host;
        }
        return '-';
      } catch { return '-'; }
    })();

    if (companyUrl === '-') continue;

    const stripProto = (url) => url.replace(/^https?:\/\/(?:www\.)?/, '');

    let cleanCompany = job.company || '-';
    cleanCompany = cleanCompany.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;/g, "'").replace(/&quot;/g, '"');
    cleanCompany = cleanCompany.replace(/^Employment Opportunities at\s+/i, '');
    cleanCompany = cleanCompany.replace(/[,\s]+(?:Inc\.?|LLC|Ltd\.?|Corp\.?|GmbH|S\.?A\.?|PLC|AG|SE|Pty\.?\s*Ltd\.?|Co\.|Limited|Incorporated|Corporation|L\.P\.)[\s.]*$/i, '');
    cleanCompany = cleanCompany.replace(/[-_](inc|llc|ltd|corp|gmbh)$/i, '');
    if (cleanCompany.includes('-') && !cleanCompany.includes(' ') && cleanCompany === cleanCompany.toLowerCase()) {
      cleanCompany = cleanCompany.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
    cleanCompany = cleanCompany.replace(/\s*\(.*?\)/g, '').replace(/\s+\d+$/, '').trim();
    if (cleanCompany === cleanCompany.toLowerCase() && cleanCompany.length > 3) cleanCompany = cleanCompany.replace(/\b\w/g, l => l.toUpperCase());
    if (cleanCompany === cleanCompany.toUpperCase() && cleanCompany.length > 4) cleanCompany = cleanCompany.charAt(0) + cleanCompany.slice(1).toLowerCase();
    
    // Some known overrides
    const brandOverrides = {'gopuff':'Gopuff', 'doordash usa':'DoorDash', 'plaid':'Plaid', 'notion':'Notion', 'shopback':'ShopBack'};
    if (brandOverrides[cleanCompany.toLowerCase()]) cleanCompany = brandOverrides[cleanCompany.toLowerCase()];

    const row = [
      escapeCSV(stripProto(job.apply_url)),
      escapeCSV(cleanCompany),
      escapeCSV(stripProto(companyUrl)),
      escapeCSV(job.title),
      escapeCSV(normalizeLocation(job.location)),
      inferRemote(job.location),
      inferJobType(job.job_type),
      inferSeniority(job.title),
      inferDepartment(job.title),
      escapeCSV(extractSkills(job.title, cleanDesc)),
      escapeCSV(normalizeSalary(job.salary) !== '-' ? normalizeSalary(job.salary) : (extractSalaryFromDesc(cleanDesc) || '-')),
      escapeCSV(cleanDesc),
    ].join(',');

    rows.push(row);
  }

  // Split into 2 files to keep each under 100MB
  const DESKTOP = process.env.HOME + '/Desktop';
  const half = Math.ceil(rows.length / 2);

  for (let p = 0; p < 2; p++) {
    const ws = createWriteStream(`${DESKTOP}/cvinbio_part${p + 1}.csv`);
    ws.write(HEADER);
    const start = p * half;
    const end = Math.min(start + half, rows.length);
    for (let i = start; i < end; i++) ws.write(rows[i] + '\n');
    ws.end();
    console.log(`   Part ${p + 1}: ${end - start} rows → cvinbio_part${p + 1}.csv`);
  }

  console.log(`✅ ${rows.length} total rows across 2 files`);
  console.timeEnd('Total');
}

main().catch(console.error);
