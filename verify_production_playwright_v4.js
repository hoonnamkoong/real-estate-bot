const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        viewport: { width: 1280, height: 1600 }
    });
    const page = await context.newPage();

    try {
        console.log('Navigating to Vercel production...');
        await page.goto('https://real-estate-bot-eta.vercel.app/', { waitUntil: 'networkidle' });

        // Wait for page to be ready (button should be enabled if snapshot leads)
        await page.waitForTimeout(5000);

        console.log('Setting filters...');
        const regionInput = page.locator('input[placeholder*="구 선택"]');
        await regionInput.click();
        await page.keyboard.type('송파구');
        await page.keyboard.press('Enter');

        const priceInput = page.locator('div:has-text("가격 상한") input, label:has-text("가격 상한") + div input').first();
        await priceInput.fill('20');

        const areaInput = page.locator('div:has-text("최소 면적") input, label:has-text("최소 면적") + div input').first();
        await areaInput.fill('120');

        const roomInput = page.locator('div:has-text("최소 방 개수") input, label:has-text("최소 방 개수") + div input').first();
        await roomInput.fill('4');

        // Click search (Ensuring it's enabled)
        const searchBtn = page.locator('button:has-text("지금 탐색")');
        await searchBtn.waitFor({ state: 'visible' });

        // If disabled, wait up to 10s for it to enable (Snapshot loading might be happening)
        for (let i = 0; i < 10; i++) {
            if (await searchBtn.isEnabled()) break;
            await page.waitForTimeout(1000);
        }

        console.log('Clicking "지금 탐색"...');
        await searchBtn.click();

        console.log('Waiting 30 seconds for all chunks to be processed...');
        await page.waitForTimeout(30000);

        const finalScreenshot = 'c:/Users/Hoon_DT/gemini/real-estate-bot/production_final_result_v4.png';
        await page.screenshot({ path: finalScreenshot, fullPage: true });
        console.log(`✔ Final screenshot saved: ${finalScreenshot}`);

        const rowsCount = await page.locator('table tbody tr').count();
        console.log(`RENDER_SUMMARY: Rows=${rowsCount}`);

        if (rowsCount > 0) {
            const firstRowText = await page.locator('table tbody tr').first().innerText();
            console.log(`FIRST_ITEM: ${firstRowText.replace(/\n/g, ' ')}`);
        } else {
            const resultsText = await page.locator('body').innerText();
            console.log('DEBUG_TEXT: ' + resultsText.substring(0, 500));
        }

    } catch (e) {
        console.error('Playwright Error:', e.message);
        await page.screenshot({ path: 'c:/Users/Hoon_DT/gemini/real-estate-bot/production_crash_v4.png' });
    } finally {
        await browser.close();
    }
})();
