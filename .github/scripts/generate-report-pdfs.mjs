#!/usr/bin/env node
/**
 * Generate PDF versions of the report pages.
 * Usage: node .github/scripts/generate-report-pdfs.mjs
 * Requires: local dev server running on port 3000
 */

import puppeteer from 'puppeteer';
import { mkdir } from 'fs/promises';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '../..');
const outputDir = path.join(projectRoot, 'public', 'reports');

const BASE = process.env.BASE_URL || 'http://localhost:3000';

const reports = [
  {
    slug: 'remote-talent-report',
    printSlug: 'remote-talent-report',       // TODO: create /remote-talent-report/print
    filename: 'CVin-Bio-Remote-Talent-Report-2026.pdf',
    title: 'The Remote Talent Report 2026',
  },
  {
    slug: 'layoffs-report',
    printSlug: 'layoffs-report/full',
    filename: 'CVin-Bio-Tech-Layoffs-Report-2026.pdf',
    title: 'The Tech Layoffs Report 2026',
  },
];

async function generatePDF(browser, report) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  console.log(`  → Loading ${BASE}/${report.printSlug || report.slug} ...`);
  await page.goto(`${BASE}/${report.printSlug || report.slug}`, { waitUntil: 'networkidle0', timeout: 30000 });

  // Hide nav header and footer for cleaner PDF, hide email forms
  await page.evaluate(() => {
    // Hide header
    const header = document.querySelector('header');
    if (header) header.style.display = 'none';

    // Hide footer
    const footer = document.querySelector('footer');
    if (footer) footer.style.display = 'none';

    // Hide email capture forms
    document.querySelectorAll('form').forEach(f => f.style.display = 'none');

    // Hide the floating widget
    const widgets = document.querySelectorAll('[class*="fixed"]');
    widgets.forEach(w => w.style.display = 'none');

    // Ensure all content is visible (no overflow hidden on the scroll container)
    const scrollContainer = document.querySelector('.h-screen');
    if (scrollContainer) {
      scrollContainer.style.height = 'auto';
      scrollContainer.style.overflow = 'visible';
    }

    // Force white background everywhere to prevent dark shell bleeding in
    document.body.style.backgroundColor = '#ffffff';
    document.documentElement.style.backgroundColor = '#ffffff';
    document.documentElement.classList.remove('dark');
    document.documentElement.style.colorScheme = 'light';

    // Override the CSS custom properties for the site theme
    document.documentElement.style.setProperty('--background', '0 0% 100%');
    document.documentElement.style.setProperty('--foreground', '0 0% 3.9%');

    const rootDiv = document.getElementById('__next');
    if (rootDiv) rootDiv.style.backgroundColor = '#ffffff';

    // Hide any dark-background siblings that come after main content
    const allSections = document.querySelectorAll('body > div > div');
    allSections.forEach(el => {
      const bg = getComputedStyle(el).backgroundColor;
      if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'rgb(255, 255, 255)' && !el.querySelector('main')) {
        el.style.display = 'none';
      }
    });
  });

  // Wait a moment for any re-renders
  await new Promise(r => setTimeout(r, 1000));

  const pdfPath = path.join(outputDir, report.filename);
  await page.pdf({
    path: pdfPath,
    format: 'A4',
    printBackground: true,
    margin: { top: '40px', bottom: '40px', left: '40px', right: '40px' },
    displayHeaderFooter: true,
    headerTemplate: `
      <div style="font-size:8px; width:100%; text-align:center; color:#999; padding-top:8px; font-family:-apple-system,sans-serif;">
        CVin.Bio Research — ${report.title}
      </div>
    `,
    footerTemplate: `
      <div style="font-size:8px; width:100%; text-align:center; color:#999; padding-bottom:8px; font-family:-apple-system,sans-serif;">
        <span>cvin.bio</span> · Page <span class="pageNumber"></span> of <span class="totalPages"></span>
      </div>
    `,
  });

  console.log(`  ✓ Saved ${pdfPath}`);
  await page.close();
}

async function main() {
  await mkdir(outputDir, { recursive: true });

  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  for (const report of reports) {
    try {
      await generatePDF(browser, report);
    } catch (err) {
      console.error(`  ✗ Failed to generate ${report.filename}:`, err.message);
    }
  }

  await browser.close();
  console.log('Done.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
