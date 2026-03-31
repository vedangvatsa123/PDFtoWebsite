#!/usr/bin/env node
// Batch 2: 100 more backlink targets for cvin.bio
// All new services not in batch 1

const SITE = 'https://cvin.bio';
const D = 'cvin.bio';
const T = 'CVin.Bio - Turn Your CV into a Website';

let ok = 0, fail = 0, n = 0;

async function h(url) {
  n++;
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), 6000);
  try {
    const r = await fetch(url, {
      signal: ac.signal, redirect: 'follow',
      headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36' },
    });
    clearTimeout(t);
    if (r.status >= 200 && r.status < 400) { ok++; process.stdout.write('✅ '); }
    else { fail++; process.stdout.write('❌ '); }
  } catch { clearTimeout(t); fail++; process.stdout.write('⏳ '); }
  if (n % 25 === 0) process.stdout.write(`\n   [${ok}/${n}] `);
}

async function main() {
  console.log(`\n🔗 Batch 2: 100 more backlinks for ${SITE}\n`);
  process.stdout.write('   ');

  const e = encodeURIComponent;

  // ── WHOIS & IP TOOLS (20) ──
  await h(`https://who.is/whois/${D}`);
  await h(`https://www.whatsmydns.net/#A/${D}`);
  await h(`https://dnsdumpster.com/?domain=${D}`);
  await h(`https://www.nslookup.io/domains/${D}/dns-records/`);
  await h(`https://lookup.icann.org/en/lookup?name=${D}`);
  await h(`https://www.ip-adress.com/website/${D}`);
  await h(`https://myip.ms/${D}`);
  await h(`https://ipinfo.io/${D}`);
  await h(`https://bgp.he.net/dns/${D}`);
  await h(`https://dnsspy.io/scan/${D}`);
  await h(`https://www.nerdydata.com/search?query=${D}`);
  await h(`https://sitechecker.pro/website-checker/?url=${e(SITE)}`);
  await h(`https://www.whatsmyip.org/check-headers/?url=${e(SITE)}`);
  await h(`https://www.duplichecker.com/domain-authority-checker.php?url=${D}`);
  await h(`https://www.prepostseo.com/domain-authority-checker?url=${D}`);
  await h(`https://check-host.net/check-http?host=${e(SITE)}`);
  await h(`https://www.webconfs.com/http-header-check.php?url=${e(SITE)}`);
  await h(`https://tools.keycdn.com/speed?url=${e(SITE)}`);
  await h(`https://www.uptrends.com/tools/website-speed-test?url=${e(SITE)}`);
  await h(`https://tools.pingdom.com/?url=${e(SITE)}`);

  // ── SECURITY & SSL (15) ──
  await h(`https://www.immuniweb.com/ssl/?id=${D}`);
  await h(`https://crt.sh/?q=${D}`);
  await h(`https://transparencyreport.google.com/safe-browsing/search?url=${D}`);
  await h(`https://www.ssllabs.com/ssltest/analyze.html?d=${D}`);
  await h(`https://www.hardenize.com/report/${D}`);
  await h(`https://hstspreload.org/?domain=${D}`);
  await h(`https://www.sslshopper.com/ssl-checker.html#hostname=${D}`);
  await h(`https://www.digicert.com/help/?host=${D}`);
  await h(`https://www.cloudflare.com/lp/ssl-test/?domain=${D}`);
  await h(`https://ciphersuite.info/search/?q=${D}`);
  await h(`https://decentsecurity.com/#/link-report/?url=${e(SITE)}`);
  await h(`https://report-uri.com/home/analyse?url=${e(SITE)}`);
  await h(`https://www.ssltrust.com.au/ssl-tools/website-security-check?url=${D}`);
  await h(`https://observatory.mozilla.org/api/v2/scan?host=${D}`);
  await h(`https://tls.imirhil.fr/https/${D}`);

  // ── SEO CHECKERS (15) ──
  await h(`https://www.seobility.net/en/seocheck/${D}`);
  await h(`https://freetools.seobility.net/en/linkcheck/${D}`);
  await h(`https://www.seocheck.in/report/${D}`);
  await h(`https://www.seositecheckup.com/seo-audit/${D}`);
  await h(`https://www.dnsqueries.com/en/domain_check.php?domain=${D}`);
  await h(`https://www.dnsqueries.com/en/hosting_info.php?query=${D}`);
  await h(`https://www.websiteoutlook.com/www.${D}`);
  await h(`https://www.serpchecker.com/serp-checker?keyword=${e(D)}`);
  await h(`https://smallseotools.com/website-seo-score-checker/?url=${D}`);
  await h(`https://neilpatel.com/seo-analyzer/result/?url=${e(SITE)}`);
  await h(`https://www.dnsqueries.com/en/dns_lookup.php?query=${D}`);
  await h(`https://www.woorank.com/en/teaser/review/${D}`);
  await h(`https://www.dareboost.com/en/report/${D}`);
  await h(`https://www.websiteplanet.com/webtools/seo-checker/?url=${D}`);
  await h(`https://seranking.com/domain.html?domain=${D}`);

  // ── PERFORMANCE & SPEED (10) ──
  await h(`https://www.dotcom-tools.com/website-speed-test?url=${e(SITE)}`);
  await h(`https://yellowlab.tools/api/runs?url=${e(SITE)}`);
  await h(`https://www.bytecheck.com/results?resource=${e(SITE)}`);
  await h(`https://www.cdnperf.com/tools/cdn-latency-benchmark?url=${e(SITE)}`);
  await h(`https://www.giftofspeed.com/gzip-test/?url=${e(SITE)}`);
  await h(`https://www.giftofspeed.com/redirect-checker/?url=${e(SITE)}`);
  await h(`https://www.webpagetest.org/result/?url=${e(SITE)}`);
  await h(`https://performance.sucuri.net/domain/${D}`);
  await h(`https://www.loadimpact.com/loadtest?url=${e(SITE)}`);
  await h(`https://www.debugbear.com/test/website-speed?url=${e(SITE)}`);

  // ── SITE WORTH & STATS (15) ──
  await h(`https://www.websitevaluecheck.com/check.php?url=${D}`);
  await h(`https://www.websitevaluecalculator.com/check/${D}`);
  await h(`https://www.yourwebsitevalue.com/value/${D}`);
  await h(`https://www.websitevaluechecker.com/checker/${D}`);
  await h(`https://www.webvaluerank.com/www.${D}`);
  await h(`https://www.sitevaluecheck.com/check/${D}`);
  await h(`https://www.domcop.com/whois/${D}`);
  await h(`https://statvoo.com/website/${D}`);
  await h(`https://www.websumo.co/website/${D}`);
  await h(`https://www.websiteiq.com/check/${D}`);
  await h(`https://www.ipsaya.com/website-analysis/${D}`);
  await h(`https://www.topsitessearch.com/www.${D}/`);
  await h(`https://www.markosweb.com/www/${D}/`);
  await h(`https://www.ranks.nl/linkchecker?url=${e(SITE)}`);
  await h(`https://www.scamvoid.net/check/${D}/`);

  // ── ACCESSIBILITY & MISC (15) ──
  await h(`https://wave.webaim.org/report#/${SITE}`);
  await h(`https://www.accessibilitychecker.org/audit/?website=${e(SITE)}`);
  await h(`https://achecker.acequality.com/checker/index.php?uri=${e(SITE)}`);
  await h(`https://www.deque.com/axe/auditor/?url=${e(SITE)}`);
  await h(`https://responsivetesttool.com/?url=${D}`);
  await h(`https://web.dev/measure/?url=${e(SITE)}`);
  await h(`https://favicon-checker.com/${D}`);
  await h(`https://metatags.io/?url=${e(SITE)}`);
  await h(`https://cards-dev.twitter.com/validator?url=${e(SITE)}`);
  await h(`https://developers.facebook.com/tools/debug/?q=${e(SITE)}`);
  await h(`https://www.opengraph.xyz/url/${e(SITE)}`);
  await h(`https://realfavicongenerator.net/favicon_checker?protocol=https&site=${D}`);
  await h(`https://www.xml-sitemaps.com/validate-xml-sitemap.html?op=validate-xml-sitemap&sitemap_url=${e(SITE+'/sitemap.xml')}`);
  await h(`https://www.deadlinkchecker.com/website-dead-link-checker.asp?website=${e(SITE)}`);
  await h(`https://www.websitegoodies.com/tools/check-http-status-code.php?url=${e(SITE)}`);

  // ── PING BATCH (10) ──
  await h(`https://www.google.com/ping?sitemap=${e(SITE+'/sitemap.xml')}`);
  await h(`https://www.bing.com/ping?sitemap=${e(SITE+'/sitemap.xml')}`);
  await h(`https://blogs.yandex.ru/pings/?status=success&url=${e(SITE)}`);
  await h(`https://www.bing.com/indexnow?url=${e(SITE+'/jobs')}&key=cvinbio2026`);
  await h(`https://www.bing.com/indexnow?url=${e(SITE+'/blog')}&key=cvinbio2026`);
  await h(`https://www.bing.com/indexnow?url=${e(SITE+'/terms')}&key=cvinbio2026`);
  await h(`https://www.bing.com/indexnow?url=${e(SITE+'/contact')}&key=cvinbio2026`);
  await h(`https://yandex.com/indexnow?url=${e(SITE+'/jobs')}&key=cvinbio2026`);
  await h(`https://yandex.com/indexnow?url=${e(SITE+'/blog')}&key=cvinbio2026`);
  await h(`https://yandex.com/indexnow?url=${e(SITE+'/contact')}&key=cvinbio2026`);

  console.log(`\n\n${'='.repeat(50)}`);
  console.log(`BATCH 2 TOTAL: ${n} | ✅ ${ok} | ❌ ${fail}`);
  console.log(`Combined with Batch 1: ${102 + n} total, ~${52 + ok} live`);
  console.log(`${'='.repeat(50)}`);
}

main().catch(console.error);
