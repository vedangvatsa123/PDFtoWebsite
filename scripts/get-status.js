const fs = require('fs');

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync('.github/scripts/' + file, 'utf8'));
  } catch(e) {
    return null;
  }
}

const xContent = readJson('x-content.json');
const bufferContent = readJson('buffer-content.json');

const xState = readJson('x-state.json');
const bskyState = readJson('bsky-state.json');
const bufferState = readJson('buffer-state.json');
const metaState = readJson('meta-state.json');

console.log('--- X (Twitter) ---');
if (xContent) {
  const threadsTotal = xContent.threads?.length || 0;
  const insightsTotal = xContent.insights?.length || 0;
  const engagementTotal = xContent.engagement?.length || 0;
  
  const threadsDone = xState?.threads?.index || 0;
  const insightsDone = xState?.insights?.index || 0;
  const engagementDone = xState?.engagement?.index || 0;
  
  console.log(`Threads: ${threadsDone}/${threadsTotal} posted (${threadsTotal - threadsDone} left)`);
  console.log(`Insights: ${insightsDone}/${insightsTotal} posted (${insightsTotal - insightsDone} left)`);
  console.log(`Engagement: ${engagementDone}/${engagementTotal} posted (${engagementTotal - engagementDone} left)`);
}

console.log('\n--- Bluesky ---');
if (bufferContent && bskyState) {
  const bskyTotal = bufferContent.linkedin?.length || 0;
  const bskyDone = bskyState.index || 0;
  console.log(`General: ${bskyDone}/${bskyTotal} posted (${bskyTotal - bskyDone} left)`);
}

console.log('\n--- LinkedIn (Buffer) ---');
if (bufferContent) {
  const liTotal = bufferContent.linkedin?.length || 0;
  const liDone = bufferState?.linkedin || 0;
  console.log(`Posts: ${liDone}/${liTotal} scheduled/posted (${liTotal - liDone} left in queue)`);
}

console.log('\n--- Instagram (Buffer) ---');
if (bufferContent) {
  const igTotal = bufferContent.instagram?.length || 0;
  const igDone = bufferState?.instagram || 0;
  console.log(`Posts: ${igDone}/${igTotal} scheduled/posted (${igTotal - igDone} left in queue)`);
}

console.log('\n--- Facebook (Buffer) ---');
if (bufferContent) {
  const fbTotal = bufferContent.facebook?.length || 0;
  const fbDone = bufferState?.facebook || 0;
  console.log(`Posts: ${fbDone}/${fbTotal} scheduled/posted (${fbTotal - fbDone} left in queue)`);
}
