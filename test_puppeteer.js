const puppeteer = require('puppeteer');

(async () => {
    try {
        console.log('Launching browser...');
        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        console.log('Browser launched.');
        const page = await browser.newPage();
        console.log('Navigating...');
        await page.goto('https://example.com');
        console.log('Page loaded:', await page.title());
        await browser.close();
        console.log('Success.');
    } catch (error) {
        console.error('Puppeteer Error:', error);
    }
})();
