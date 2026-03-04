const puppeteer = require('puppeteer');

(async () => {
    console.log("Launching headless browser...");
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    // Create an incognito context and set user agent to mobile
    const context = await browser.createIncognitoBrowserContext();
    const page = await context.newPage();
    await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1');
    await page.setViewport({ width: 375, height: 812, isMobile: true });

    const capturedUrls = [];
    page.on('request', req => {
        const url = req.url();
        if (url.includes('articleList') || url.includes('complexList')) {
            capturedUrls.push(url);
        }
    });

    console.log("Navigating to Mobile Map...");
    await page.goto('https://m.land.naver.com/map/37.5340804:127.1179437:16:/APT/A1', { waitUntil: 'networkidle0' });

    capturedUrls.length = 0; // Clear initial requests

    console.log("Clicking Filter Button...");
    await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button, a'));
        const filterBtn = btns.find(b => b.textContent && b.textContent.includes('상세필터'));
        if (filterBtn) filterBtn.click();
    });

    await new Promise(r => setTimeout(r, 2000));

    console.log("Clicking Room Count Filter...");
    await page.evaluate(() => {
        const els = Array.from(document.querySelectorAll('label, span, button'));
        const room4 = els.find(e => e.textContent && e.textContent.includes('4개 이상'));
        if (room4) room4.click();
    });

    await new Promise(r => setTimeout(r, 1000));

    console.log("Clicking Apply...");
    await page.evaluate(() => {
        const els = Array.from(document.querySelectorAll('a, button'));
        const applyBtn = els.find(e => e.textContent && e.textContent.includes('검색'));
        if (applyBtn) applyBtn.click();
    });

    await new Promise(r => setTimeout(r, 4000));

    console.log("\nCaptured URLs after applying filter:");
    capturedUrls.forEach(url => console.log(url));

    await browser.close();
})();
