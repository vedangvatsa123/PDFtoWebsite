/**
 * Evil Work Hacks v5 — Final
 *
 * One line. No explanation. No music. No CTA screen.
 * cvin.bio as persistent small watermark.
 * 8 seconds. Pure white or black. Brand-compliant.
 */

const fs = require('fs');
const path = require('path');

const hacks = [
  { n:1,  text:`Text a coworker at 2:47 PM —\n"are you joining the meeting?"`, bg:'white' },
  { n:2,  text:`Send "can we talk?" to your manager.\nAt 4:58 PM on a Friday.`, bg:'black' },
  { n:3,  text:`CC someone's boss\non a completely normal email.`, bg:'white' },
  { n:4,  text:`Schedule a meeting called\n"Org Changes."\nNo description.`, bg:'black' },
  { n:5,  text:`Forward an email to a coworker.\nJust write "see below."`, bg:'white' },
  { n:6,  text:`Mute yourself on Zoom.\nThen mouth words silently.`, bg:'black' },
  { n:7,  text:`Reply-all to a company-wide email\nwith just "Thanks."`, bg:'white' },
  { n:8,  text:`Start every email with\n"Per our conversation —"`, bg:'black' },
  { n:9,  text:`Send a Slack message\nthat just says "Hey."\nWait 4 minutes.`, bg:'white' },
  { n:10, text:`Book a meeting room\nfor the entire afternoon.\nDon't show up.`, bg:'black' },
  { n:11, text:`Ask "who approved this?"\nin a meeting about something\neveryone approved.`, bg:'white' },
  { n:12, text:`Reply to a group chat\nwith just "Interesting."`, bg:'black' },
  { n:13, text:`Put "tentative"\non every calendar invite.`, bg:'white' },
  { n:14, text:`Set your status to "In a call"\nfor 8 hours straight.`, bg:'black' },
  { n:15, text:`Join every Zoom 2 minutes late.\nSay "sorry, was on another call."`, bg:'white' },
];

function esc(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

function gen(h) {
  const isW = h.bg === 'white';
  const bg = isW ? '#FFFFFF' : '#09090B';
  const txt = isW ? '#09090B' : '#FAFAFA';
  const muted = '#71717A';
  const textHTML = esc(h.text).replace(/\n/g, '<br>');

  return `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="UTF-8">
<title>Evil Work Hack #${h.n}</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;800&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:1080px;height:1920px;overflow:hidden;background:${bg};font-family:'Inter',sans-serif}
.wrap{
  position:absolute;top:0;left:0;width:100%;height:100%;
  display:flex;flex-direction:column;justify-content:center;align-items:center;
  padding:0 90px;text-align:center;
}
.label{
  font-size:18px;font-weight:700;text-transform:uppercase;
  letter-spacing:8px;color:${muted};margin-bottom:48px;
  opacity:0;transform:translateY(8px);
}
.text{
  font-weight:800;font-size:56px;line-height:1.3;
  letter-spacing:-0.04em;color:${txt};max-width:900px;
  opacity:0;transform:translateY(14px);
}
.wm{
  position:absolute;bottom:64px;left:0;width:100%;
  text-align:center;z-index:50;opacity:0;
}
.wm-name{
  font-size:28px;font-weight:700;letter-spacing:-0.03em;color:${muted};
}
.wm-tag{
  font-size:16px;font-weight:400;color:${isW ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.2)'};
  margin-top:4px;
}
</style></head><body>
<div class="wrap">
  <div class="label" id="lb">Evil Work Hack #${h.n}</div>
  <div class="text" id="tx">${textHTML}</div>
</div>
<div class="wm" id="wm">
  <div class="wm-name">cvin.bio</div>
  <div class="wm-tag">Your CV, your website.</div>
</div>
<script>
function a(el,d,ms,p){setTimeout(()=>{el.style.transition=Object.keys(p).map(k=>k.replace(/[A-Z]/g,m=>'-'+m.toLowerCase())+' '+ms+'ms ease-out').join(',');Object.assign(el.style,p)},d)}
a(document.getElementById('lb'),400,400,{opacity:'1',transform:'translateY(0)'});
a(document.getElementById('tx'),800,500,{opacity:'1',transform:'translateY(0)'});
a(document.getElementById('wm'),600,300,{opacity:'1'});
</script>
</body></html>`;
}

const dir = path.join(__dirname, 'evil-hacks');
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
fs.readdirSync(dir).forEach(f => { if (f.endsWith('.html')) fs.unlinkSync(path.join(dir, f)); });

hacks.forEach(h => {
  const f = `reel-${String(h.n).padStart(2,'0')}.html`;
  fs.writeFileSync(path.join(dir, f), gen(h));
  console.log(`✓ #${h.n} [${h.bg}]  ${h.text.replace(/\n/g,' ')}`);
});
console.log(`\n${hacks.length} reels → ${dir}`);
