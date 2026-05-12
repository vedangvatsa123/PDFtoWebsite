import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const file = join(__dirname, '..', '.github', 'scripts', 'x-content.json');
const content = JSON.parse(readFileSync(file, 'utf8'));

const ctaMap = {
  'what-hiring-managers-look-at': "PDFs get filtered. Links get clicked.\n\nTurn your CV into a live website in 30 seconds. No code. No design skills. Just upload and share.\n\ncvin.bio",
  'first-dev-job-90-days': "90 days is not a lot of time. But it is enough to build a foundation that gets you in the door.\n\nSkip the PDF. Turn your CV into a website that hiring managers can actually browse and share.\n\ncvin.bio",
  'portfolio-projects-that-impress': "The best portfolio is not the one with the most projects. It is the one people can actually see.\n\nTurn your CV into a shareable website with live project links. Takes 30 seconds. Free.\n\ncvin.bio",
  'salary-negotiation-playbook': "One negotiation conversation can be worth $100K or more over the life of your career.\n\nBefore you walk in, make sure your profile is a website, not a PDF. Upload your CV and get a live link in 30 seconds.\n\ncvin.bio",
  'startup-truths': "Startups are not better or worse than big companies. They are different.\n\nWherever you end up, make your CV a website that anyone can open with one tap. No downloads. No attachments.\n\ncvin.bio",
};

let updated = 0;
for (const thread of content.threads) {
  if (ctaMap[thread.topic]) {
    const lastIdx = thread.tweets.length - 1;
    thread.tweets[lastIdx].text = ctaMap[thread.topic];
    updated++;
    console.log(`✅ Updated CTA for "${thread.topic}"`);
  }
}

writeFileSync(file, JSON.stringify(content, null, 2) + '\n');
console.log(`\nDone. Updated ${updated} CTAs.`);
