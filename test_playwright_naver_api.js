const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        locale: 'ko-KR',
    });

    const page = await context.newPage();

    // Intercept the API response
    const capturedArticles = [];

    page.on('response', async response => {
        const url = response.url();
        if (url.includes('single-markers') && response.status() === 200) {
            try {
                const data = await response.json();
                if (Array.isArray(data)) {
                    console.log('Got markers:', data.length);
                    capturedArticles.push(...data);
                }
            } catch (e) { }
        }
    });

    // Navigate to the Naver Land with all filters applied
    const navUrl = 'https://new.land.naver.com/complexes?ms=37.5340804,127.1179437,16&a=APT:PRE:ABYG:JGC&b=A1&e=RETAIL&g=200000&h=120&q=FOURROOM';
    console.log('Navigating to:', navUrl);
    await page.goto(navUrl, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    console.log('Total captured markers:', capturedArticles.length);
    if (capturedArticles.length > 0) {
        console.log('First:', JSON.stringify(capturedArticles[0]).substring(0, 500));
    }

    await browser.close();
})();
