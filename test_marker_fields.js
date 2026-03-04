// Quick test: what does the Playwright test_playwright_naver_api.js currently print for the first marker?
// Let's run it and capture all field names/values so we can map them properly

const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        locale: 'ko-KR',
    });

    const page = await context.newPage();
    const capturedData = [];

    page.on('response', async response => {
        const url = response.url();
        if (url.includes('single-markers') && response.status() === 200) {
            try {
                const data = await response.json();
                if (Array.isArray(data)) {
                    console.log(`\n=== Markers from: ${url.substring(50, 120)} ===`);
                    console.log(`Count: ${data.length}`);
                    if (data.length > 0) {
                        console.log('ALL FIELDS of first item:', JSON.stringify(data[0], null, 2));
                        capturedData.push(...data);
                    }
                }
            } catch (e) { }
        }
    });

    const navUrl = 'https://new.land.naver.com/complexes?ms=37.515,127.115,16&a=APT:PRE:ABYG:JGC&b=A1&e=RETAIL&g=200000&h=120&q=FOURROOM';
    console.log('URL:', navUrl);
    await page.goto(navUrl, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    console.log('\nTotal markers captured:', capturedData.length);

    await browser.close();
})();
