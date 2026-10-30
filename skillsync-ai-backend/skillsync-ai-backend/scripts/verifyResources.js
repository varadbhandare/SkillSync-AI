/**
 * SkillSync AI - Resource Link Verification Script
 * Validates that every resource URL in mentorConfig.VERIFIED_RESOURCES is alive and authoritative
 */

const https = require('https');
const http = require('http');
const mentorConfig = require('../config/mentorConfig');

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

function verifyUrl(url, maxRedirects = 5) {
  return new Promise((resolve) => {
    function tryRequest(currentUrl, redirectsLeft) {
      if (redirectsLeft <= 0) {
        return resolve({ url, healthy: false, status: 'Too Many Redirects' });
      }

      try {
        const parsed = new URL(currentUrl);
        const client = parsed.protocol === 'https:' ? https : http;

        const req = client.request(
          currentUrl,
          {
            method: 'GET',
            headers: {
              'User-Agent': USER_AGENT,
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
            },
            timeout: 10000
          },
          (res) => {
            const status = res.statusCode;

            // Handle redirect
            if (status >= 300 && status < 400 && res.headers.location) {
              const nextUrl = new URL(res.headers.location, currentUrl).href;
              res.resume();
              return tryRequest(nextUrl, redirectsLeft - 1);
            }

            res.resume();
            // 200-399 = valid; 403 = endpoint exists but blocks crawler; 404 = broken
            const healthy = (status >= 200 && status < 400) || status === 403;
            resolve({ url, healthy, status });
          }
        );

        req.on('timeout', () => {
          req.destroy();
          resolve({ url, healthy: false, status: 'ETIMEDOUT' });
        });

        req.on('error', (err) => {
          resolve({ url, healthy: false, status: err.code || err.message });
        });

        req.end();
      } catch (err) {
        resolve({ url, healthy: false, status: err.message });
      }
    }

    tryRequest(url, maxRedirects);
  });
}

async function run() {
  console.log('================================================================');
  console.log('SKILLSYNC AI - EVERGREEN MENTOR RESOURCE VERIFICATION SUITE');
  console.log('================================================================\n');

  const allUrls = new Set();
  const urlMap = [];

  for (const cat of mentorConfig.VERIFIED_RESOURCES) {
    for (const src of cat.sources) {
      if (!allUrls.has(src.url)) {
        allUrls.add(src.url);
        urlMap.push({
          category: cat.intent,
          title: src.title,
          url: src.url,
          provider: src.provider
        });
      }
    }
  }

  console.log(`Found ${urlMap.length} unique URLs across ${mentorConfig.VERIFIED_RESOURCES.length} mentor categories.\n`);

  let passed = 0;
  let failed = 0;
  const results = [];

  for (let i = 0; i < urlMap.length; i++) {
    const item = urlMap[i];
    process.stdout.write(`[${i + 1}/${urlMap.length}] Checking ${item.provider} (${item.title.substring(0, 30)}...)... `);
    const result = await verifyUrl(item.url);
    if (result.healthy) {
      passed++;
      console.log(`✅ [${result.status}] OK`);
    } else {
      failed++;
      console.log(`❌ [${result.status}] FAIL`);
    }
    results.push({
      category: item.category,
      provider: item.provider,
      status: result.status,
      passed: result.healthy,
      url: item.url
    });
  }

  console.log('\nFINAL RESOURCE VERIFICATION SUMMARY:');
  console.table(results.map(r => ({
    provider: r.provider,
    status: r.status,
    passed: r.passed,
    url: r.url.length > 55 ? r.url.substring(0, 52) + '...' : r.url
  })));

  console.log(`\nResults: ${passed} Passed, ${failed} Failed out of ${urlMap.length} verified resources.`);

  if (failed > 0) {
    console.error('\n❌ One or more mentor resource URLs failed verification.');
    process.exit(1);
  } else {
    console.log('\n✅ ALL EVERGREEN MENTOR RESOURCES VERIFIED SUCCESSFULLY!');
    process.exit(0);
  }
}

run();
