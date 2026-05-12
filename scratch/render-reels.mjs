#!/usr/bin/env node
/**
 * Parallel headless renderer — silent MP4s, 8 seconds each.
 */
import puppeteer from 'puppeteer';
import { execSync } from 'child_process';
import { existsSync, mkdirSync, readdirSync, unlinkSync, statSync, rmdirSync } from 'fs';
import { join, resolve } from 'path';

const DIR = resolve(import.meta.dirname || '.');
const HTML_DIR = join(DIR, 'evil-hacks');
const OUT_DIR = join(DIR, 'evil-hacks-mp4');
const FRAMES_DIR = join(DIR, '.frames');
const FPS = 24;
const DUR = 8;
const W = 1080, H = 1920;
const WORKERS = 5;

[OUT_DIR, FRAMES_DIR].forEach(d => { if (!existsSync(d)) mkdirSync(d, { recursive: true }); });

async function renderOne(htmlFile) {
  const name = htmlFile.replace('.html', '');
  const mp4Path = join(OUT_DIR, name + '.mp4');
  if (existsSync(mp4Path) && statSync(mp4Path).size > 5000) {
    console.log(`  ⏭  ${name}.mp4 (exists)`); return;
  }
  const framesDir = join(FRAMES_DIR, name);
  if (existsSync(framesDir)) readdirSync(framesDir).forEach(f => unlinkSync(join(framesDir, f)));
  else mkdirSync(framesDir, { recursive: true });

  const t0 = Date.now();
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox','--disable-gpu','--disable-dev-shm-usage'] });
  const page = await browser.newPage();
  await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
  await page.goto(`file://${join(HTML_DIR, htmlFile)}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.evaluate(() => new Promise(r => setTimeout(r, 300)));

  const total = Math.ceil(FPS * DUR);
  for (let i = 0; i < total; i++) {
    await page.screenshot({ path: join(framesDir, `f_${String(i).padStart(4,'0')}.png`), type: 'png' });
    await page.evaluate(ms => new Promise(r => setTimeout(r, ms)), 1000 / FPS);
  }
  await browser.close();

  // Encode — NO AUDIO
  const cmd = `ffmpeg -y -framerate ${FPS} -i "${join(framesDir,'f_%04d.png')}" -c:v libx264 -pix_fmt yuv420p -preset fast -crf 23 -vf scale=${W}:${H} "${mp4Path}" 2>/dev/null`;
  try { execSync(cmd, { stdio: 'pipe', timeout: 60000 }); } catch { console.error(`  ❌ ${name}`); }

  readdirSync(framesDir).forEach(f => unlinkSync(join(framesDir, f)));
  try { rmdirSync(framesDir); } catch {}

  const s = existsSync(mp4Path) ? (statSync(mp4Path).size/1024/1024).toFixed(1) : '?';
  console.log(`  ✅ ${name}.mp4 — ${s} MB (${((Date.now()-t0)/1000).toFixed(0)}s)`);
}

async function main() {
  const files = readdirSync(HTML_DIR).filter(f => f.endsWith('.html') && f.startsWith('reel-')).sort();
  console.log(`\n🎬 ${files.length} reels × ${WORKERS} workers (silent, ${DUR}s)\n`);
  const t0 = Date.now();
  for (let i = 0; i < files.length; i += WORKERS) {
    const batch = files.slice(i, i + WORKERS);
    console.log(`── Batch ${Math.floor(i/WORKERS)+1} ──`);
    await Promise.all(batch.map(f => renderOne(f)));
  }
  console.log(`\n✅ Done in ${((Date.now()-t0)/1000).toFixed(0)}s → ${OUT_DIR}\n`);
  readdirSync(OUT_DIR).filter(f=>f.endsWith('.mp4')).sort().forEach(f => {
    console.log(`  ${f} — ${(statSync(join(OUT_DIR,f)).size/1024/1024).toFixed(1)} MB`);
  });
}
main().catch(console.error);
