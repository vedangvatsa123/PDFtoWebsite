import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const BUFFER_CONTENT = '.github/scripts/buffer-content.json';
const IMG_DEST = 'public/images/social';

const bufferData = JSON.parse(fs.readFileSync(BUFFER_CONTENT, 'utf8'));
const startIndex = bufferData.linkedin.length; 

const viralPosts = [
    {
        id: "viral_001",
        text: "Walking out mid shift over the intercom is iconic. You do not owe toxic managers anything.\n\nhttps://www.youtube.com/watch?v=hHfsHDwQ80I\n\ncvin.bio/jobs",
        ytId: "hHfsHDwQ80I"
    },
    {
        id: "viral_002",
        text: "HR could not even explain why she was laid off. Loyalty to a company is a trap.\n\nhttps://www.youtube.com/watch?v=u7G7OpgKROw\n\ncvin.bio",
        ytId: "u7G7OpgKROw"
    },
    {
        id: "viral_003",
        text: "When the whole team walks out, it is never about the work. It is about management.\n\nhttps://www.youtube.com/watch?v=a7JkVSZ4fLg\n\ncvin.bio/jobs",
        ytId: "a7JkVSZ4fLg"
    },
    {
        id: "viral_004",
        text: "Waking up to make breakfast for your kids > logging into a toxic job. cvin.bio/jobs",
        img: ".github/images/viral/quit_breakfast.jpg"
    },
    {
        id: "viral_005",
        text: "Nothing beats watching a bad manager realize you have options. cvin.bio",
        img: ".github/images/viral/boss_text.jpg"
    },
    {
        id: "viral_006",
        text: "The hardest part of working from home is putting on real pants. Never go back to a cubicle. cvin.bio/jobs",
        img: ".github/images/viral/wfh_pants.png"
    },
    {
        id: "viral_007",
        text: "HR forcing culture on people who just want to do their jobs and go home is peak corporate. cvin.bio/jobs",
        img: ".github/images/viral/forced_party.jpg"
    },
    {
        id: "viral_008",
        text: "Managers who text you on your day off expecting a fast reply are a massive red flag. cvin.bio/jobs",
        img: ".github/images/viral/shocking_text.jpg"
    },
    {
        id: "viral_009",
        text: "Standing up to a toxic boss feels amazing. Just make sure your resume is ready first. cvin.bio",
        img: ".github/images/viral/ultimatum.jpg"
    },
    {
        id: "viral_010",
        text: "\"No one wants to work\" is corporate for \"we refuse to pay what you are worth\". Stop settling. cvin.bio/jobs",
        img: ".github/images/viral/turnover.jpg"
    }
];

function shuffle(array) {
  let currentIndex = array.length, randomIndex;
  while (currentIndex > 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
  }
  return array;
}

shuffle(viralPosts);

async function downloadThumbnail(ytId) {
    const url = `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`;
    const res = await fetch(url);
    if (!res.ok) {
        const fbRes = await fetch(`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`);
        return await fbRes.arrayBuffer();
    }
    return await res.arrayBuffer();
}

async function process() {
    for (let i = 0; i < viralPosts.length; i++) {
        const post = viralPosts[i];
        const postNum = startIndex + i + 1; // Start at current length + 1
        const outPath = path.join(IMG_DEST, `post_${postNum}.png`);
        
        console.log(`Generating image for post ${postNum} ...`);
        
        let inputBuffer;
        if (post.ytId) {
            inputBuffer = Buffer.from(await downloadThumbnail(post.ytId));
        } else {
            inputBuffer = fs.readFileSync(post.img);
        }
        
        await sharp(inputBuffer)
            .resize({
                width: 1080,
                height: 1350,
                fit: 'contain',
                background: { r: 0, g: 0, b: 0, alpha: 1 } 
            })
            .toFormat('png')
            .toFile(outPath);
            
        console.log(`Saved ${outPath}`);
        
        const baseText = post.text;
        bufferData.linkedin.push(baseText);
        bufferData.instagram.push(`${baseText}\n\n#workculture #toxicworkplace #careeradvice #knowyourworth`);
        bufferData.facebook.push(baseText);
    }
    
    fs.writeFileSync(BUFFER_CONTENT, JSON.stringify(bufferData, null, 2));
    console.log(`Updated ${BUFFER_CONTENT} with 10 new posts.`);
}

process().catch(console.error);
