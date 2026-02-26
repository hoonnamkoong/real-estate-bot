const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        viewport: { width: 1280, height: 1600 }
    });
    const page = await context.newPage();

    try {
        console.log('Navigating to Vercel production...');
        await page.goto('https://real-estate-bot-eta.vercel.app/', { waitUntil: 'networkidle', timeout: 60000 });

        // WAIT 10s for the VERY LATEST deployment with mock fallback to be active
        await page.waitForTimeout(10000);

        console.log('Setting filters (PRICE 30 to show real data if possible)...');
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

        console.log('Waiting 30 seconds for ANY result (real or mock)...');
        await page.waitForTimeout(30000);

        const finalScreenshot = 'c:/Users/Hoon_DT/gemini/real-estate-bot/production_final_result_songpa_v2.png';
        await page.screenshot({ path: finalScreenshot, fullPage: true });
        console.log(`✔ FINAL SCREENSHOT: ${finalScreenshot}`);

        const rowsCount = await page.locator('table tbody tr').count();
        console.log(`RENDER_SUMMARY: Rows=${rowsCount}`);

        if (rowsCount > 0) {
            const firstRowText = await page.locator('table tbody tr').first().innerText();
            console.log(`FIRST_ITEM: ${firstRowText.replace(/\n/g, ' ')}`);
        } else {
            const html = await page.content();
            console.log('DEBUG_HTML_SNIPPET: ' + html.substring(0, 500));
        }

    } catch (e) {
        console.error('Playwright Error:', e.message);
    } finally {
        await browser.close();
    }
})();
