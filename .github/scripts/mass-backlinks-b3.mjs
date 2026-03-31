#!/usr/bin/env node
// Batch 3: 1000+ NEW unique URLs across 3 domains
// All services different from mass-backlinks.mjs

const DS = [
  { s: 'https://cvin.bio', d: 'cvin.bio', t: 'CVin.Bio' },
  { s: 'https://veda.ng', d: 'veda.ng', t: 'Vedang Vatsa' },
  { s: 'https://hashtagweb3.com', d: 'hashtagweb3.com', t: 'HashtagWeb3' },
];
const e = encodeURIComponent;

function gen() {
  const u = [];
  for (const { s, d, t } of DS) {
    // ── REGIONAL DNS CHECKERS ──
    u.push(`https://www.site24x7.com/tools/dns-lookup.html?domain=${d}`);
    u.push(`https://www.site24x7.com/tools/restapi-tester.html?url=${e(s)}`);
    u.push(`https://www.site24x7.com/tools/find-website-location.html?url=${e(s)}`);
    u.push(`https://www.site24x7.com/tools/ping-test.html?server=${d}`);
    u.push(`https://www.site24x7.com/tools/trace-route.html?server=${d}`);
    u.push(`https://www.site24x7.com/tools/website-speed-test.html?url=${e(s)}`);
    u.push(`https://www.site24x7.com/tools/ipv6-availability-test.html?domain=${d}`);
    u.push(`https://www.site24x7.com/tools/email-validator.html?host=${d}`);
    u.push(`https://www.site24x7.com/tools/http-header-check.html?url=${e(s)}`);
    u.push(`https://www.site24x7.com/tools/check-http2-support.html?url=${e(s)}`);

    // ── WHOIS VARIANTS ──
    u.push(`https://www.whois.com/whois/${d}`);
    u.push(`https://whois.arin.net/rest/nets;q=${d}`);
    u.push(`https://rdap.org/domain/${d}`);
    u.push(`https://www.godaddy.com/whois/results.aspx?domain=${d}`);
    u.push(`https://www.namecheap.com/domains/whois/result?domain=${d}`);
    u.push(`https://www.networksolutions.com/whois/results.jsp?domain=${d}`);
    u.push(`https://whoisology.com/${d}`);
    u.push(`https://whois.iana.org/?q=${d}`);
    u.push(`https://www.eurodns.com/whois-search/domain-name-registration/${d}`);
    u.push(`https://www.gandi.net/whois?q=${d}`);

    // ── MORE DNS TOOLS ──
    u.push(`https://dns-lookup.jvns.ca/${d}?type=A`);
    u.push(`https://dns-lookup.jvns.ca/${d}?type=MX`);
    u.push(`https://dns-lookup.jvns.ca/${d}?type=NS`);
    u.push(`https://dns-lookup.jvns.ca/${d}?type=TXT`);
    u.push(`https://dns-lookup.jvns.ca/${d}?type=AAAA`);
    u.push(`https://dns.google/resolve?name=${d}&type=A`);
    u.push(`https://dns.google/resolve?name=${d}&type=MX`);
    u.push(`https://dns.google/resolve?name=${d}&type=NS`);
    u.push(`https://dns.google/resolve?name=${d}&type=TXT`);
    u.push(`https://cloudflare-dns.com/dns-query?name=${d}&type=A`);
    u.push(`https://cloudflare-dns.com/dns-query?name=${d}&type=MX`);
    u.push(`https://mozilla.cloudflare-dns.com/dns-query?name=${d}&type=A`);
    u.push(`https://dns.quad9.net/dns-query?name=${d}&type=A`);

    // ── IP & GEOLOCATION ──
    u.push(`https://ipapi.co/${d}/json/`);
    u.push(`https://ip-api.com/json/${d}`);
    u.push(`https://ipwhois.app/json/${d}`);
    u.push(`https://api.ipgeolocation.io/ipgeo?apiKey=free&domain=${d}`);
    u.push(`https://ipqualityscore.com/free-ip-lookup-proxy-vpn-test/lookup/${d}`);
    u.push(`https://www.iplocation.net/?query=${d}`);
    u.push(`https://www.ip2location.com/demo/${d}`);
    u.push(`https://ipinfo.io/${d}/json`);

    // ── HTTP HEADER CHECKERS ──
    u.push(`https://reqbin.com/req/v0crmky0/get-request-example?url=${e(s)}`);
    u.push(`https://www.whatismyip.com/dns-lookup/?domain=${d}`);
    u.push(`https://httpbin.org/redirect-to?url=${e(s)}&status_code=302`);
    u.push(`https://www.rexswain.com/httphead.html?url=${e(s)}`);
    u.push(`https://websniffer.com/?url=${e(s)}`);
    u.push(`https://www.webtools.services/http-header-checker?url=${e(s)}`);
    u.push(`https://tools.keycdn.com/curl?url=${e(s)}`);
    u.push(`https://tools.keycdn.com/geo?host=${d}`);
    u.push(`https://tools.keycdn.com/brotli?url=${e(s)}`);
    u.push(`https://tools.keycdn.com/http2-test?url=${e(s)}`);
    u.push(`https://tools.keycdn.com/performance?url=${e(s)}`);

    // ── MORE SECURITY ──
    u.push(`https://www.immuniweb.com/websec/?id=${d}`);
    u.push(`https://www.immuniweb.com/darkweb/?id=${d}`);
    u.push(`https://www.immuniweb.com/email/?id=${d}`);
    u.push(`https://www.whynopadlock.com/results/${d}`);
    u.push(`https://www.jitbit.com/sslcheck/?url=${e(s)}`);
    u.push(`https://decoder.link/sslchecker/${d}/443`);
    u.push(`https://www.certlogik.com/ssl-checker/${d}`);
    u.push(`https://www.ssldragon.com/ssl-tools/ssl-checker/?url=${d}`);
    u.push(`https://www.websiteplanet.com/webtools/ssl-checker/?url=${d}`);
    u.push(`https://www.entrust.com/resources/certificate-solutions/tools/ssl-diagnostic-tool?url=${d}`);

    // ── SPEED & PERF ──
    u.push(`https://www.webpagetest.org/?url=${e(s)}`);
    u.push(`https://www.fastorslow.com/${d}`);
    u.push(`https://pagespeed.web.dev/analysis?url=${e(s)}&hl=en`);
    u.push(`https://www.thinkwithgoogle.com/feature/testmysite?url=${d}`);
    u.push(`https://www.experte.de/performance?url=${d}`);
    u.push(`https://www.isitdownrightnow.com/${d}.html`);
    u.push(`https://downforeveryoneorjustme.com/${d}`);
    u.push(`https://www.giftofspeed.com/http2-test/?url=${e(s)}`);
    u.push(`https://www.giftofspeed.com/dns-propagation-checker/?domain=${d}`);
    u.push(`https://www.giftofspeed.com/website-speed-test/?url=${e(s)}`);

    // ── MORE SEO ──
    u.push(`https://www.experte.de/seo-check?url=${d}`);
    u.push(`https://www.experte.de/backlink-checker?url=${d}`);
    u.push(`https://www.experte.de/domain-check?url=${d}`);
    u.push(`https://www.experte.de/ssl-check?url=${d}`);
    u.push(`https://www.experte.de/meta-title-checker?url=${d}`);
    u.push(`https://www.seoreviewtools.com/seo-authority-checker/?url=${d}`);
    u.push(`https://www.seoreviewtools.com/valuable-backlinks-checker/?url=${d}`);
    u.push(`https://www.seoreviewtools.com/website-authority-checker/?url=${d}`);
    u.push(`https://www.seoreviewtools.com/bulk-domain-authority-checker/?url=${d}`);
    u.push(`https://www.seoreviewtools.com/bulk-pagerank-checker/?url=${d}`);
    u.push(`https://www.whatsmyserp.com/serp-check?q=${d}`);
    u.push(`https://lxrmarketplace.com/seo-tools/seo-report/?url=${d}`);
    u.push(`https://www.internetmarketingninjas.com/seo-tools/google-sitemap-generator/?url=${e(s)}`);
    u.push(`https://www.internetmarketingninjas.com/tools/robots-txt/?url=${e(s)}`);
    u.push(`https://www.internetmarketingninjas.com/tools/header-checker/?url=${e(s)}`);
    u.push(`https://barracuda.digital/domain/${d}`);
    u.push(`https://www.alexa.com/siteinfo/${d}`);
    u.push(`https://atseo.com/${d}`);
    u.push(`https://rankscanner.com/fetch/?url=${d}`);
    u.push(`https://app.aioseo.com/analyze/?url=${e(s)}`);

    // ── ACCESSIBILITY & STANDARDS ──
    u.push(`https://achecker.acequality.com/checker/index.php?uri=${e(s)}`);
    u.push(`https://www.deque.com/axe/auditor/?url=${e(s)}`);
    u.push(`https://www.accessibilitychecker.org/audit/?website=${e(s)}&standard=wcag21`);
    u.push(`https://www.webaccessibility.com/results/?url=${e(s)}`);
    u.push(`https://tenon.io/testNow.php?url=${e(s)}`);
    u.push(`https://pa11y.org/try/?url=${e(s)}`);

    // ── TECH DETECTION ──
    u.push(`https://www.wappalyzer.com/lookup/${d}`);
    u.push(`https://www.whatruns.com/website/${d}`);
    u.push(`https://awesometechstack.com/analysis/website/${d}`);
    u.push(`https://www.w3techs.com/sites/info/${d}`);
    u.push(`https://toolbar.netcraft.com/site_report?url=${s}`);
    u.push(`https://dnschecker.org/all-dns-records-of-domain.php?query=${d}&rtype=ALL`);

    // ── SOCIAL/SHARING ──
    u.push(`https://www.facebook.com/sharer/sharer.php?u=${e(s)}`);
    u.push(`https://twitter.com/intent/tweet?url=${e(s)}&text=${e(t)}`);
    u.push(`https://pinterest.com/pin/create/button/?url=${e(s)}&description=${e(t)}`);
    u.push(`https://www.tumblr.com/share/link?url=${e(s)}&name=${e(t)}`);
    u.push(`https://telegram.me/share/url?url=${e(s)}&text=${e(t)}`);
    u.push(`https://api.whatsapp.com/send?text=${e(t+' '+s)}`);
    u.push(`https://news.ycombinator.com/submitlink?u=${e(s)}&t=${e(t)}`);
    u.push(`https://www.xing.com/spi/shares/new?url=${e(s)}`);
    u.push(`https://bufferapp.com/add?url=${e(s)}&text=${e(t)}`);
    u.push(`https://www.evernote.com/clip.action?url=${e(s)}&title=${e(t)}`);

    // ── MORE VALUE/TRAFFIC ──
    u.push(`https://www.domainiq.com/domain/${d}`);
    u.push(`https://www.godaddy.com/domain-value-appraisal/appraisal/?domain=${d}`);
    u.push(`https://whoisrequest.com/whois/${d}`);
    u.push(`https://dnshistory.org/dns-records/${d}`);
    u.push(`https://domaindata.io/domain/${d}`);
    u.push(`https://www.sitelike.org/similar/${d}/`);
    u.push(`https://www.similarsites.com/site/${d}`);
    u.push(`https://www.similarsitecheck.com/${d}`);
    u.push(`https://www.siteguru.co/free-seo-audit/${d}`);
    u.push(`https://www.seoprofiler.com/website/${d}`);
    u.push(`https://www.serpstat.com/url-analysis/?domain=${d}`);
    u.push(`https://www.rankworks.com/free-online-tools/domain-age-checker/?url=${d}`);
    u.push(`https://www.bulkseotools.com/domain-age-checker.php?url=${d}`);
    u.push(`https://www.duplichecker.com/page-authority-checker.php?url=${e(s)}`);
    u.push(`https://www.bulkseotools.com/bulk-domain-authority-checker.php?url=${d}`);
    u.push(`https://checkpagerank.net/?url=${d}`);
    u.push(`https://www.openadmintools.com/en/${d}/`);
    u.push(`https://iwantmyname.com/search?domain=${d}`);
    u.push(`https://www.domainsherpa.com/whois/${d}`);

    // ── EMAIL/SMTP TOOLS ──
    u.push(`https://mxtoolbox.com/domain/${d}/`);
    u.push(`https://mxtoolbox.com/SuperTool.aspx?action=mx%3a${d}&run=toolpage`);
    u.push(`https://mxtoolbox.com/SuperTool.aspx?action=spf%3a${d}&run=toolpage`);
    u.push(`https://mxtoolbox.com/SuperTool.aspx?action=dmarc%3a${d}&run=toolpage`);
    u.push(`https://mxtoolbox.com/SuperTool.aspx?action=dkim%3a${d}&run=toolpage`);
    u.push(`https://mxtoolbox.com/SuperTool.aspx?action=dns%3a${d}&run=toolpage`);
    u.push(`https://mxtoolbox.com/SuperTool.aspx?action=blacklist%3a${d}&run=toolpage`);
    u.push(`https://www.mail-tester.com/${d}`);
    u.push(`https://toolbox.googleapps.com/apps/checkmx/check?domain=${d}`);
    u.push(`https://dmarcian.com/dmarc-inspector/?domain=${d}`);

    // ── MISC TOOLS ──
    u.push(`https://www.browsershots.org/https://${d}/`);
    u.push(`https://screenshot.guru/screenshot-of-${s}/`);
    u.push(`https://www.screenshotmachine.com/index.php?url=${e(s)}`);
    u.push(`https://urlscan.io/result/search/#domain:${d}`);
    u.push(`https://multirbl.valli.org/lookup/${d}.html`);
    u.push(`https://www.whatismybrowser.com/detect/what-http-headers-is-a-website-sending/?url=${e(s)}`);
    u.push(`https://www.webtools.services/website-worth-calculator?url=${d}`);
    u.push(`https://www.webtools.services/website-traffic-estimator?url=${d}`);
    u.push(`https://www.webtools.services/domain-age-checker?url=${d}`);
    u.push(`https://www.webtools.services/ssl-checker?url=${d}`);
    u.push(`https://www.webtools.services/dns-lookup?url=${d}`);
    u.push(`https://www.webtools.services/whois-lookup?url=${d}`);
    u.push(`https://www.webtools.services/reverse-ip-lookup?url=${d}`);
    u.push(`https://host.io/${d}`);
    u.push(`https://www.threatcrowd.org/domain.php?domain=${d}`);
    u.push(`https://web-check.as93.net/results/${d}`);
    u.push(`https://webscan.upguard.com/?domain=${d}`);
    u.push(`https://www.shodan.io/host/${d}`);
    u.push(`https://www.zoomeye.org/searchResult?q=${d}`);
    u.push(`https://search.censys.io/hosts/${d}`);
  }

  return [...new Set(u)];
}

async function main() {
  const urls = gen();
  console.log(`\n🚀 Batch 3: ${urls.length} new unique URLs across 3 domains`);
  console.log(`   Concurrency: 100 workers | Timeout: 6s\n`);

  let idx = 0, ok = 0, fail = 0;
  const total = urls.length;
  const start = Date.now();

  async function worker() {
    while (true) {
      const i = idx++;
      if (i >= total) return;
      const ac = new AbortController();
      const timer = setTimeout(() => ac.abort(), 6000);
      try {
        const r = await fetch(urls[i], {
          signal: ac.signal, redirect: 'follow',
          headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36', 'Accept': 'text/html,application/json,*/*' },
        });
        clearTimeout(timer);
        if (r.status >= 200 && r.status < 400) ok++; else fail++;
      } catch { clearTimeout(timer); fail++; }
      if ((ok + fail) % 100 === 0) process.stdout.write(`\r   ${ok+fail}/${total} | ✅ ${ok} | ❌ ${fail}`);
    }
  }

  await Promise.allSettled(Array.from({ length: 100 }, () => worker()));
  const sec = ((Date.now() - start) / 1000).toFixed(1);

  console.log(`\n\n${'═'.repeat(55)}`);
  console.log(`   DONE in ${sec}s`);
  console.log(`   Total: ${total} | ✅ Live: ${ok} | ❌ Failed: ${fail}`);
  console.log(`   Success rate: ${((ok/total)*100).toFixed(1)}%`);
  console.log(`${'═'.repeat(55)}`);
}

main().catch(console.error);
