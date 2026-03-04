const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
    const browser = await chromium.launch({ headless: true });
    // Use an iPhone user agent to get the mobile site
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
        viewport: { width: 390, height: 844 },
        hasTouch: true,
        isMobile: true,
    });

    const page = await context.newPage();
    const captured = [];

    page.on('response', async response => {
        const url = response.url();
        if ((url.includes('clusterList') || url.includes('articleList') || url.includes('api/complexes') || url.includes('/ajax/')) && response.status() === 200) {
            try {
                if (url.includes('clusterList') || url.includes('articleList')) {
                    captured.push(url);
                    console.log(`\nCaught: ${url}`);
                }
            } catch (e) { }
        }
    });

    const userUrl = 'https://m.land.naver.com/map/37.514592:127.105863:12/APT/A1?dprcMax=200000&spcMin=132&spcMax=900000000&tag=FOURROOM#filter=all';
    console.log('Navigating to:', userUrl);

    await page.goto(userUrl, { waitUntil: 'networkidle' });

    // Wait for the map to load and markers to appear
    await page.waitForTimeout(5000);

    console.log('Clicking the center of the viewport a few times to hit a cluster...');
    // Naver uses canvas for markers sometimes, so we click various points
    await page.mouse.click(195, 422);
    await page.waitForTimeout(1000);
    await page.mouse.click(150, 400);
    await page.waitForTimeout(1000);
    await page.mouse.click(250, 450);
    await page.waitForTimeout(3000);

    // Check if 'cluster_marker' class exists
    try {
        const markers = await page.$$('a[class*="marker"], button[class*="marker"], div[class*="cluster"]');
        if (markers.length > 0) {
            console.log(`Found ${markers.length} marker elements. Clicking the first one...`);
            await markers[0].click({ force: true });
            await page.waitForTimeout(3000);
        }
    } catch (e) { }

    fs.writeFileSync('mobile_urls.json', JSON.stringify(captured, null, 2));
    console.log('Saved to mobile_urls.json');

    await browser.close();
})();
