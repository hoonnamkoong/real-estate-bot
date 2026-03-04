const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();

    await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X)');
    await page.setViewport({ width: 375, height: 812, isMobile: true });

    page.on('request', req => {
        const url = req.url();
        if (url.includes('articleList') || url.includes('complex')) {
            console.log("REQUEST:", url);
        }
    });

    console.log("Navigating...");
    await page.goto('https://m.land.naver.com/map/37.5340804:127.1179437:16:/APT/A1?rom=4', { waitUntil: 'networkidle0' });

    await new Promise(r => setTimeout(r, 5000));
    await browser.close();
})();
