import fs from 'fs';

const SUPABASE_URL = 'https://mkrwlyjjlngzozekkmec.supabase.co';
const SUPABASE_KEY = '***REMOVED***';

async function fetchAllJobs() {
  const allJobs = [];
  let offset = 0;
  const limit = 1000;
  
  console.log('Fetching jobs from Supabase...');
  while (true) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/jobs?select=title,company,location,job_type,salary,category,tags,source&offset=${offset}&limit=${limit}`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });
    
    if (!res.ok) {
      console.error('Failed to fetch', await res.text());
      break;
    }
    
    const data = await res.json();
    if (data.length === 0) break;
    
    allJobs.push(...data);
    offset += limit;
    process.stdout.write(`Fetched ${allJobs.length}...\r`);
  }
  
  console.log(`\nTotal jobs fetched: ${allJobs.length}`);
  return allJobs;
}

function analyzeJobs(jobs) {
  const stats = {
    total: jobs.length,
    workArrangement: { remote: 0, hybrid: 0, onsite: 0, unspecified: 0 },
    departments: { engineering: 0, design: 0, product: 0, marketing: 0, sales: 0, hr: 0, finance: 0, support: 0 },
    techStacks: {},
    topCompanies: {},
    remoteByDept: { engineering: 0, design: 0, marketing: 0, sales: 0, ops: 0 },
    deptTotals: { engineering: 0, design: 0, marketing: 0, sales: 0, ops: 0 },
  };

  for (const job of jobs) {
    const title = (job.title || '').toLowerCase();
    const loc = (job.location || '').toLowerCase();
    const type = (job.job_type || '').toLowerCase();
    
    // Work arrangement
    let isRemote = false;
    if (loc.includes('remote') || type.includes('remote')) {
      stats.workArrangement.remote++;
      isRemote = true;
    } else if (loc.includes('hybrid') || type.includes('hybrid')) {
      stats.workArrangement.hybrid++;
    } else if (loc) {
      stats.workArrangement.onsite++;
    } else {
      stats.workArrangement.unspecified++;
    }

    // Departments
    let dept = null;
    if (title.includes('engineer') || title.includes('developer') || title.includes('frontend') || title.includes('backend') || title.includes('fullstack')) { stats.departments.engineering++; dept = 'engineering'; }
    else if (title.includes('design') || title.includes('ui/ux') || title.includes('ux')) { stats.departments.design++; dept = 'design'; }
    else if (title.includes('product manager') || title.includes('pm')) { stats.departments.product++; }
    else if (title.includes('marketing') || title.includes('growth') || title.includes('content') || title.includes('seo')) { stats.departments.marketing++; dept = 'marketing'; }
    else if (title.includes('sales') || title.includes('account executive') || title.includes('sdr') || title.includes('bdr')) { stats.departments.sales++; dept = 'sales'; }
    else if (title.includes('hr') || title.includes('recruiter') || title.includes('talent')) { stats.departments.hr++; }
    else if (title.includes('finance') || title.includes('accountant') || title.includes('controller')) { stats.departments.finance++; }
    else if (title.includes('support') || title.includes('customer success')) { stats.departments.support++; }
    else if (title.includes('operat')) { dept = 'ops'; }

    // Remote by Dept
    if (dept && stats.deptTotals[dept] !== undefined) {
      stats.deptTotals[dept]++;
      if (isRemote) stats.remoteByDept[dept]++;
    }

    // Tech Stacks
    if (job.tags && Array.isArray(job.tags)) {
      for (const tag of job.tags) {
        if (!['Engineering', 'Design', 'Marketing', 'Sales'].includes(tag)) {
          stats.techStacks[tag] = (stats.techStacks[tag] || 0) + 1;
        }
      }
    }

    // Top Companies
    if (job.company) {
      stats.topCompanies[job.company] = (stats.topCompanies[job.company] || 0) + 1;
    }
  }

  return stats;
}

async function main() {
  const jobs = await fetchAllJobs();
  const stats = analyzeJobs(jobs);
  
  console.log('\n--- DEEP RESEARCH RESULTS ---');
  
  const knownArrangements = stats.workArrangement.remote + stats.workArrangement.hybrid + stats.workArrangement.onsite;
  console.log('\nWork Arrangement (of known):');
  console.log(`Remote: ${Math.round(stats.workArrangement.remote / knownArrangements * 100)}%`);
  console.log(`Hybrid: ${Math.round(stats.workArrangement.hybrid / knownArrangements * 100)}%`);
  console.log(`On-Site: ${Math.round(stats.workArrangement.onsite / knownArrangements * 100)}%`);

  console.log('\nRemote % by Department:');
  for (const [dept, total] of Object.entries(stats.deptTotals)) {
    if (total > 0) {
      console.log(`${dept}: ${Math.round(stats.remoteByDept[dept] / total * 100)}% remote (out of ${total} jobs)`);
    }
  }

  console.log('\nTop Tech Stacks:');
  const sortedTech = Object.entries(stats.techStacks).sort((a, b) => b[1] - a[1]).slice(0, 15);
  for (const [tech, count] of sortedTech) {
    console.log(`${tech}: ${Math.round(count / stats.total * 100)}% (${count})`);
  }

  console.log('\nTop Hiring Companies:');
  const sortedComp = Object.entries(stats.topCompanies).sort((a, b) => b[1] - a[1]).slice(0, 10);
  for (const [comp, count] of sortedComp) {
    console.log(`${comp}: ${count} jobs`);
  }
}

main().catch(console.error);
