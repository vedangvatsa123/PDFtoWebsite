import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const SB = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SK = process.env.SUPABASE_SERVICE_ROLE_KEY;
const headers = { 'apikey': SK, 'Authorization': `Bearer ${SK}` };

async function main() {
  // Fetch ALL jobs
  const allJobs = [];
  let offset = 0;
  while (true) {
    const r = await fetch(`${SB}/rest/v1/jobs?select=title,company,location,tags,source,created_at&offset=${offset}&limit=1000`, { headers });
    const d = await r.json();
    if (!d.length) break;
    allJobs.push(...d);
    offset += d.length;
    if (d.length < 1000) break;
  }

  console.log(`Total jobs in DB: ${allJobs.length}`);

  // 1. Location breakdown
  const locationMap = {};
  for (const j of allJobs) {
    const loc = (j.location || '').toLowerCase();
    let region = 'Other';
    if (/singapore|\bsg\b/.test(loc)) region = 'Singapore';
    else if (/malaysia|kuala lumpur|\bmy\b|petaling|penang|johor|cyberjaya|selangor/.test(loc)) region = 'Malaysia';
    else if (/india|bangalore|bengaluru|mumbai|delhi|hyderabad|pune|chennai|gurgaon|noida/.test(loc)) region = 'India';
    else if (/japan|tokyo|osaka/.test(loc)) region = 'Japan';
    else if (/australia|sydney|melbourne/.test(loc)) region = 'Australia';
    else if (/hong kong|\bhk\b/.test(loc)) region = 'Hong Kong';
    else if (/china|shanghai|beijing|shenzhen/.test(loc)) region = 'China';
    else if (/korea|seoul/.test(loc)) region = 'South Korea';
    else if (/taiwan|taipei/.test(loc)) region = 'Taiwan';
    else if (/indonesia|jakarta/.test(loc)) region = 'Indonesia';
    else if (/thailand|bangkok/.test(loc)) region = 'Thailand';
    else if (/vietnam|ho chi minh|hanoi/.test(loc)) region = 'Vietnam';
    else if (/philippines|manila/.test(loc)) region = 'Philippines';
    else if (/remote/.test(loc)) region = 'Remote';
    else if (/united states|usa|\bus\b|new york|san francisco|california/.test(loc)) region = 'USA';
    else if (/united kingdom|\buk\b|london/.test(loc)) region = 'UK';
    else if (/europe|germany|france|netherlands|berlin/.test(loc)) region = 'Europe';
    locationMap[region] = (locationMap[region] || 0) + 1;
  }

  // 2. Source/ATS breakdown
  const sourceMap = {};
  for (const j of allJobs) { sourceMap[j.source || 'unknown'] = (sourceMap[j.source || 'unknown'] || 0) + 1; }

  // 3. Company job count (top 30)
  const companyMap = {};
  for (const j of allJobs) { companyMap[j.company || 'unknown'] = (companyMap[j.company || 'unknown'] || 0) + 1; }

  // 4. Role categories
  const roleCategories = {
    'Software Engineering': /engineer|developer|software|programmer|fullstack|full.stack|frontend|front.end|backend|back.end/i,
    'Data & Analytics': /data.scien|data.eng|data.analy|analytics|bi\b|business.intel/i,
    'Machine Learning & AI': /machine.learn|ml.eng|ai.eng|deep.learn|nlp|computer.vision|llm|gen.?ai/i,
    'DevOps & Infrastructure': /devops|sre|site.reliab|platform|infrastructure|cloud.eng|reliability/i,
    'Product Management': /product.manag|program.manag|tpm|technical.program/i,
    'Design': /designer|ux|ui.design|product.design/i,
    'Security': /security|cyber|infosec|appsec/i,
    'Mobile': /mobile|ios|android|react.native|flutter/i,
    'QA & Testing': /qa|quality.assur|test.eng|sdet|automation.eng/i,
    'Management & Leadership': /engineering.manager|tech.lead|director|vp.eng|head.of.eng|cto/i,
    'Sales & Business': /sales.eng|solutions.eng|presales|account|business/i,
    'Other Technical': /.*/i,
  };
  const roleCounts = {};
  for (const j of allJobs) {
    const tl = j.title || '';
    let matched = false;
    for (const [cat, pat] of Object.entries(roleCategories)) {
      if (cat === 'Other Technical') continue;
      if (pat.test(tl)) { roleCounts[cat] = (roleCounts[cat] || 0) + 1; matched = true; break; }
    }
    if (!matched) roleCounts['Other Technical'] = (roleCounts['Other Technical'] || 0) + 1;
  }

  // 5. Seniority distribution
  const seniority = { 'Intern/New Grad': 0, 'Junior/Associate': 0, 'Mid-level': 0, 'Senior': 0, 'Staff/Principal': 0, 'Director/VP/C-Suite': 0 };
  for (const j of allJobs) {
    const tl = (j.title || '').toLowerCase();
    if (/intern|internship|new.grad|graduate|entry/i.test(tl)) seniority['Intern/New Grad']++;
    else if (/junior|associate|jr\b/i.test(tl)) seniority['Junior/Associate']++;
    else if (/senior|sr\b/i.test(tl)) seniority['Senior']++;
    else if (/staff|principal|distinguished|fellow/i.test(tl)) seniority['Staff/Principal']++;
    else if (/director|vp|vice.president|head.of|chief|c-level|cto|ceo|cfo/i.test(tl)) seniority['Director/VP/C-Suite']++;
    else seniority['Mid-level']++;
  }

  // 6. Skills from tags
  const skillTags = {};
  for (const j of allJobs) {
    for (const t of (j.tags || [])) {
      const s = t.toLowerCase().trim();
      if (s && s.length > 1) skillTags[s] = (skillTags[s] || 0) + 1;
    }
  }

  // 7. SG+MY specific analysis
  const sgMyJobs = allJobs.filter(j => {
    const loc = (j.location || '').toLowerCase();
    return /singapore|\bsg\b|malaysia|kuala lumpur|\bmy\b|petaling|penang/.test(loc);
  });
  const sgCount = sgMyJobs.filter(j => /singapore|\bsg\b/.test((j.location || '').toLowerCase())).length;
  const myCount = sgMyJobs.filter(j => /malaysia|kuala lumpur|\bmy\b|petaling|penang/.test((j.location || '').toLowerCase())).length;

  // SG+MY role breakdown
  const sgMyRoles = {};
  for (const j of sgMyJobs) {
    const tl = j.title || '';
    for (const [cat, pat] of Object.entries(roleCategories)) {
      if (cat === 'Other Technical') continue;
      if (pat.test(tl)) { sgMyRoles[cat] = (sgMyRoles[cat] || 0) + 1; break; }
    }
  }

  // SG+MY company breakdown (top 15)
  const sgMyCompanies = {};
  for (const j of sgMyJobs) { sgMyCompanies[j.company || 'unknown'] = (sgMyCompanies[j.company || 'unknown'] || 0) + 1; }

  // 8. Remote-friendly %
  const remoteJobs = allJobs.filter(j => /remote/i.test(j.location || '')).length;
  const hybridJobs = allJobs.filter(j => /hybrid/i.test(j.location || '')).length;

  // Print all
  console.log('\n=== LOCATION BREAKDOWN ===');
  Object.entries(locationMap).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.log(`  ${k}: ${v} (${(v/allJobs.length*100).toFixed(1)}%)`));

  console.log('\n=== ATS SOURCE ===');
  Object.entries(sourceMap).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.log(`  ${k}: ${v}`));

  console.log('\n=== TOP 30 COMPANIES ===');
  Object.entries(companyMap).sort((a, b) => b[1] - a[1]).slice(0, 30).forEach(([k, v]) => console.log(`  ${k}: ${v}`));

  console.log('\n=== ROLE CATEGORIES ===');
  Object.entries(roleCounts).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.log(`  ${k}: ${v} (${(v/allJobs.length*100).toFixed(1)}%)`));

  console.log('\n=== SENIORITY ===');
  Object.entries(seniority).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.log(`  ${k}: ${v} (${(v/allJobs.length*100).toFixed(1)}%)`));

  console.log('\n=== TOP 30 SKILL TAGS ===');
  Object.entries(skillTags).sort((a, b) => b[1] - a[1]).slice(0, 30).forEach(([k, v]) => console.log(`  ${k}: ${v}`));

  console.log('\n=== SG + MY ===');
  console.log(`  Singapore: ${sgCount}`);
  console.log(`  Malaysia: ${myCount}`);
  console.log('  Top roles:');
  Object.entries(sgMyRoles).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.log(`    ${k}: ${v}`));
  console.log('  Top companies:');
  Object.entries(sgMyCompanies).sort((a, b) => b[1] - a[1]).slice(0, 15).forEach(([k, v]) => console.log(`    ${k}: ${v}`));

  console.log('\n=== REMOTE/HYBRID ===');
  console.log(`  Remote: ${remoteJobs} (${(remoteJobs/allJobs.length*100).toFixed(1)}%)`);
  console.log(`  Hybrid: ${hybridJobs} (${(hybridJobs/allJobs.length*100).toFixed(1)}%)`);

  // 9. CSV-specific deep analysis (SG+MY with skills)
  const { readFileSync } = await import('fs');
  const csv = readFileSync('/Users/vedang/Documents/sg_my_tech_jobs.csv', 'utf-8');
  const csvRows = csv.split('\n').slice(1).filter(l => l.trim());
  
  function parseCsvRow(row) {
    const f = []; let cur = ''; let inQ = false;
    for (let i = 0; i < row.length; i++) {
      if (row[i] === '"') { if (inQ && row[i+1] === '"') { cur += '"'; i++; } else inQ = !inQ; }
      else if (row[i] === ',' && !inQ) { f.push(cur); cur = ''; } else { cur += row[i]; }
    }
    f.push(cur); return f;
  }

  const csvSkills = {};
  const csvExams = {};
  const csvCourses = {};
  const sgSkills = {};
  const mySkills = {};
  for (const row of csvRows) {
    const f = parseCsvRow(row);
    const loc = f[1] || '';
    const skills = (f[5] || '').split(',').map(s => s.trim()).filter(Boolean);
    for (const s of skills) {
      csvSkills[s] = (csvSkills[s] || 0) + 1;
      if (loc === 'Singapore') sgSkills[s] = (sgSkills[s] || 0) + 1;
      if (loc === 'Malaysia') mySkills[s] = (mySkills[s] || 0) + 1;
    }
    const exam = f[8] || '';
    if (exam) csvExams[exam] = (csvExams[exam] || 0) + 1;
    const course = f[6] || '';
    if (course) csvCourses[course] = (csvCourses[course] || 0) + 1;
  }

  console.log('\n=== CSV SKILLS (SG+MY) - TOP 25 ===');
  Object.entries(csvSkills).sort((a, b) => b[1] - a[1]).slice(0, 25).forEach(([k, v]) => console.log(`  ${k}: ${v}`));

  console.log('\n=== SKILLS BY COUNTRY ===');
  console.log('  Singapore top 10:');
  Object.entries(sgSkills).sort((a, b) => b[1] - a[1]).slice(0, 10).forEach(([k, v]) => console.log(`    ${k}: ${v}`));
  console.log('  Malaysia top 10:');
  Object.entries(mySkills).sort((a, b) => b[1] - a[1]).slice(0, 10).forEach(([k, v]) => console.log(`    ${k}: ${v}`));

  console.log('\n=== TOP CERTIFICATIONS ===');
  Object.entries(csvExams).sort((a, b) => b[1] - a[1]).slice(0, 15).forEach(([k, v]) => console.log(`  ${k}: ${v}`));

  console.log('\n=== TOP LEARNING RESOURCES ===');
  Object.entries(csvCourses).sort((a, b) => b[1] - a[1]).slice(0, 15).forEach(([k, v]) => console.log(`  ${k}: ${v}`));
}

main().catch(console.error);
