const https = require('https');

const SITE_URL = 'https://cvin.bio';
const SITEMAP_URL = `${SITE_URL}/sitemap.xml`;

// Ping Google
https.get(`https://www.google.com/ping?sitemap=${encodeURIComponent(SITEMAP_URL)}`, (res) => {
  console.log(`Google Ping Status: ${res.statusCode}`);
}).on('error', (e) => {
  console.error(`Google Ping Error: ${e.message}`);
});

// Ping Bing / IndexNow
https.get(`https://www.bing.com/ping?sitemap=${encodeURIComponent(SITEMAP_URL)}`, (res) => {
  console.log(`Bing Ping Status: ${res.statusCode}`);
}).on('error', (e) => {
  console.error(`Bing Ping Error: ${e.message}`);
});
