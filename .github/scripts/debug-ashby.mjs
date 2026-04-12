// Test different Ashby fetch methods
async function main() {
  // Method 1: GET posting-api/posting/{id}
  const board = await fetch('https://api.ashbyhq.com/posting-api/job-board/airwallex').then(r => r.json());
  const testJob = board.jobs[0];
  console.log('Test job:', testJob.title, '- ID:', testJob.id);

  const r1 = await fetch('https://api.ashbyhq.com/posting-api/posting/' + testJob.id);
  console.log('Method 1 (GET posting-api/posting):', r1.status);

  // Method 2: POST posting-api/posting
  const r2 = await fetch('https://api.ashbyhq.com/posting-api/posting', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jobPostingId: testJob.id }),
  });
  console.log('Method 2 (POST posting-api/posting):', r2.status);
  if (r2.ok) {
    const d = await r2.json();
    const jd = (d.descriptionHtml || '').replace(/<[^>]+>/g, ' ').substring(0, 300);
    console.log('  JD preview:', jd);
  }

  // Method 3: Check if board listing has description
  console.log('\nBoard listing keys:', Object.keys(testJob));
  if (testJob.descriptionHtml) {
    const jd = testJob.descriptionHtml.replace(/<[^>]+>/g, ' ').substring(0, 200);
    console.log('  Board has JD:', jd);
  }
  if (testJob.description) console.log('  Has description field');
  
  // Method 4: Fetch using jobBoardToken
  const r4 = await fetch(`https://api.ashbyhq.com/posting-api/job-board/airwallex?includeCompensation=true`);
  if (r4.ok) {
    const d = await r4.json();
    const j = d.jobs?.[0];
    console.log('\nExtended board keys:', Object.keys(j || {}));
  }
}

main().catch(console.error);
