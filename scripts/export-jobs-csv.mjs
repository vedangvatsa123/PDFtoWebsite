#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import { writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '../.env.local') });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

// ── Decode HTML entities ──
function dec(str) {
  if (!str) return '';
  return String(str)
    .replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"')
    .replace(/&#39;|&apos;|&#x27;/g,"'").replace(/&nbsp;/g,' ')
    .replace(/&#(\d+);/g,(_,n)=>String.fromCharCode(+n))
    .replace(/&#x([0-9a-fA-F]+);/g,(_,h)=>String.fromCharCode(parseInt(h,16)));
}

// ── HTML → clean plain text ──
function htmlToText(html) {
  if (!html) return '';
  let t = dec(html);
  t = t.replace(/<img[^>]*>/gi,'').replace(/<br\s*\/?>/gi,' ');
  t = t.replace(/<\/(p|div|li|h[1-6]|tr|blockquote)>/gi,' ');
  t = t.replace(/<[^>]+>/g,'');
  t = dec(t); // second pass for double-encoded
  t = t.replace(/[\r\n\t]+/g,' ').replace(/\s{2,}/g,' ').trim();
  return t;
}

// ── Extract salary from description text ──
function extractSalary(existingSalary, descText) {
  if (existingSalary && existingSalary.trim()) return existingSalary.trim();
  if (!descText) return '';
  
  // Only match salary when preceded by context words to avoid "$138M in funding"
  // We use capture group (1) to grab JUST the monetary amount, omitting the prefix.
  const salaryPatterns = [
    // "Salary: $X - $Y" or "Compensation: $X-$Y" or "Pay range: $X to $Y"
    /(?:salary|compensation|pay\s*(?:range)?|base\s*(?:salary)?|total\s*comp|annual\s*(?:salary)?|hourly\s*(?:rate)?)[:\s-]+(\$[\d,.]+(?:k)?\s*[-–—to]+\s*\$[\d,.]+(?:k)?(?:\s*(?:per\s+)?(?:year|yr|annually|annual|hour|hr|month|mo|week|wk))?)/i,
    // "$X,000 - $Y,000 per year/annually" (must have pay period OR be clearly annual: 5+ digits)
    /(\$\d{2,3},\d{3}\s*[-–—to]+\s*\$\d{2,3},\d{3}(?:\s*(?:per\s+)?(?:year|yr|annually|annual))?)/i,
    // "$Xk - $Yk" (clearly annual shorthand)
    /(\$\d+(?:\.\d+)?k\s*[-–—to]+\s*\$\d+(?:\.\d+)?k)/i,
    // "$X/hr" or "$X per hour" (hourly rate)
    /(\$\d[\d,.]*\s*(?:\/|-)\s*(?:\$\d[\d,.]*\s*(?:\/|-)\s*)?(?:hr|hour|h)\b)/i,
    // "$X - $Y /hour" or "$X-$Y per hour"
    /(\$[\d,.]+\s*[-–—to]+\s*\$[\d,.]+\s*(?:\/\s*)?(?:per\s+)?(?:hour|hr)\b)/i,
  ];
  
  for (const p of salaryPatterns) {
    const m = descText.match(p);
    if (m && m[1]) {
      let val = m[1].trim();
      // Skip if it looks like a funding amount ($XXM, $XXB)
      if (/\$[\d,.]+\s*[MB]\b/i.test(val)) continue;
      
      // If it's an ambiguous small number (e.g. $26-$28), explicitly append /hr or /mo
      if (!/(hr|hour|mo|month|yr|year|annual|k)/i.test(val)) {
        const nums = val.replace(/,/g,'').match(/\d+/g);
        if (nums) {
          const max = Math.max(...nums.map(Number));
          if (max < 500) val += ' /hr';
          else if (max < 20000) val += ' /mo';
        }
      }
      return val;
    }
  }
  return '';
}

// ── Extract skills from description ──
const SKILL_KEYWORDS = [
  'JavaScript','TypeScript','Python','Java','Go','Golang','Rust','Ruby','C++','C#','PHP','Swift','Kotlin',
  'Scala','R','SQL','NoSQL','GraphQL','REST','gRPC',
  'React','Angular','Vue','Next.js','Node.js','Express','Django','Flask','Spring','Rails',
  'AWS','Azure','GCP','Docker','Kubernetes','Terraform','CI/CD','Jenkins','GitHub Actions',
  'PostgreSQL','MySQL','MongoDB','Redis','Elasticsearch','Kafka','RabbitMQ','DynamoDB',
  'Machine Learning','Deep Learning','NLP','LLM','Computer Vision','PyTorch','TensorFlow',
  'Figma','Sketch','HTML','CSS','Tailwind','SASS',
  'Git','Linux','Nginx','Apache','Spark','Airflow','dbt','Snowflake','BigQuery','Databricks',
  'Tableau','Power BI','Looker','Metabase',
  'Solidity','Web3','Blockchain','Ethereum','Smart Contracts',
  'iOS','Android','React Native','Flutter',
  'Agile','Scrum','Jira','Confluence',
];
const SKILL_RE = SKILL_KEYWORDS.map(s => ({ name: s, re: new RegExp('\\b' + s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&').replace(/\s+/g,'\\s+') + '\\b', 'i') }));

function extractSkillsFromDesc(descText) {
  if (!descText) return [];
  const found = new Set();
  for (const { name, re } of SKILL_RE) {
    if (re.test(descText)) found.add(name);
  }
  return [...found];
}

// ── Merge tags: combine ATS tags + description-extracted skills ──
function mergeSkills(atsTags, descText) {
  const existing = (atsTags || []).map(t => t.trim()).filter(Boolean);
  const extracted = extractSkillsFromDesc(descText);
  // Deduplicate case-insensitively
  const seen = new Set(existing.map(s => s.toLowerCase()));
  for (const s of extracted) {
    if (!seen.has(s.toLowerCase())) { existing.push(s); seen.add(s.toLowerCase()); }
  }
  // Filter out generic tags that aren't really skills
  const generic = new Set(['remote','marketing and communication','it','it security','software development','social media manager','management','team leader']);
  return existing.filter(s => !generic.has(s.toLowerCase()));
}

// ── Normalize job type ──
function normalizeJobType(jt) {
  if (!jt) return '';
  const t = jt.toLowerCase().trim();
  if (/full[_\s-]?time|vollzeit|full time/i.test(t)) return 'Full-Time';
  if (/part[_\s-]?time|teilzeit/i.test(t)) return 'Part-Time';
  if (/contract|freelance|contractor/i.test(t)) return 'Contract';
  if (/intern|praktik|werkstudent|working student|berufseinstieg/i.test(t)) return 'Internship';
  if (/manager|berufserfahren/i.test(t)) return 'Full-Time';
  return jt; // return original if unknown
}

// ── Company URL: extract from apply URL when possible ──
const COMPANY_DOMAINS = {
  'delivery hero':'deliveryhero.com','visa':'visa.com','wise':'wise.com','grab':'grab.com',
  'zscaler':'zscaler.com','verkada':'verkada.com','samsara':'samsara.com','coreweave':'coreweave.com',
  'affirm':'affirm.com','waymo':'waymo.com','ashby':'ashbyhq.com','unity technologies':'unity.com',
  'riot games':'riotgames.com','duolingo':'duolingo.com','whoop':'whoop.com','veeva':'veeva.com',
  'ripple':'ripple.com','coinbase':'coinbase.com','stripe':'stripe.com','airbnb':'airbnb.com',
  'cloudflare':'cloudflare.com','discord':'discord.com','reddit':'reddit.com','figma':'figma.com',
  'gitlab':'gitlab.com','lyft':'lyft.com','pinterest':'pinterest.com','spotify':'spotify.com',
  'openai':'openai.com','anthropic':'anthropic.com','databricks':'databricks.com',
  'scale ai':'scale.com','doordash':'doordash.com','grafana labs':'grafana.com','plaid':'plaid.com',
  'notion':'notion.so','ramp':'ramp.com','brex':'brex.com','canva':'canva.com','zapier':'zapier.com',
  'vercel':'vercel.com','supabase':'supabase.com','linear':'linear.app','datadog':'datadoghq.com',
  'twilio':'twilio.com','hubspot':'hubspot.com','atlassian':'atlassian.com','asana':'asana.com',
  'gusto':'gusto.com','rippling':'rippling.com','deel':'deel.com','dropbox':'dropbox.com',
  'consensys':'consensys.io','lucid motors':'lucidmotors.com','relativity space':'relativityspace.com',
  'one medical':'onemedical.com','clover health':'cloverhealth.com',
};
const JOB_BOARD_HOSTS = ['greenhouse.io','lever.co','smartrecruiters.com','ashbyhq.com','arbeitnow.com','remoteok.com','weworkremotely.com','remotive.com','workable.com'];

function guessCompanyUrl(company, applyUrl) {
  const key = (company||'').toLowerCase().trim();
  if (COMPANY_DOMAINS[key]) return COMPANY_DOMAINS[key];
  try {
    const u = new URL(applyUrl);
    const host = u.hostname.replace(/^www\./,'');
    // If the apply URL is on the company's own domain (not a job board), use it
    if (!JOB_BOARD_HOSTS.some(jb => host.includes(jb))) return host;
    // For Greenhouse: many companies use custom domains like careers.company.com
    // Try extracting from path for greenhouse: /company-slug/jobs/...
    if (host.includes('greenhouse.io')) {
      const m = applyUrl.match(/greenhouse\.io\/([a-z0-9_-]+)/i);
      if (m) return m[1].replace(/[-_]/g,'') + '.com';
    }
    if (host.includes('lever.co')) {
      const m = applyUrl.match(/lever\.co\/([a-z0-9_-]+)/i);
      if (m) return m[1].replace(/[-_]/g,'') + '.com';
    }
    const slug = key.replace(/[^a-z0-9]+/g,'');
    return slug ? slug + '.com' : '';
  } catch { return ''; }
}

// ── Seniority ──
function deriveSeniority(title) {
  const t = (title||'').toLowerCase();
  if (/\b(intern|internship|apprentice|trainee|werkstudent)\b/.test(t)) return 'Intern';
  if (/\b(junior|jr\.?|entry|berufseinstieg)\b/.test(t)) return 'Junior';
  if (/\b(associate)\b/.test(t)) return 'Associate';
  if (/\b(senior|sr\.?)\b/.test(t)) return 'Senior';
  if (/\b(staff|principal)\b/.test(t)) return 'Staff';
  if (/\b(lead|team lead|tech lead)\b/.test(t)) return 'Lead';
  if (/\b(manager|mgr)\b/.test(t)) return 'Manager';
  if (/\b(director|head of|head,)\b/.test(t)) return 'Director';
  if (/\b(vp|vice president)\b/.test(t)) return 'VP';
  if (/\b(c[etfo]o|chief|founder|founding)\b/.test(t)) return 'C-Level / Founding';
  return 'Mid';
}

// ── Department ──
function deriveDepartment(title, tags, category, descText = '') {
  if (category) return category;
  const t = (title||'').toLowerCase();
  if (/engineer|developer|swe|software|devops|sre|platform eng/.test(t)) return 'Engineering';
  if (/data scien|data analy|analytics|bi engineer|data eng/.test(t)) return 'Data & Analytics';
  if (/machine learning|ml |ai engineer|deep learning|nlp|llm/.test(t)) return 'AI / ML';
  if (/product manag|product own|tpm|program manag/.test(t)) return 'Product';
  if (/design|ux|ui\/ux/.test(t)) return 'Design';
  if (/market|growth|seo|sem|content strat/.test(t)) return 'Marketing';
  if (/\bsale|account exec|business dev|bdm/.test(t)) return 'Sales';
  if (/recrui|talent|people|hr /.test(t)) return 'People & HR';
  if (/financ|account|controller|treasury/.test(t)) return 'Finance';
  if (/legal|counsel|compliance/.test(t)) return 'Legal';
  if (/customer|support|success/.test(t)) return 'Customer Success';
  if (/operations|ops /.test(t)) return 'Operations';
  if (/security|infosec|cyber/.test(t)) return 'Security';
  if (/qa|quality|test /.test(t)) return 'QA';
  if (/nurse|physician|medical|clinical/.test(t)) return 'Healthcare';
  const tagStr = (tags||[]).join(' ').toLowerCase();
  if (/engineering/.test(tagStr)) return 'Engineering';
  if (/marketing/.test(tagStr)) return 'Marketing';
  if (/sales/.test(tagStr)) return 'Sales';
  
  // Fallback to searching description if title is ambiguous
  const d = descText.toLowerCase();
  if (/software engineering|front-end|back-end|full-stack/i.test(d)) return 'Engineering';
  if (/marketing strategy|demand generation/i.test(d)) return 'Marketing';
  if (/sales quota|closing deals/i.test(d)) return 'Sales';
  
  return 'Other';
}

// ── Junk locations ──
const JUNK_LOCATIONS = new Set([
  'full-stack programming','back-end programming','front-end programming','customer support',
  'sales and marketing','product','management and finance','devops and sysadmin','design',
  'all other remote','copywriting','data','human resources','legal','teaching','writing',
]);
function cleanLocation(location) {
  if (!location) return '';
  const t = dec(location).trim();
  if (JUNK_LOCATIONS.has(t.toLowerCase())) return 'Remote';
  return t;
}
function isRemote(loc) { return /remote|anywhere|distributed|worldwide|global/i.test(loc); }

// ── CSV escape: always double-quote, decode entities, single-line ──
function csvEscape(val) {
  if (val == null) return '""';
  const str = dec(String(val)).replace(/[\r\n]+/g,' ');
  return '"' + str.replace(/"/g,'""') + '"';
}

// ═══════════════ MAIN ═══════════════
const allJobs = [];
let page = 0;
const BS = 500;
console.log('Fetching jobs from Supabase...');
while (true) {
  const { data, error } = await supabase.from('jobs')
    .select('id,title,company,location,job_type,salary,tags,apply_url,category,source,published_at,description')
    .not('company','ilike','%Gopuff%')
    .order('published_at',{ascending:false,nullsFirst:false})
    .range(page*BS,(page+1)*BS-1);
  if (error) { console.error('Error:',error.message); break; }
  if (!data||!data.length) break;
  allJobs.push(...data);
  process.stdout.write(`  ${allJobs.length} jobs...\r`);
  if (data.length<BS) break;
  page++;
}
console.log(`\nTotal: ${allJobs.length} jobs from ${new Set(allJobs.map(j=>j.company)).size} companies`);

// Build CSV
const headers = ['URL','Company','Company URL','Job Title','Location','Remote','Job Type',
  'Seniority','Department','Skills','Compensation','Source','Category','Published Date','Description'];
const lines = [headers.map(csvEscape).join(',')];

let salaryExtracted = 0;
let skillsEnriched = 0;

for (const job of allJobs) {
  const descPlain = htmlToText(job.description);
  
  // Skip if description is completely empty
  if (!descPlain || !descPlain.trim()) continue;
  
  // Filter out German roles
  const titleLow = (job.title || '').toLowerCase();
  const locLow = (job.location || '').toLowerCase();
  if (
    /(?:praktikant|werkstudent|berufseinstieg|ausbildung|\(m\/w\/d\)|m\/w\/d)/i.test(titleLow) ||
    locLow.includes('germany') || locLow.includes('deutschland') || locLow.includes('münchen') || locLow.includes('berlin')
  ) {
    continue;
  }

  const loc = cleanLocation(job.location);
  const salary = extractSalary(job.salary, descPlain);
  if (!job.salary && salary) salaryExtracted++;
  const skills = mergeSkills(job.tags, descPlain);
  if (skills.length > (job.tags||[]).length) skillsEnriched++;

  // Backfill category if missing
  let category = job.category;
  if (!category || !category.trim()) {
    category = deriveDepartment(job.title, job.tags, null, descPlain);
  }

  lines.push([
    csvEscape(job.apply_url||''),
    csvEscape(job.company||''),
    csvEscape(guessCompanyUrl(job.company,job.apply_url)),
    csvEscape(job.title||''),
    csvEscape(loc),
    csvEscape(isRemote(loc)?'Yes':'No'),
    csvEscape(normalizeJobType(job.job_type)),
    csvEscape(deriveSeniority(job.title)),
    csvEscape(deriveDepartment(job.title,job.tags,job.category,descPlain)),
    csvEscape(skills.join('; ')),
    csvEscape(salary),
    csvEscape(job.source||''),
    csvEscape(category),
    csvEscape(job.published_at?new Date(job.published_at).toISOString().split('T')[0]:''),
    csvEscape(descPlain),
  ].join(','));
}

const outPath = resolve(__dirname,'cvinbio-jobs-export.csv');
writeFileSync(outPath,lines.join('\n'),'utf-8');

// Validate
let bad=0;
for (const l of lines){let c=0,q=false;for(const ch of l){if(ch==='"')q=!q;else if(ch===','&&!q)c++;}if(c!==14)bad++;}

console.log(`\n✅ ${outPath}`);
console.log(`   ${allJobs.length} rows, ${headers.length} cols`);
console.log(`   Format: ${bad?'⚠️ '+bad+' bad rows':'✅ all valid'}`);
console.log(`\n📊 Enrichment:`);
console.log(`   Salaries extracted from desc: +${salaryExtracted}`);
console.log(`   Jobs with skills enriched from desc: +${skillsEnriched}`);
const ws=allJobs.filter(j=>extractSalary(j.salary,htmlToText(j.description)));
const rs=allJobs.filter(j=>isRemote(cleanLocation(j.location)));
console.log(`   Total with compensation: ${ws.length}`);
console.log(`   Total remote: ${rs.length}`);
console.log(`   Total with description: ${allJobs.filter(j=>j.description).length}`);
