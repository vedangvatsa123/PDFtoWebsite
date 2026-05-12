#!/usr/bin/env node
/**
 * Generate 15 unique PLEASANT music tracks using ffmpeg.
 * 
 * Each track layers multiple sine waves to create different vibes.
 * ALL use MAJOR keys (C, D, E, F, G, A, Bb major) for warm/happy feel.
 * Uses vibrato + tremolo at different rates for distinct character.
 */
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const dir = path.join(__dirname, 'music');
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const DUR = 8;

// Major scale frequencies for warm, happy sound
// Each config creates a distinctly different vibe via vibrato/tremolo rates
const tracks = [
  // C Major — bright bounce
  { n:1,  notes:[261.63, 329.63, 392.00, 523.25], sub:130.81, vib:5.0, trem:3.0, name:'bright-bounce' },
  // D Major — sunny
  { n:2,  notes:[293.66, 369.99, 440.00, 587.33], sub:146.83, vib:4.0, trem:2.5, name:'sunny' },
  // E Major — sparkle  
  { n:3,  notes:[329.63, 415.30, 493.88, 659.26], sub:164.81, vib:6.0, trem:4.0, name:'sparkle' },
  // F Major — warm breeze
  { n:4,  notes:[349.23, 440.00, 523.25, 698.46], sub:174.61, vib:3.5, trem:2.0, name:'warm-breeze' },
  // G Major — playful
  { n:5,  notes:[392.00, 493.88, 587.33, 783.99], sub:196.00, vib:5.5, trem:3.5, name:'playful' },
  // A Major — uplifting
  { n:6,  notes:[440.00, 554.37, 659.26, 880.00], sub:220.00, vib:4.5, trem:3.0, name:'uplifting' },
  // Bb Major — smooth
  { n:7,  notes:[466.16, 587.33, 698.46, 932.33], sub:233.08, vib:3.0, trem:2.0, name:'smooth' },
  // C Major high — bell-like
  { n:8,  notes:[523.25, 659.26, 783.99, 1046.5], sub:261.63, vib:6.5, trem:4.5, name:'bell' },
  // D Major low — mellow groove
  { n:9,  notes:[146.83, 184.99, 220.00, 293.66], sub:73.42,  vib:2.5, trem:1.5, name:'mellow-groove' },
  // G Major — happy walk
  { n:10, notes:[196.00, 246.94, 293.66, 392.00], sub:98.00,  vib:4.0, trem:3.0, name:'happy-walk' },
  // F Major — dreamy float
  { n:11, notes:[174.61, 220.00, 261.63, 349.23], sub:87.31,  vib:3.0, trem:1.8, name:'dreamy-float' },
  // A Major — peppy
  { n:12, notes:[220.00, 277.18, 329.63, 440.00], sub:110.00, vib:5.8, trem:4.0, name:'peppy' },
  // E Major low — chill
  { n:13, notes:[164.81, 207.65, 246.94, 329.63], sub:82.41,  vib:2.0, trem:1.5, name:'chill' },
  // Bb Major — funky
  { n:14, notes:[233.08, 293.66, 349.23, 466.16], sub:116.54, vib:5.0, trem:3.5, name:'funky' },
  // C Major — joyful cascade
  { n:15, notes:[261.63, 329.63, 392.00, 523.25], sub:130.81, vib:7.0, trem:5.0, name:'joyful' },
];

tracks.forEach(t => {
  const outFile = path.join(dir, `track${String(t.n).padStart(2,'0')}.wav`);
  
  // Layer: root + third + fifth + octave + sub bass
  const expr = t.notes.map((f, i) => {
    const vol = [0.06, 0.045, 0.035, 0.02][i];
    return `${vol}*sin(2*PI*${f}*t)`;
  }).join('+') + `+0.025*sin(2*PI*${t.sub}*t)`;

  const filters = [
    `afade=t=in:st=0:d=0.6`,
    `afade=t=out:st=${DUR-1.2}:d=1.2`,
    `vibrato=f=${t.vib}:d=0.4`,
    `tremolo=f=${t.trem}:d=0.3`,
    `lowpass=f=4500`,
    `highpass=f=45`,
    `acompressor=threshold=0.15:ratio=3`,
    `volume=1.5`,
  ].join(',');

  const cmd = `ffmpeg -y -f lavfi -i "aevalsrc=${expr}:s=44100:d=${DUR}" -af "${filters}" -ac 2 -ar 44100 "${outFile}"`;

  try {
    execSync(cmd, { stdio: 'pipe', timeout: 10000 });
    const kb = (fs.statSync(outFile).size / 1024).toFixed(0);
    console.log(`✓ #${String(t.n).padStart(2)} ${t.name.padEnd(14)} — ${kb}KB`);
  } catch(e) {
    console.error(`✗ #${t.n} ${t.name}`);
  }
});

console.log(`\nDone. ${dir}`);
