#!/usr/bin/env node
// Round 2: Fix failed directories + add new ones

import puppeteer from 'puppeteer';

const P = {
  name: 'CVin.Bio',
  url: 'https://cvin.bio',
  tagline: 'Upload your CV, get a live website and matched jobs in seconds.',
  desc: 'CVin.Bio converts any PDF resume into a live personal website with a shareable link. Upload once, get a mobile-ready portfolio page, and see jobs matched to your skills from 6,000+ listings. No ATS. Just a link that works while you sleep.',
  email: 'hi@cvin.bio',
};

const results = [];

async function fillGenericForm(page) {
  // Fill all text inputs based on field attributes
  const inputs = await page.$$('input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]):not([type="file"])');
  for (const inp of inputs) {
    try {
      const info = await inp.evaluate(el => ({
        n: (el.name || '').toLowerCase(),
        p: (el.placeholder || '').toLowerCase(),
        i: (el.id || '').toLowerCase(),
        t: el.type,
        v: el.value,
      }));
      const id = info.n + info.p + info.i;
      if (info.v) continue; // already filled
      if (info.t === 'submit') continue;
      
      if (id.includes('email') || info.t === 'email') {
        await inp.click({ clickCount: 3 });
        await inp.type(P.email, { delay: 20 });
      } else if (id.includes('url') || id.includes('website') || id.includes('link') || info.t === 'url') {
        await inp.click({ clickCount: 3 });
        await inp.type(P.url, { delay: 20 });
      } else if (id.includes('name') || id.includes('title') || id.includes('product')) {
        await inp.click({ clickCount: 3 });
        await inp.type(P.name, { delay: 20 });
      } else if (id.includes('tagline') || id.includes('pitch') || id.includes('slogan') || id.includes('short')) {
        await inp.click({ clickCount: 3 });
        await inp.type(P.tagline, { delay: 15 });
      }
    } catch (e) { /* skip inaccessible inputs */ }
  }
  
  // Fill textareas
  const textareas = await page.$$('textarea');
  for (const ta of textareas) {
    try {
      const val = await ta.evaluate(el => el.value);
      if (!val) {
        await ta.click();
        await ta.type(P.desc, { delay: 5 });
      }
    } catch (e) {}
  }
  
  // Try submitting
  const submitSelectors = [
    'button[type="submit"]',
    'input[type="submit"]',
    'button.submit',
    'button.btn-primary',
    'button.btn-submit',
  ];
  for (const sel of submitSelectors) {
    try {
      const btn = await page.$(sel);
      if (btn) {
        await btn.click();
        await new Promise(r => setTimeout(r, 3000));
        return true;
      }
    } catch (e) {}
  }
  
  // Try any button with submit-like text
  try {
    const buttons = await page.$$('button');
    for (const btn of buttons) {
      const text = await btn.evaluate(el => el.textContent.toLowerCase());
      if (text.includes('submit') || text.includes('send') || text.includes('launch') || text.includes('add')) {
        await btn.click();
        await new Promise(r => setTimeout(r, 3000));
        return true;
      }
    }
  } catch (e) {}
  
  return false;
}

async function tryDir(browser, name, url) {
  const page = await browser.newPage();
  page.setDefaultTimeout(15000);
  try {
    console.log(`  ${name}...`);
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 20000 });
    await new Promise(r => setTimeout(r, 2000));
    
    const submitted = await fillGenericForm(page);
    const status = submitted ? 'SUBMITTED' : 'FILLED';
    results.push({ name, status });
    console.log(`  ✅ ${name}: ${status}`);
  } catch (e) {
    results.push({ name, status: 'FAIL: ' + e.message.slice(0, 60) });
    console.log(`  ❌ ${name}: ${e.message.slice(0, 60)}`);
  } finally {
    await page.close().catch(() => {});
  }
}

async function main() {
  console.log('CVin.Bio Directory Submission - Round 2\n');
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled'],
  });

  const dirs = [
    ['LaunchingNext', 'https://www.launchingnext.com/submit/'],
    ['BetaPage', 'https://betapage.co/submit-your-startup'],
    ['Futurepedia', 'https://www.futurepedia.io/submit-tool'],
    ['AIToolDirectory', 'https://www.aitoolsdirectory.com/submit'],
    ['SaaSHub', 'https://www.saashub.com/submit'],
    ['DevHunt', 'https://devhunt.org/submit'],
    ['Launched', 'https://launched.io/submit'],
    ['SideProjectors', 'https://www.sideprojectors.com/project/new'],
    ['MicroLaunch', 'https://microlaunch.net/submit'],
    ['Uneed', 'https://uneed.best/submit'],
    ['PitchWall', 'https://pitchwall.co/submit'],
    ['StartupRanking', 'https://www.startupranking.com/startup/create'],
    ['1000tools', 'https://1000.tools/submit'],
    ['AItoolsClub', 'https://www.aitoolsclub.com/submit'],
    ['OpenFuture', 'https://openfuture.ai/submit'],
    ['AItoolNet', 'https://www.aitool.net/submit'],
    ['DoMore', 'https://domore.ai/submit'],
    ['SaaSWorthy', 'https://www.saasworthy.com/add-product'],
    ['Geekflare', 'https://geekflare.com/submit-tool/'],
  ];

  for (const [name, url] of dirs) {
    await tryDir(browser, name, url);
  }

  await browser.close();

  console.log('\n' + '='.repeat(50));
  let ok = 0, fail = 0;
  for (const r of results) {
    const icon = r.status.startsWith('FAIL') ? '❌' : '✅';
    console.log(`${icon} ${r.name.padEnd(20)} ${r.status}`);
    if (r.status.startsWith('FAIL')) fail++; else ok++;
  }
  console.log(`\n✅ ${ok}  ❌ ${fail}`);
}

main().catch(console.error);
