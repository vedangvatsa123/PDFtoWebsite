#!/usr/bin/env node
// Backlink builder for multiple domains
// Runs ~200 services per domain

const DOMAINS = [
  { site: 'https://veda.ng', domain: 'veda.ng', title: 'Vedang Vatsa - Personal Website' },
  { site: 'https://hashtagweb3.com', domain: 'hashtagweb3.com', title: 'HashtagWeb3 - Web3 Education' },
];

let grand = { ok: 0, fail: 0, total: 0 };

async function h(url) {
  grand.total++;
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), 6000);
  try {
    const r = await fetch(url, {
      signal: ac.signal, redirect: 'follow',
      headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36' },
    });
    clearTimeout(t);
    if (r.status >= 200 && r.status < 400) { grand.ok++; process.stdout.write('✅ '); }
    else { grand.fail++; process.stdout.write('❌ '); }
  } catch { clearTimeout(t); grand.fail++; process.stdout.write('⏳ '); }
  if (grand.total % 25 === 0) process.stdout.write(`\n   [${grand.ok}/${grand.total}] `);
}

const rpcBody = (title, url) => `<?xml version="1.0"?><methodCall><methodName>weblogUpdates.ping</methodName><params><param><value>${title}</value></param><param><value>${url}</value></param></params></methodCall>`;

async function runForDomain({ site, domain, title }) {
  const e = encodeURIComponent;
  const rpc = { method: 'POST', headers: { 'Content-Type': 'text/xml' }, body: rpcBody(title, site) };

  console.log(`\n${'═'.repeat(50)}`);
  console.log(`🔗 ${domain}`);
  console.log(`${'═'.repeat(50)}`);
  process.stdout.write('   ');

  // PINGS (10)
  await h(`https://www.google.com/ping?sitemap=${e(site+'/sitemap.xml')}`);
  await h(`https://www.bing.com/ping?sitemap=${e(site+'/sitemap.xml')}`);
  await h(`https://www.bing.com/indexnow?url=${e(site)}&key=cvinbio2026`);
  await h(`https://yandex.com/indexnow?url=${e(site)}&key=cvinbio2026`);
  await h(`https://www.bing.com/indexnow?url=${e(site+'/blog')}&key=cvinbio2026`);
  await h(`https://blogs.yandex.ru/pings/?status=success&url=${e(site)}`);
  await h('http://rpc.pingomatic.com/', rpc);
  await h('http://rpc.weblogs.com/RPC2', rpc);
  await h('http://ping.feedburner.com/', rpc);
  await h('http://blogsearch.google.com/ping/RPC2', rpc);

  // ARCHIVES (5)
  await h(`https://web.archive.org/save/${site}`);
  await h(`https://web.archive.org/save/${site}/blog`);
  await h(`https://archive.ph/?run=1&url=${e(site)}`);
  await h(`https://webcache.googleusercontent.com/search?q=cache:${domain}`);
  await h(`https://web.archive.org/save/${site}/about`);

  // VALIDATORS (15)
  await h(`https://validator.w3.org/nu/?doc=${e(site)}`);
  await h(`https://jigsaw.w3.org/css-validator/validator?uri=${e(site)}`);
  await h(`https://validator.w3.org/checklink?uri=${e(site)}&check=Check`);
  await h(`https://securityheaders.com/?q=${e(site)}&followRedirects=on`);
  await h(`https://observatory.mozilla.org/analyze/${domain}`);
  await h(`https://pagespeed.web.dev/analysis?url=${e(site)}`);
  await h(`https://search.google.com/test/rich-results?url=${e(site)}`);
  await h(`https://search.google.com/test/mobile-friendly?url=${e(site)}`);
  await h(`https://www.ssllabs.com/ssltest/analyze.html?d=${domain}&latest`);
  await h(`https://hstspreload.org/?domain=${domain}`);
  await h(`https://crt.sh/?q=${domain}`);
  await h(`https://transparencyreport.google.com/safe-browsing/search?url=${domain}`);
  await h(`https://wave.webaim.org/report#/${site}`);
  await h(`https://www.accessibilitychecker.org/audit/?website=${e(site)}`);
  await h(`https://metatags.io/?url=${e(site)}`);

  // DNS/WHOIS (15)
  await h(`https://who.is/whois/${domain}`);
  await h(`https://www.whatsmydns.net/#A/${domain}`);
  await h(`https://lookup.icann.org/en/lookup?name=${domain}`);
  await h(`https://whois.domaintools.com/${domain}`);
  await h(`https://www.nslookup.io/domains/${domain}/dns-records/`);
  await h(`https://dnschecker.org/#A/${domain}`);
  await h(`https://viewdns.info/whois/?domain=${domain}`);
  await h(`https://intodns.com/${domain}`);
  await h(`https://bgp.he.net/dns/${domain}`);
  await h(`https://dnslytics.com/domain/${domain}`);
  await h(`https://centralops.net/co/DomainDossier.aspx?addr=${domain}&dom_whois=true&net_whois=true&dom_dns=true`);
  await h(`https://myip.ms/${domain}`);
  await h(`https://ipinfo.io/${domain}`);
  await h(`https://www.robtex.com/dns-lookup/${domain}`);
  await h(`https://dnsviz.net/d/${domain}/analyze/`);

  // SEO/STATS (20)
  await h(`https://builtwith.com/${domain}`);
  await h(`https://www.wappalyzer.com/lookup/${domain}/`);
  await h(`https://www.similarweb.com/website/${domain}/`);
  await h(`https://www.seoptimer.com/${domain}`);
  await h(`https://hypestat.com/info/${domain}`);
  await h(`https://www.siteworthtraffic.com/report/${domain}`);
  await h(`https://www.worthofweb.com/website-value/${domain}/`);
  await h(`https://www.statscrop.com/www/${domain}`);
  await h(`https://spyonweb.com/${domain}`);
  await h(`https://www.urlvoid.com/scan/${domain}/`);
  await h(`https://www.virustotal.com/gui/domain/${domain}`);
  await h(`https://sucuri.net/results/${domain}`);
  await h(`https://sitereport.netcraft.com/?url=${site}`);
  await h(`https://www.isitdownrightnow.com/${domain}.html`);
  await h(`https://downforeveryoneorjustme.com/${domain}`);
  await h(`https://www.websitecarbon.com/website/${domain}/`);
  await h(`https://api.websitecarbon.com/site?url=${e(site)}`);
  await h(`https://nibbler.insites.com/en/reports/${domain}`);
  await h(`https://www.seobility.net/en/seocheck/${domain}`);
  await h(`https://freetools.seobility.net/en/linkcheck/${domain}`);

  // PERFORMANCE (10)
  await h(`https://gtmetrix.com/?url=${e(site)}`);
  await h(`https://tools.keycdn.com/speed?url=${e(site)}`);
  await h(`https://tools.pingdom.com/?url=${e(site)}`);
  await h(`https://www.uptrends.com/tools/website-speed-test?url=${e(site)}`);
  await h(`https://www.bytecheck.com/results?resource=${e(site)}`);
  await h(`https://www.giftofspeed.com/gzip-test/?url=${e(site)}`);
  await h(`https://www.giftofspeed.com/redirect-checker/?url=${e(site)}`);
  await h(`https://www.giftofspeed.com/cache-checker/?url=${e(site)}`);
  await h(`https://performance.sucuri.net/domain/${domain}`);
  await h(`https://check-host.net/check-http?host=${e(site)}`);

  // SOCIAL/BOOKMARKS (10)
  await h(`https://mix.com/add?url=${e(site)}`);
  await h(`https://www.diigo.com/item/new/bookmark?url=${e(site)}&title=${e(title)}`);
  await h(`https://www.folkd.com/submit.php?url=${e(site)}`);
  await h(`https://www.instapaper.com/hello2?url=${e(site)}&title=${e(title)}`);
  await h(`https://getpocket.com/save?url=${e(site)}&title=${e(title)}`);
  await h(`https://share.flipboard.com/bookmarklet/popout?v=2&url=${e(site)}&title=${e(title)}`);
  await h(`https://slashdot.org/bookmark.pl?url=${e(site)}&title=${e(title)}`);
  await h(`https://www.reddit.com/submit?url=${e(site)}&title=${e(title)}`);
  await h(`https://www.linkedin.com/sharing/share-offsite/?url=${e(site)}`);
  await h(`https://www.scoop.it/bookmarklet?url=${e(site)}`);

  // SITE VALUE (15)
  await h(`https://www.websitevaluecheck.com/check.php?url=${domain}`);
  await h(`https://www.yourwebsitevalue.com/value/${domain}`);
  await h(`https://www.webvaluerank.com/www.${domain}`);
  await h(`https://statvoo.com/website/${domain}`);
  await h(`https://www.markosweb.com/www/${domain}/`);
  await h(`https://www.scamvoid.net/check/${domain}/`);
  await h(`https://www.domcop.com/whois/${domain}`);
  await h(`https://webstatsdomain.org/d/${domain}`);
  await h(`https://www.siteprice.org/website-worth/${domain}`);
  await h(`https://www.cubestat.com/www.${domain}`);
  await h(`https://www.statshow.com/www/${domain}`);
  await h(`https://www.sitetrail.com/${domain}`);
  await h(`https://www.whoishostingthis.com/${domain}`);
  await h(`https://hostadvice.com/tools/whois/${domain}`);
  await h(`https://www.ip-adress.com/website/${domain}`);

  // MISC (5)
  await h(`https://httpstatus.io/${domain}`);
  await h(`https://www.redirect-checker.org/index.php?url=${e(site)}`);
  await h(`https://developers.facebook.com/tools/debug/?q=${e(site)}`);
  await h(`https://www.opengraph.xyz/url/${e(site)}`);
  await h(`https://realfavicongenerator.net/favicon_checker?protocol=https&site=${domain}`);
}

async function main() {
  console.log('🔗 Multi-domain backlink builder\n');

  for (const d of DOMAINS) {
    await runForDomain(d);
    console.log(`\n   ${d.domain}: done`);
  }

  console.log(`\n${'═'.repeat(50)}`);
  console.log(`GRAND TOTAL: ${grand.total} | ✅ ${grand.ok} | ❌ ${grand.fail}`);
  console.log(`${'═'.repeat(50)}`);
}

main().catch(console.error);
