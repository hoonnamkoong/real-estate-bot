const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
    // We launch chromium without headless, or headless with a specific user agent
    const browser = await chromium.launch({ headless: true });

    // Emulate Mobile Safari
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
        viewport: { width: 375, height: 812 },
        deviceScaleFactor: 3,
        isMobile: true,
        hasTouch: true,
    });

    const page = await context.newPage();

    const caughtUrls = [];
    page.on('request', req => {
        const url = req.url();
        if (url.includes('articleList') || url.includes('complex')) {
            caughtUrls.push(url);
        }
    });

    try {
        console.log("Navigating to Mobile Map...");
        await page.goto('https://m.land.naver.com/map/37.5340804:127.1179437:16:/APT/A1', { waitUntil: 'networkidle' });

        // Wait 2 seconds
        await page.waitForTimeout(2000);

        console.log("Initial URLs:");
        console.log(caughtUrls);
        caughtUrls.length = 0;

        console.log("Clicking Filter Button...");
        await page.click('.btn_filter');
        await page.waitForTimeout(1000);

        console.log("Selecting 4 Rooms...");
        // Click label containing text "4개 이상"
        await page.locator('label, span, button').filter({ hasText: '4개 이상' }).first().click();
        await page.waitForTimeout(1000);

        console.log("Clicking Apply...");
        await page.locator('.btn_apply, .btn_option--search, ._filterSaveBtn').first().click();

        await page.waitForTimeout(3000);

        console.log("URLs after applying filter:");
        console.log(caughtUrls);

    } catch (e) {
        console.log(e);
        await page.screenshot({ path: 'pw_error.png' });
    }

    await browser.close();
})();
