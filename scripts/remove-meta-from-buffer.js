const fs = require('fs');

const file = '.github/scripts/buffer-schedule.mjs';
let content = fs.readFileSync(file, 'utf8');

// remove Facebook and Instagram from CHANNELS
content = content.replace(/instagram:\s*'[^']+',\n\s*facebook:\s*'[^']+',/g, '');

// remove getPostText cases for instagram and facebook
content = content.replace(/if \(platform === 'instagram'\) return IG_POSTS\[index\];\n\s*if \(platform === 'facebook'\) return FB_POSTS\[index\];/g, '');

// In main schedule loop, it loops over platforms. We need to check the main function.
