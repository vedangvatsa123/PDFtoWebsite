#!/usr/bin/env node
// Headless browser directory submission script
// Uses Puppeteer to fill and submit forms on directories with open pages

import puppeteer from 'puppeteer';

const PRODUCT = {
  name: 'CVin.Bio',
  url: 'https://cvin.bio',
  tagline: 'Upload your CV, get a live website and matched jobs in seconds.',
  shortDesc: 'CVin.Bio converts any PDF resume into a live personal website with a shareable link. Upload once, get a mobile-ready portfolio page, and see jobs matched to your skills from 6,000+ listings. No ATS. Just a link that works while you sleep.',
  email: 'hi@cvin.bio',
  founder: 'Vedang Vatsa',
};

const results = [];

async function submitToDirectory(browser, config) {
  const { name, url, fillForm } = config;
  const page = await browser.newPage();
  page.setDefaultTimeout(15000);
  
  try {
    console.log(`\n  Navigating to ${name}...`);
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 20000 });
    await new Promise(r => setTimeout(r, 2000)); // wait for JS
    
    const result = await fillForm(page);
    results.push({ name, status: 'OK', detail: result || 'Form submitted' });
    console.log(`  ✅ ${name}: ${result || 'submitted'}`);
  } catch (e) {
    results.push({ name, status: 'FAIL', detail: e.message.slice(0, 100) });
    console.log(`  ❌ ${name}: ${e.message.slice(0, 80)}`);
  } finally {
    await page.close().catch(() => {});
  }
}

// ── Directory configurations ──────────────────────────────────────────────

const directories = [
  // 1. Launching Next - simple form, no login
  {
    name: 'LaunchingNext',
    url: 'https://www.launchingnext.com/submit/',
    fillForm: async (page) => {
      await page.type('input[name="name"], input[placeholder*="name" i]', PRODUCT.name, { delay: 30 });
      await page.type('input[name="url"], input[placeholder*="url" i], input[type="url"]', PRODUCT.url, { delay: 30 });
      await page.type('input[name="email"], input[type="email"]', PRODUCT.email, { delay: 30 });
      const textareas = await page.$$('textarea');
      if (textareas.length > 0) await textareas[0].type(PRODUCT.tagline, { delay: 20 });
      if (textareas.length > 1) await textareas[1].type(PRODUCT.shortDesc, { delay: 10 });
      // Try to find submit button
      const btn = await page.$('button[type="submit"], input[type="submit"]');
      if (btn) { await btn.click(); await new Promise(r => setTimeout(r, 3000)); }
      return 'Form filled and submitted';
    },
  },

  // 2. BetaPage
  {
    name: 'BetaPage',
    url: 'https://betapage.co/submit-your-startup',
    fillForm: async (page) => {
      const inputs = await page.$$('input[type="text"], input[type="url"], input[type="email"]');
      for (const inp of inputs) {
        const name = await inp.evaluate(el => el.name || el.placeholder || el.id);
        const nameLower = name.toLowerCase();
        if (nameLower.includes('name') || nameLower.includes('title')) await inp.type(PRODUCT.name, { delay: 30 });
        else if (nameLower.includes('url') || nameLower.includes('website') || nameLower.includes('link')) await inp.type(PRODUCT.url, { delay: 30 });
        else if (nameLower.includes('email')) await inp.type(PRODUCT.email, { delay: 30 });
        else if (nameLower.includes('tagline') || nameLower.includes('pitch')) await inp.type(PRODUCT.tagline, { delay: 20 });
      }
      const textareas = await page.$$('textarea');
      for (const ta of textareas) await ta.type(PRODUCT.shortDesc, { delay: 10 });
      const btn = await page.$('button[type="submit"], input[type="submit"], button:has-text("Submit")');
      if (btn) { await btn.click(); await new Promise(r => setTimeout(r, 3000)); }
      return 'Form filled';
    },
  },

  // 3. StartupBase
  {
    name: 'StartupBase',
    url: 'https://startupbase.io/submit',
    fillForm: async (page) => {
      const inputs = await page.$$('input');
      for (const inp of inputs) {
        const attrs = await inp.evaluate(el => ({ name: el.name, placeholder: el.placeholder, type: el.type }));
        const id = (attrs.name + attrs.placeholder).toLowerCase();
        if (id.includes('name') && !id.includes('email')) await inp.type(PRODUCT.name, { delay: 30 });
        else if (id.includes('url') || id.includes('website') || attrs.type === 'url') await inp.type(PRODUCT.url, { delay: 30 });
        else if (id.includes('email') || attrs.type === 'email') await inp.type(PRODUCT.email, { delay: 30 });
        else if (id.includes('tagline') || id.includes('pitch')) await inp.type(PRODUCT.tagline, { delay: 20 });
      }
      const textareas = await page.$$('textarea');
      for (const ta of textareas) await ta.type(PRODUCT.shortDesc, { delay: 10 });
      const btn = await page.$('button[type="submit"], input[type="submit"]');
      if (btn) { await btn.click(); await new Promise(r => setTimeout(r, 3000)); }
      return 'Form filled';
    },
  },

  // 4. There's an AI for That
  {
    name: 'TheresAnAIForThat',
    url: 'https://theresanaiforthat.com/submit/',
    fillForm: async (page) => {
      const inputs = await page.$$('input[type="text"], input[type="url"], input[type="email"]');
      for (const inp of inputs) {
        const attrs = await inp.evaluate(el => ({ name: el.name || '', placeholder: el.placeholder || '', id: el.id || '' }));
        const id = (attrs.name + attrs.placeholder + attrs.id).toLowerCase();
        if (id.includes('name') && !id.includes('email')) await inp.type(PRODUCT.name, { delay: 30 });
        else if (id.includes('url') || id.includes('website') || id.includes('link')) await inp.type(PRODUCT.url, { delay: 30 });
        else if (id.includes('email')) await inp.type(PRODUCT.email, { delay: 30 });
      }
      const textareas = await page.$$('textarea');
      for (const ta of textareas) await ta.type(PRODUCT.shortDesc, { delay: 10 });
      const btn = await page.$('button[type="submit"], input[type="submit"]');
      if (btn) { await btn.click(); await new Promise(r => setTimeout(r, 3000)); }
      return 'Form filled';
    },
  },

  // 5. Futurepedia
  {
    name: 'Futurepedia',
    url: 'https://www.futurepedia.io/submit-tool',
    fillForm: async (page) => {
      const inputs = await page.$$('input');
      for (const inp of inputs) {
        const attrs = await inp.evaluate(el => ({ name: el.name || '', placeholder: el.placeholder || '', id: el.id || '', type: el.type }));
        const id = (attrs.name + attrs.placeholder + attrs.id).toLowerCase();
        if (attrs.type === 'hidden' || attrs.type === 'checkbox') continue;
        if (id.includes('name') && !id.includes('email')) await inp.type(PRODUCT.name, { delay: 30 });
        else if (id.includes('url') || id.includes('website') || attrs.type === 'url') await inp.type(PRODUCT.url, { delay: 30 });
        else if (id.includes('email') || attrs.type === 'email') await inp.type(PRODUCT.email, { delay: 30 });
        else if (id.includes('tagline') || id.includes('short')) await inp.type(PRODUCT.tagline, { delay: 20 });
      }
      const textareas = await page.$$('textarea');
      for (const ta of textareas) await ta.type(PRODUCT.shortDesc, { delay: 10 });
      const btn = await page.$('button[type="submit"], input[type="submit"]');
      if (btn) { await btn.click(); await new Promise(r => setTimeout(r, 3000)); }
      return 'Form filled';
    },
  },

  // 6. Toolify
  {
    name: 'Toolify',
    url: 'https://www.toolify.ai/submit',
    fillForm: async (page) => {
      const inputs = await page.$$('input');
      for (const inp of inputs) {
        const attrs = await inp.evaluate(el => ({ name: el.name || '', placeholder: el.placeholder || '', type: el.type }));
        const id = (attrs.name + attrs.placeholder).toLowerCase();
        if (attrs.type === 'hidden') continue;
        if (id.includes('name') && !id.includes('email')) await inp.type(PRODUCT.name, { delay: 30 });
        else if (id.includes('url') || id.includes('website') || attrs.type === 'url') await inp.type(PRODUCT.url, { delay: 30 });
        else if (id.includes('email') || attrs.type === 'email') await inp.type(PRODUCT.email, { delay: 30 });
      }
      const textareas = await page.$$('textarea');
      for (const ta of textareas) await ta.type(PRODUCT.shortDesc, { delay: 10 });
      const btn = await page.$('button[type="submit"], input[type="submit"]');
      if (btn) { await btn.click(); await new Promise(r => setTimeout(r, 3000)); }
      return 'Form filled';
    },
  },

  // 7. TopAI.tools
  {
    name: 'TopAI.tools',
    url: 'https://topai.tools/submit',
    fillForm: async (page) => {
      const inputs = await page.$$('input');
      for (const inp of inputs) {
        const attrs = await inp.evaluate(el => ({ name: el.name || '', placeholder: el.placeholder || '', type: el.type }));
        const id = (attrs.name + attrs.placeholder).toLowerCase();
        if (attrs.type === 'hidden') continue;
        if (id.includes('name') && !id.includes('email')) await inp.type(PRODUCT.name, { delay: 30 });
        else if (id.includes('url') || id.includes('website') || attrs.type === 'url') await inp.type(PRODUCT.url, { delay: 30 });
        else if (id.includes('email') || attrs.type === 'email') await inp.type(PRODUCT.email, { delay: 30 });
      }
      const textareas = await page.$$('textarea');
      for (const ta of textareas) await ta.type(PRODUCT.shortDesc, { delay: 10 });
      const btn = await page.$('button[type="submit"], input[type="submit"]');
      if (btn) { await btn.click(); await new Promise(r => setTimeout(r, 3000)); }
      return 'Form filled';
    },
  },
];

async function main() {
  console.log('🚀 CVin.Bio Directory Submission (Headless Browser)\n');
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled'],
  });

  for (const dir of directories) {
    await submitToDirectory(browser, dir);
  }

  await browser.close();

  console.log('\n' + '═'.repeat(60));
  console.log('SUMMARY');
  console.log('═'.repeat(60));
  
  let ok = 0, fail = 0;
  for (const r of results) {
    const icon = r.status === 'OK' ? '✅' : '❌';
    console.log(`${icon} ${r.name.padEnd(22)} ${r.detail}`);
    if (r.status === 'OK') ok++; else fail++;
  }
  console.log(`\n✅ ${ok} submitted  ❌ ${fail} failed`);
}

main().catch(console.error);
