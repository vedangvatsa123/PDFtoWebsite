import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const dir = '.github/images/viral/';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.jpg') || f.endsWith('.png') || f.endsWith('.jpeg'));

async function processImages() {
  for (const file of files) {
    const input = path.join(dir, file);
    const output = path.join(dir, 'ig_' + file);
    
    console.log(`Processing ${input}...`);
    
    // Instagram Portrait 4:5 is 1080x1350
    await sharp(input)
      .resize({
        width: 1080,
        height: 1350,
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .toFile(output);
      
    // Replace original with processed
    fs.renameSync(output, input);
  }
}

processImages().catch(console.error);
