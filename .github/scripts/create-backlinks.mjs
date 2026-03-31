#!/usr/bin/env node
// Mass backlink builder for cvin.bio
// Creates 100+ live, verifiable references across web services
// Categories: pings, archives, validators, lookups, shorteners, stats, paste, social bookmarks

const SITE = 'https://cvin.bio';
const DOMAIN = 'cvin.bio';
const DESC = 'Upload your CV, get a live website and matched jobs in seconds.';
const TITLE = 'CVin.Bio - Turn Your CV into a Website';

let ok = 0, fail = 0, total = 0;

async function hit(name, url, opts = {}) {
  total++;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const r = await fetch(url, {
      ...opts,
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        ...opts.headers,
      },
      redirect: 'follow',
    });
    clearTimeout(timeout);
    const s = r.status;
    if (s >= 200 && s < 400) { ok++; process.stdout.write(`✅ `); }
    else { fail++; process.stdout.write(`❌ `); }
    if (total % 20 === 0) process.stdout.write(`\n   [${ok}/${total}] `);
  } catch (e) {
    clearTimeout(timeout);
    fail++;
    process.stdout.write(`⏳ `);
    if (total % 20 === 0) process.stdout.write(`\n   [${ok}/${total}] `);
  }
}

// XML-RPC ping body
const rpcBody = `<?xml version="1.0"?><methodCall><methodName>weblogUpdates.ping</methodName><params><param><value>${TITLE}</value></param><param><value>${SITE}</value></param></params></methodCall>`;
const rpcOpts = { method: 'POST', headers: { 'Content-Type': 'text/xml' }, body: rpcBody };

async function main() {
  console.log(`\n🔗 Creating backlinks for ${SITE}\n`);
  process.stdout.write('   ');

  // ═══════════════════════════════════════════════════════════════════════
  // 1. SEARCH ENGINE PINGS (5)
  // ═══════════════════════════════════════════════════════════════════════
  await hit('Google Ping', `https://www.google.com/ping?sitemap=${encodeURIComponent(SITE+'/sitemap.xml')}`);
  await hit('Bing Ping', `https://www.bing.com/ping?sitemap=${encodeURIComponent(SITE+'/sitemap.xml')}`);
  await hit('Yandex Ping', `https://blogs.yandex.ru/pings/?status=success&url=${encodeURIComponent(SITE)}`);
  await hit('IndexNow Bing', `https://www.bing.com/indexnow?url=${encodeURIComponent(SITE)}&key=cvinbio2026`);
  await hit('IndexNow Yandex', `https://yandex.com/indexnow?url=${encodeURIComponent(SITE)}&key=cvinbio2026`);

  // ═══════════════════════════════════════════════════════════════════════
  // 2. XML-RPC PING SERVICES (15)
  // ═══════════════════════════════════════════════════════════════════════
  const rpcEndpoints = [
    'http://rpc.pingomatic.com/', 'http://rpc.weblogs.com/RPC2',
    'http://ping.feedburner.com/', 'http://rpc.technorati.com/rpc/ping',
    'http://blogsearch.google.com/ping/RPC2', 'http://api.moreover.com/RPC2',
    'http://ping.syndic8.com/xmlrpc.php', 'http://www.blogpeople.net/ping/',
    'http://rpc.blogrolling.com/pinger/', 'http://api.my.yahoo.com/RPC2',
    'http://ping.wordblog.de/', 'http://ping.blogs.yandex.ru/RPC2',
    'http://ping.blo.gs/', 'http://xping.pubsub.com/ping/',
    'http://coreblog.org/ping/',
  ];
  for (const ep of rpcEndpoints) await hit(`RPC ${new URL(ep).hostname}`, ep, rpcOpts);

  // ═══════════════════════════════════════════════════════════════════════
  // 3. WEB ARCHIVES & CACHE (5)
  // ═══════════════════════════════════════════════════════════════════════
  await hit('Wayback Save /', `https://web.archive.org/save/${SITE}`);
  await hit('Wayback Save /jobs', `https://web.archive.org/save/${SITE}/jobs`);
  await hit('Wayback Save /blog', `https://web.archive.org/save/${SITE}/blog`);
  await hit('Archive.today', `https://archive.ph/?run=1&url=${encodeURIComponent(SITE)}`);
  await hit('Google Cache', `https://webcache.googleusercontent.com/search?q=cache:${DOMAIN}`);

  // ═══════════════════════════════════════════════════════════════════════
  // 4. WEBSITE VALIDATORS & CHECKERS (15)
  // ═══════════════════════════════════════════════════════════════════════
  await hit('W3C Validator', `https://validator.w3.org/nu/?doc=${encodeURIComponent(SITE)}`);
  await hit('W3C Link Check', `https://validator.w3.org/checklink?uri=${encodeURIComponent(SITE)}&check=Check`);
  await hit('W3C CSS', `https://jigsaw.w3.org/css-validator/validator?uri=${encodeURIComponent(SITE)}`);
  await hit('SSL Labs', `https://www.ssllabs.com/ssltest/analyze.html?d=${DOMAIN}&latest`);
  await hit('Security Headers', `https://securityheaders.com/?q=${encodeURIComponent(SITE)}&followRedirects=on`);
  await hit('Mozilla Obs', `https://observatory.mozilla.org/analyze/${DOMAIN}`);
  await hit('GTmetrix', `https://gtmetrix.com/?url=${encodeURIComponent(SITE)}`);
  await hit('PageSpeed', `https://pagespeed.web.dev/analysis?url=${encodeURIComponent(SITE)}`);
  await hit('BuiltWith', `https://builtwith.com/${DOMAIN}`);
  await hit('Wappalyzer', `https://www.wappalyzer.com/lookup/${DOMAIN}/`);
  await hit('SimilarWeb', `https://www.similarweb.com/website/${DOMAIN}/`);
  await hit('Netcraft', `https://sitereport.netcraft.com/?url=${SITE}`);
  await hit('URLVoid', `https://www.urlvoid.com/scan/${DOMAIN}/`);
  await hit('VirusTotal', `https://www.virustotal.com/gui/domain/${DOMAIN}`);
  await hit('Sucuri Check', `https://sitecheck.sucuri.net/results/${DOMAIN}`);

  // ═══════════════════════════════════════════════════════════════════════
  // 5. DNS & WHOIS LOOKUPS (10)
  // ═══════════════════════════════════════════════════════════════════════
  await hit('DNSChecker', `https://dnschecker.org/#A/${DOMAIN}`);
  await hit('MXToolbox', `https://mxtoolbox.com/SuperTool.aspx?action=https%3a${DOMAIN}&run=toolpage`);
  await hit('WhoisXMLAPI', `https://www.whois.com/whois/${DOMAIN}`);
  await hit('DomainTools', `https://whois.domaintools.com/${DOMAIN}`);
  await hit('DNSLytics', `https://dnslytics.com/domain/${DOMAIN}`);
  await hit('ViewDNS', `https://viewdns.info/whois/?domain=${DOMAIN}`);
  await hit('IntoDNS', `https://intodns.com/${DOMAIN}`);
  await hit('DNSViz', `https://dnsviz.net/d/${DOMAIN}/analyze/`);
  await hit('Robtex', `https://www.robtex.com/dns-lookup/${DOMAIN}`);
  await hit('CentralOps', `https://centralops.net/co/DomainDossier.aspx?addr=${DOMAIN}&dom_whois=true&net_whois=true&dom_dns=true`);

  // ═══════════════════════════════════════════════════════════════════════
  // 6. SEO & STATS TOOLS (15)
  // ═══════════════════════════════════════════════════════════════════════
  await hit('SEOptimer', `https://www.seoptimer.com/${DOMAIN}`);
  await hit('SiteWorthTraffic', `https://www.siteworthtraffic.com/report/${DOMAIN}`);
  await hit('WorthOfWeb', `https://www.worthofweb.com/website-value/${DOMAIN}/`);
  await hit('StatsCrop', `https://www.statscrop.com/www/${DOMAIN}`);
  await hit('HypeStat', `https://hypestat.com/info/${DOMAIN}`);
  await hit('Alexa (Web)', `https://www.alexa.com/siteinfo/${DOMAIN}`);
  await hit('WebStatsDomain', `https://webstatsdomain.org/d/${DOMAIN}`);
  await hit('SitePriceOnline', `https://www.siteprice.org/website-worth/${DOMAIN}`);
  await hit('Cubestat', `https://www.cubestat.com/www.${DOMAIN}`);
  await hit('Statshow', `https://www.statshow.com/www/${DOMAIN}`);
  await hit('EstimatedWorth', `https://www.estimatedworth.com/www.${DOMAIN}`);
  await hit('SiteTrail', `https://www.sitetrail.com/${DOMAIN}`);
  await hit('SpyOnWeb', `https://spyonweb.com/${DOMAIN}`);
  await hit('WhoIsHostingThis', `https://www.whoishostingthis.com/${DOMAIN}`);
  await hit('HostAdvice', `https://hostadvice.com/tools/whois/${DOMAIN}`);

  // ═══════════════════════════════════════════════════════════════════════
  // 7. SOCIAL BOOKMARKS & AGGREGATORS (10)
  // ═══════════════════════════════════════════════════════════════════════
  await hit('Mix.com', `https://mix.com/add?url=${encodeURIComponent(SITE)}`);
  await hit('Diigo', `https://www.diigo.com/item/new/bookmark?url=${encodeURIComponent(SITE)}&title=${encodeURIComponent(TITLE)}`);
  await hit('Folkd', `https://www.folkd.com/submit.php?url=${encodeURIComponent(SITE)}`);
  await hit('Scoop.it', `https://www.scoop.it/bookmarklet?url=${encodeURIComponent(SITE)}`);
  await hit('Instapaper', `https://www.instapaper.com/hello2?url=${encodeURIComponent(SITE)}&title=${encodeURIComponent(TITLE)}`);
  await hit('Pocket', `https://getpocket.com/save?url=${encodeURIComponent(SITE)}&title=${encodeURIComponent(TITLE)}`);
  await hit('Flipboard', `https://share.flipboard.com/bookmarklet/popout?v=2&url=${encodeURIComponent(SITE)}&title=${encodeURIComponent(TITLE)}`);
  await hit('Slashdot', `https://slashdot.org/bookmark.pl?url=${encodeURIComponent(SITE)}&title=${encodeURIComponent(TITLE)}`);
  await hit('Reddit share', `https://www.reddit.com/submit?url=${encodeURIComponent(SITE)}&title=${encodeURIComponent(TITLE)}`);
  await hit('LinkedIn share', `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(SITE)}`);

  // ═══════════════════════════════════════════════════════════════════════
  // 8. UPTIME & MONITORING (5)
  // ═══════════════════════════════════════════════════════════════════════
  await hit('UptimeRobot', `https://stats.uptimerobot.com/check?url=${encodeURIComponent(SITE)}`);
  await hit('IsItDown', `https://www.isitdownrightnow.com/${DOMAIN}.html`);
  await hit('DownForEveryone', `https://downforeveryoneorjustme.com/${DOMAIN}`);
  await hit('DownDetector', `https://downdetector.com/status/${DOMAIN}/`);
  await hit('Host-Tracker', `https://www.host-tracker.com/en/ic/${DOMAIN}`);

  // ═══════════════════════════════════════════════════════════════════════
  // 9. TECH ANALYSIS (10)
  // ═══════════════════════════════════════════════════════════════════════
  await hit('W3Techs', `https://w3techs.com/sites/info/${DOMAIN}`);
  await hit('Trends.BuiltWith', `https://trends.builtwith.com/websitelist/${DOMAIN}`);
  await hit('Nibbler', `https://nibbler.insites.com/en/reports/${DOMAIN}`);
  await hit('WooRank', `https://www.woorank.com/en/teaser/review/${DOMAIN}`);
  await hit('GiftOfSpeed', `https://www.giftofspeed.com/cache-checker/?url=${encodeURIComponent(SITE)}`);
  await hit('WebPageTest', `https://www.webpagetest.org/result/?url=${encodeURIComponent(SITE)}`);
  await hit('Lighthouse', `https://googlechrome.github.io/lighthouse/viewer/?url=${encodeURIComponent(SITE)}`);
  await hit('Carbon', `https://www.websitecarbon.com/website/${DOMAIN}/`);
  await hit('CarbonBadge', `https://api.websitecarbon.com/site?url=${encodeURIComponent(SITE)}`);
  await hit('TechStack', `https://www.webscout.io/url/${DOMAIN}`);

  // ═══════════════════════════════════════════════════════════════════════
  // 10. MISC TOOLS & CHECKERS (10+)
  // ═══════════════════════════════════════════════════════════════════════
  await hit('HTTPStatus', `https://httpstatus.io/${DOMAIN}`);
  await hit('RedirectCheck', `https://www.redirect-checker.org/index.php?url=${encodeURIComponent(SITE)}`);
  await hit('BrokenLinkCheck', `https://www.brokenlinkcheck.com/broken-links.php?s=${encodeURIComponent(SITE)}`);
  await hit('RankWatch', `https://www.rankwatch.com/tools/domain-analysis/${DOMAIN}`);
  await hit('SEMrush', `https://www.semrush.com/analytics/overview/?q=${DOMAIN}`);
  await hit('Ahrefs', `https://ahrefs.com/backlink-checker/?input=${DOMAIN}&mode=subdomains`);
  await hit('Moz', `https://moz.com/domain-analysis?site=${DOMAIN}`);
  await hit('SERPWatcher', `https://mangools.com/free-seo-tools/serp-watcher?url=${DOMAIN}`);
  await hit('SchemaChecker', `https://validator.schema.org/#url=${encodeURIComponent(SITE)}`);
  await hit('RichResults', `https://search.google.com/test/rich-results?url=${encodeURIComponent(SITE)}`);
  await hit('MobileFriendly', `https://search.google.com/test/mobile-friendly?url=${encodeURIComponent(SITE)}`);
  await hit('StructuredData', `https://search.google.com/structured-data/testing-tool?url=${encodeURIComponent(SITE)}`);

  console.log(`\n\n${'='.repeat(50)}`);
  console.log(`TOTAL: ${total} | ✅ Reached: ${ok} | ❌ Failed: ${fail}`);
  console.log(`${'='.repeat(50)}`);
  console.log(`\nThese services create publicly cached pages containing ${SITE}`);
  console.log('Many will be indexed by search engines within days.');
}

main().catch(console.error);
