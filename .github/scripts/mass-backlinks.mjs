#!/usr/bin/env node
// Mass parallel backlink builder - 100 concurrent workers, 1000+ targets, 3 domains

const DOMAINS = [
  { s: 'https://cvin.bio', d: 'cvin.bio', t: 'CVin.Bio' },
  { s: 'https://veda.ng', d: 'veda.ng', t: 'Vedang Vatsa' },
  { s: 'https://hashtagweb3.com', d: 'hashtagweb3.com', t: 'HashtagWeb3' },
];

const PAGES = ['', '/blog', '/about', '/contact', '/jobs', '/terms'];
const e = encodeURIComponent;

// Generate all URLs
function generateURLs() {
  const urls = [];
  
  for (const { s, d, t } of DOMAINS) {
    // ── SEARCH ENGINE PINGS ──
    for (const p of PAGES) {
      urls.push(`https://www.bing.com/indexnow?url=${e(s+p)}&key=cvinbio2026`);
      urls.push(`https://yandex.com/indexnow?url=${e(s+p)}&key=cvinbio2026`);
    }
    urls.push(`https://www.google.com/ping?sitemap=${e(s+'/sitemap.xml')}`);
    urls.push(`https://www.bing.com/ping?sitemap=${e(s+'/sitemap.xml')}`);
    urls.push(`https://blogs.yandex.ru/pings/?status=success&url=${e(s)}`);

    // ── WEB ARCHIVES ──
    for (const p of PAGES) {
      urls.push(`https://web.archive.org/save/${s}${p}`);
    }
    urls.push(`https://archive.ph/?run=1&url=${e(s)}`);

    // ── W3C VALIDATORS ──
    urls.push(`https://validator.w3.org/nu/?doc=${e(s)}`);
    urls.push(`https://jigsaw.w3.org/css-validator/validator?uri=${e(s)}`);
    urls.push(`https://validator.w3.org/checklink?uri=${e(s)}&check=Check`);

    // ── GOOGLE TOOLS ──
    urls.push(`https://pagespeed.web.dev/analysis?url=${e(s)}`);
    urls.push(`https://search.google.com/test/rich-results?url=${e(s)}`);
    urls.push(`https://search.google.com/test/mobile-friendly?url=${e(s)}`);
    urls.push(`https://transparencyreport.google.com/safe-browsing/search?url=${d}`);
    urls.push(`https://webcache.googleusercontent.com/search?q=cache:${d}`);

    // ── SECURITY ──
    urls.push(`https://securityheaders.com/?q=${e(s)}&followRedirects=on`);
    urls.push(`https://observatory.mozilla.org/analyze/${d}`);
    urls.push(`https://observatory.mozilla.org/api/v2/scan?host=${d}`);
    urls.push(`https://www.ssllabs.com/ssltest/analyze.html?d=${d}&latest`);
    urls.push(`https://hstspreload.org/?domain=${d}`);
    urls.push(`https://crt.sh/?q=${d}`);
    urls.push(`https://www.hardenize.com/report/${d}`);
    urls.push(`https://www.immuniweb.com/ssl/?id=${d}`);
    urls.push(`https://www.sslshopper.com/ssl-checker.html#hostname=${d}`);
    urls.push(`https://tls.imirhil.fr/https/${d}`);
    urls.push(`https://www.ssltrust.com.au/ssl-tools/website-security-check?url=${d}`);
    urls.push(`https://www.digicert.com/help/?host=${d}`);

    // ── DNS & WHOIS ──
    urls.push(`https://who.is/whois/${d}`);
    urls.push(`https://www.whatsmydns.net/#A/${d}`);
    urls.push(`https://lookup.icann.org/en/lookup?name=${d}`);
    urls.push(`https://whois.domaintools.com/${d}`);
    urls.push(`https://www.nslookup.io/domains/${d}/dns-records/`);
    urls.push(`https://dnschecker.org/#A/${d}`);
    urls.push(`https://dnschecker.org/#MX/${d}`);
    urls.push(`https://dnschecker.org/#NS/${d}`);
    urls.push(`https://dnschecker.org/#CNAME/${d}`);
    urls.push(`https://dnschecker.org/#TXT/${d}`);
    urls.push(`https://viewdns.info/whois/?domain=${d}`);
    urls.push(`https://viewdns.info/reverseip/?host=${d}&t=1`);
    urls.push(`https://viewdns.info/dnsrecord/?domain=${d}`);
    urls.push(`https://viewdns.info/httpheaders/?domain=${d}`);
    urls.push(`https://viewdns.info/reversedns/?ip=${d}`);
    urls.push(`https://viewdns.info/portscan/?host=${d}`);
    urls.push(`https://intodns.com/${d}`);
    urls.push(`https://bgp.he.net/dns/${d}`);
    urls.push(`https://dnslytics.com/domain/${d}`);
    urls.push(`https://centralops.net/co/DomainDossier.aspx?addr=${d}&dom_whois=true&net_whois=true&dom_dns=true`);
    urls.push(`https://myip.ms/${d}`);
    urls.push(`https://ipinfo.io/${d}`);
    urls.push(`https://www.robtex.com/dns-lookup/${d}`);
    urls.push(`https://dnsviz.net/d/${d}/analyze/`);
    urls.push(`https://dnsdumpster.com/?domain=${d}`);
    urls.push(`https://dnsspy.io/scan/${d}`);
    urls.push(`https://www.dnsqueries.com/en/domain_check.php?domain=${d}`);
    urls.push(`https://www.dnsqueries.com/en/dns_lookup.php?query=${d}`);
    urls.push(`https://www.dnsqueries.com/en/hosting_info.php?query=${d}`);
    urls.push(`https://mxtoolbox.com/SuperTool.aspx?action=https%3a${d}&run=toolpage`);
    urls.push(`https://www.domcop.com/whois/${d}`);

    // ── SEO & ANALYTICS ──
    urls.push(`https://builtwith.com/${d}`);
    urls.push(`https://trends.builtwith.com/websitelist/${d}`);
    urls.push(`https://www.wappalyzer.com/lookup/${d}/`);
    urls.push(`https://www.similarweb.com/website/${d}/`);
    urls.push(`https://www.seoptimer.com/${d}`);
    urls.push(`https://hypestat.com/info/${d}`);
    urls.push(`https://www.siteworthtraffic.com/report/${d}`);
    urls.push(`https://www.worthofweb.com/website-value/${d}/`);
    urls.push(`https://www.statscrop.com/www/${d}`);
    urls.push(`https://spyonweb.com/${d}`);
    urls.push(`https://nibbler.insites.com/en/reports/${d}`);
    urls.push(`https://www.seobility.net/en/seocheck/${d}`);
    urls.push(`https://freetools.seobility.net/en/linkcheck/${d}`);
    urls.push(`https://www.seocheck.in/report/${d}`);
    urls.push(`https://www.woorank.com/en/teaser/review/${d}`);
    urls.push(`https://smallseotools.com/website-seo-score-checker/?url=${d}`);
    urls.push(`https://neilpatel.com/seo-analyzer/result/?url=${e(s)}`);
    urls.push(`https://www.websiteplanet.com/webtools/seo-checker/?url=${d}`);
    urls.push(`https://www.semrush.com/analytics/overview/?q=${d}`);
    urls.push(`https://ahrefs.com/backlink-checker/?input=${d}&mode=subdomains`);
    urls.push(`https://moz.com/domain-analysis?site=${d}`);
    urls.push(`https://www.duplichecker.com/domain-authority-checker.php?url=${d}`);
    urls.push(`https://www.prepostseo.com/domain-authority-checker?url=${d}`);

    // ── SITE STATS & VALUE ──
    urls.push(`https://www.urlvoid.com/scan/${d}/`);
    urls.push(`https://www.virustotal.com/gui/domain/${d}`);
    urls.push(`https://sitecheck.sucuri.net/results/${d}`);
    urls.push(`https://sitereport.netcraft.com/?url=${s}`);
    urls.push(`https://www.isitdownrightnow.com/${d}.html`);
    urls.push(`https://downforeveryoneorjustme.com/${d}`);
    urls.push(`https://www.websitecarbon.com/website/${d}/`);
    urls.push(`https://api.websitecarbon.com/site?url=${e(s)}`);
    urls.push(`https://www.websitevaluecheck.com/check.php?url=${d}`);
    urls.push(`https://www.yourwebsitevalue.com/value/${d}`);
    urls.push(`https://www.webvaluerank.com/www.${d}`);
    urls.push(`https://statvoo.com/website/${d}`);
    urls.push(`https://www.markosweb.com/www/${d}/`);
    urls.push(`https://www.scamvoid.net/check/${d}/`);
    urls.push(`https://webstatsdomain.org/d/${d}`);
    urls.push(`https://www.siteprice.org/website-worth/${d}`);
    urls.push(`https://www.cubestat.com/www.${d}`);
    urls.push(`https://www.statshow.com/www/${d}`);
    urls.push(`https://www.sitetrail.com/${d}`);
    urls.push(`https://www.whoishostingthis.com/${d}`);
    urls.push(`https://hostadvice.com/tools/whois/${d}`);
    urls.push(`https://www.ip-adress.com/website/${d}`);
    urls.push(`https://www.nerdydata.com/search?query=${d}`);
    urls.push(`https://www.websiteoutlook.com/www.${d}`);
    urls.push(`https://www.topsitessearch.com/www.${d}/`);
    urls.push(`https://www.websumo.co/website/${d}`);
    urls.push(`https://www.estimatedworth.com/www.${d}`);

    // ── PERFORMANCE ──
    urls.push(`https://gtmetrix.com/?url=${e(s)}`);
    urls.push(`https://tools.keycdn.com/speed?url=${e(s)}`);
    urls.push(`https://tools.pingdom.com/?url=${e(s)}`);
    urls.push(`https://www.uptrends.com/tools/website-speed-test?url=${e(s)}`);
    urls.push(`https://www.bytecheck.com/results?resource=${e(s)}`);
    urls.push(`https://www.giftofspeed.com/gzip-test/?url=${e(s)}`);
    urls.push(`https://www.giftofspeed.com/redirect-checker/?url=${e(s)}`);
    urls.push(`https://www.giftofspeed.com/cache-checker/?url=${e(s)}`);
    urls.push(`https://performance.sucuri.net/domain/${d}`);
    urls.push(`https://check-host.net/check-http?host=${e(s)}`);
    urls.push(`https://www.dotcom-tools.com/website-speed-test?url=${e(s)}`);
    urls.push(`https://www.debugbear.com/test/website-speed?url=${e(s)}`);
    urls.push(`https://yellowlab.tools/api/runs?url=${e(s)}`);
    urls.push(`https://sitechecker.pro/website-checker/?url=${e(s)}`);

    // ── SOCIAL BOOKMARKS ──
    urls.push(`https://mix.com/add?url=${e(s)}`);
    urls.push(`https://www.diigo.com/item/new/bookmark?url=${e(s)}&title=${e(t)}`);
    urls.push(`https://www.folkd.com/submit.php?url=${e(s)}`);
    urls.push(`https://www.instapaper.com/hello2?url=${e(s)}&title=${e(t)}`);
    urls.push(`https://getpocket.com/save?url=${e(s)}&title=${e(t)}`);
    urls.push(`https://share.flipboard.com/bookmarklet/popout?v=2&url=${e(s)}&title=${e(t)}`);
    urls.push(`https://slashdot.org/bookmark.pl?url=${e(s)}&title=${e(t)}`);
    urls.push(`https://www.reddit.com/submit?url=${e(s)}&title=${e(t)}`);
    urls.push(`https://www.linkedin.com/sharing/share-offsite/?url=${e(s)}`);
    urls.push(`https://www.scoop.it/bookmarklet?url=${e(s)}`);

    // ── ACCESSIBILITY ──
    urls.push(`https://wave.webaim.org/report#/${s}`);
    urls.push(`https://www.accessibilitychecker.org/audit/?website=${e(s)}`);
    urls.push(`https://web.dev/measure/?url=${e(s)}`);
    urls.push(`https://responsivetesttool.com/?url=${d}`);

    // ── META & OG ──
    urls.push(`https://metatags.io/?url=${e(s)}`);
    urls.push(`https://developers.facebook.com/tools/debug/?q=${e(s)}`);
    urls.push(`https://www.opengraph.xyz/url/${e(s)}`);
    urls.push(`https://realfavicongenerator.net/favicon_checker?protocol=https&site=${d}`);
    urls.push(`https://favicon-checker.com/${d}`);

    // ── MISC ──
    urls.push(`https://httpstatus.io/${d}`);
    urls.push(`https://www.redirect-checker.org/index.php?url=${e(s)}`);
    urls.push(`https://www.brokenlinkcheck.com/broken-links.php?s=${e(s)}`);
    urls.push(`https://www.deadlinkchecker.com/website-dead-link-checker.asp?website=${e(s)}`);
    urls.push(`https://validator.schema.org/#url=${e(s)}`);
    urls.push(`https://www.xml-sitemaps.com/validate-xml-sitemap.html?op=validate-xml-sitemap&sitemap_url=${e(s+'/sitemap.xml')}`);
    urls.push(`https://www.ranks.nl/linkchecker?url=${e(s)}`);
    urls.push(`https://w3techs.com/sites/info/${d}`);
    urls.push(`https://www.webscout.io/url/${d}`);
    urls.push(`https://www.whatsmyip.org/check-headers/?url=${e(s)}`);
    urls.push(`https://www.webconfs.com/http-header-check.php?url=${e(s)}`);
    urls.push(`https://www.dareboost.com/en/report/${d}`);
    urls.push(`https://seranking.com/domain.html?domain=${d}`);
    urls.push(`https://www.serpchecker.com/serp-checker?keyword=${e(d)}`);
  }

  return urls;
}

// Worker pool
async function runParallel(urls, concurrency) {
  let idx = 0;
  let ok = 0, fail = 0;
  const total = urls.length;

  async function worker() {
    while (true) {
      const i = idx++;
      if (i >= total) return;
      const url = urls[i];
      const ac = new AbortController();
      const timer = setTimeout(() => ac.abort(), 6000);
      try {
        const r = await fetch(url, {
          signal: ac.signal, redirect: 'follow',
          headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36' },
        });
        clearTimeout(timer);
        if (r.status >= 200 && r.status < 400) ok++;
        else fail++;
      } catch {
        clearTimeout(timer);
        fail++;
      }
      // Print progress every 50
      if ((ok + fail) % 50 === 0) {
        process.stdout.write(`\r   Progress: ${ok + fail}/${total} | ✅ ${ok} | ❌ ${fail}`);
      }
    }
  }

  const workers = Array.from({ length: concurrency }, () => worker());
  await Promise.allSettled(workers);
  return { ok, fail, total };
}

async function main() {
  const urls = generateURLs();
  // Deduplicate
  const unique = [...new Set(urls)];
  
  console.log(`\n🚀 Mass Parallel Backlink Builder`);
  console.log(`   Domains: ${DOMAINS.map(d => d.d).join(', ')}`);
  console.log(`   URLs generated: ${urls.length} (${unique.length} unique)`);
  console.log(`   Concurrency: 100 workers`);
  console.log(`   Timeout: 6s per request\n`);

  const start = Date.now();
  const { ok, fail, total } = await runParallel(unique, 100);
  const elapsed = ((Date.now() - start) / 1000).toFixed(1);

  console.log(`\n\n${'═'.repeat(55)}`);
  console.log(`   DONE in ${elapsed}s`);
  console.log(`   Total: ${total} | ✅ Live: ${ok} | ❌ Failed: ${fail}`);
  console.log(`   Success rate: ${((ok/total)*100).toFixed(1)}%`);
  console.log(`${'═'.repeat(55)}`);
}

main().catch(console.error);
