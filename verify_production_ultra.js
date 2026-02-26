const { chromium } = require('playwright');

(async () => {
    // We launch chromium which is a "real" browser engine.
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        viewport: { width: 1280, height: 1600 },
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
    });
    const page = await context.newPage();

    try {
        console.log('Navigating to Vercel production with cache buster...');
        // Cache buster ensures we see the latest deployment
        await page.goto('https://real-estate-bot-eta.vercel.app/?v=' + Date.now(), { waitUntil: 'networkidle', timeout: 90000 });

        console.log('Waiting for page initialization...');
        await page.waitForTimeout(10000);

        console.log('Setting filters (Songpa, Sale, 30B, 120m2, 4 rooms)...');
        const regionInput = page.locator('input[placeholder*="구 선택"]');
        await regionInput.click();
        await page.keyboard.type('송파구');
        await page.keyboard.press('Enter');

        const priceInput = page.locator('div:has-text("가격 상한") input, label:has-text("가격 상한") + div input').first();
        await priceInput.fill('30');

        const areaInput = page.locator('div:has-text("최소 면적") input, label:has-text("최소 면적") + div input').first();
        await areaInput.fill('120');

        const roomInput = page.locator('div:has-text("최소 방 개수") input, label:has-text("최소 방 개수") + div input').first();
        await roomInput.fill('4');

        console.log('Clicking "지금 탐색"...');
        const searchBtn = page.locator('button:has-text("지금 탐색")');
        await searchBtn.click({ force: true });

        console.log('Waiting 45 seconds for search to finish (and show real data or mock fallback)...');
        await page.waitForTimeout(45000);

        const finalScreenshot = 'c:/Users/Hoon_DT/gemini/real-estate-bot/production_ULTRA_FINAL.png';
        await page.screenshot({ path: finalScreenshot, fullPage: true });
        console.log(`✔ FINAL VERIFICATION SAVED: ${finalScreenshot}`);

        const rowsCount = await page.locator('table tbody tr').count();
        console.log(`RENDER_SUMMARY: Rows=${rowsCount}`);

        if (rowsCount > 0) {
            const firstRowText = await page.locator('table tbody tr').first().innerText();
            console.log(`FIRST_ITEM: ${firstRowText.replace(/\n/g, ' ')}`);
        } else {
            const body = await page.innerText('body');
            console.log('PAGE_SNEAK_PEEK: ' + body.substring(0, 500));
        }

    } catch (e) {
        console.error('Playwright Error:', e.message);
        await page.screenshot({ path: 'c:/Users/Hoon_DT/gemini/real-estate-bot/production_ULTRA_CRASH.png', fullPage: true });
    } finally {
        await browser.close();
    }
})();
