const fs = require('fs');

const file = '.github/scripts/buffer-schedule.mjs';
let content = fs.readFileSync(file, 'utf8');

const replacement = `
async function schedulePost(channelId, platform, text, imageNum, dueAt) {
  const mp4Local = require('path').join(__dirname, '../../public/images/social', \`post_\${imageNum}.mp4\`);
  const isVideo = fs.existsSync(mp4Local);
  const mediaUrl = \`\${IMG_BASE}/post_\${imageNum}.\${isVideo ? 'mp4' : 'png'}\`;
  
  const escapedText = text.replace(/\\\\/g, '\\\\\\\\').replace(/"/g, '\\\\"').replace(/\\n/g, '\\\\n');
  
  const metadataBlock = platform === 'instagram'
    ? \`metadata: { instagram: { type: post, shouldShareToFeed: true } }\`
    : platform === 'facebook'
    ? \`metadata: { facebook: { type: post } }\`
    : '';
    
  const assetsBlock = isVideo 
    ? \`assets: { video: { url: "\${mediaUrl}" } }\`
    : \`assets: { images: [{ url: "\${mediaUrl}" }] }\`;
  
  const query = \`mutation {
    createPost(input: {
      channelId: "\${channelId}"
      text: "\${escapedText}"
      mode: customScheduled
      schedulingType: automatic
      dueAt: "\${dueAt}"
      \${assetsBlock}
      \${metadataBlock}
    }) {
      ... on PostActionSuccess { post { id dueAt } }
      ... on LimitReachedError { message }
      ... on InvalidInputError { message }
      ... on UnexpectedError { message }
    }
  }\`;
`;

content = content.replace(/async function schedulePost\(channelId, platform, text, imageNum, dueAt\) \{[\s\S]*?\n  \}\`;/m, replacement.trim());

fs.writeFileSync(file, content);
console.log('Patched buffer-schedule.mjs for video');
