import fs from 'fs';
import path from 'path';

const content = fs.readFileSync('/Users/vedang/PDFtoWebsite/.github/scripts/buffer-schedule.mjs', 'utf8');

const postsMatch = content.match(/const POSTS = (\[[\s\S]*?\]);/);
const igPostsMatch = content.match(/const IG_POSTS = (\[[\s\S]*?\]);/);
const fbPostsMatch = content.match(/const FB_POSTS = (\[[\s\S]*?\]);/);

const evalArray = (str) => {
  return (new Function('return ' + str))();
};

const POSTS = evalArray(postsMatch[1]);
const IG_POSTS = evalArray(igPostsMatch[1]);
const FB_POSTS = evalArray(fbPostsMatch[1]);

fs.writeFileSync('/Users/vedang/PDFtoWebsite/.github/scripts/buffer-content.json', JSON.stringify({
  linkedin: POSTS,
  instagram: IG_POSTS,
  facebook: FB_POSTS
}, null, 2));

console.log('Extracted to buffer-content.json');
