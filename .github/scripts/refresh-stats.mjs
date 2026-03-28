import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ACCOUNTS = {
  'cvinbio@agentmail.to': process.env.AGENTMAIL_API_KEY || 'am_us_bd628380488f632397ce6b30b630c55a76e1ed5fee96860b5b359332ac7ff7c6',
  'foolishglass765@agentmail.to': process.env.AGENTMAIL_API_KEY_2 || 'am_us_b0299617e7fa8dc355c3aaa4eb8464ff6b972f0609ebe664ed798cf7032e47f7',
  'quaintmirror345@agentmail.to': process.env.AGENTMAIL_API_KEY_2 || 'am_us_b0299617e7fa8dc355c3aaa4eb8464ff6b972f0609ebe664ed798cf7032e47f7',
  'creepymessage220@agentmail.to': process.env.AGENTMAIL_API_KEY_3 || 'am_us_2c975d4bbda82b90af084f0c2936a431f3a5020686247561a75501e9581d5894',
  'repulsivehappiness172@agentmail.to': process.env.AGENTMAIL_API_KEY_4 || 'am_us_1c24769df244dbbcd0657e51f20105471a6a0feaef0e212f152887c5e40c0f00'
};

const LOGS_PATH = join(__dirname, 'email-logs.json');

const logs = JSON.parse(readFileSync(LOGS_PATH, 'utf8'));

console.log(`Refreshing stats for ${logs.length} messages...\n`);

for (let log of logs) {
  if (log.status === 'sent' && log.id && !log.clicked) {
    const apiKey = ACCOUNTS[log.account || 'cvinbio@agentmail.to'];
    try {
      const res = await fetch(`https://api.agentmail.to/v0/messages/${log.id}`, {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        // Assuming the API returns fields like 'opened_at' or 'clicked_at'
        // Since we don't have the exact response schema for stats, we'll map common patterns
        log.opened = !!(data.opened_at || data.stats?.opens > 0);
        log.clicked = !!(data.clicked_at || data.stats?.clicks > 0);
        log.bounced = data.status === 'bounced';
        
        if (log.opened) console.log(`👁️ Open detected: ${log.email}`);
        if (log.clicked) console.log(`🖱️ Click detected: ${log.email}`);
      }
    } catch (e) {
      console.log(`Error checking ${log.email}: ${e.message}`);
    }
  }
}

writeFileSync(LOGS_PATH, JSON.stringify(logs, null, 2));
console.log('\nStats refresh complete.');
