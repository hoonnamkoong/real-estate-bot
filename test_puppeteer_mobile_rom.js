const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
    console.log("Launching headless browser...");
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();

    // Intercept network requests
    const urls = [];
    page.on('request', request => {
        const url = request.url();
        if (url.includes('articleList') || url.includes('complex')) {
            urls.push(url);
        }
    });

    console.log("Navigating to Mobile Map...");
    await page.goto('https://m.land.naver.com/map/37.5340804:127.1179437:16:/APT/A1', { waitUntil: 'networkidle2' });

    // Wait a bit
    await new Promise(r => setTimeout(r, 2000));

    urls.length = 0; // clear initial loads

    console.log("Applying room filter (rom=4)... via URL hash/params");
    // Usually mobile map UI uses hash or directly we can just click
    // Let's click the filter button
    await page.evaluate(() => {
        const btn = document.querySelector('.btn_filter');
        if (btn) btn.click();
    });

    await new Promise(r => setTimeout(r, 1000));

    await page.evaluate(() => {
        // Find 4개 이상
        const labels = Array.from(document.querySelectorAll('label, button, a, span'));
        const fourRoom = labels.find(e => e.textContent.includes('4개 이상'));
        if (fourRoom) fourRoom.click();

        // Find Apply button
        const applyBtn = document.querySelector('.btn_apply, .btn_option--search');
        if (applyBtn) applyBtn.click();
    });

    await new Promise(r => setTimeout(r, 5000));

    console.log("Captured URLs after click:", urls);

    await browser.close();
})();
