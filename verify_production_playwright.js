const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        viewport: { width: 1280, height: 720 }
    });
    const page = await context.newPage();

    try {
        console.log('Navigating to https://real-estate-bot-eta.vercel.app/ ...');
        await page.goto('https://real-estate-bot-eta.vercel.app/', { waitUntil: 'networkidle' });

        console.log('Setting filters...');
        // 지역 선택 (송파구) - MultiSelect handles multiple values, typically has input
        const regionInput = page.locator('input[placeholder*="구 선택"]');
        await regionInput.click();
        await page.keyboard.type('송파구');
        await page.keyboard.press('Enter');

        // 거래 유형 (매매) - 기본값이 매매일 수 있지만 명시적 확인
        // const tradeTypeSelect = page.locator('input[value="매매"]');

        // 가격 상한 (20)
        const priceMaxInput = page.locator('label:has-text("가격 상한") + div input');
        await priceMaxInput.fill('20');

        // 최소 면적 (120)
        const areaMinInput = page.locator('label:has-text("최소 면적") + div input');
        await areaMinInput.fill('120');

        // 최소 방 개수 (4)
        const roomCountInput = page.locator('label:has-text("최소 방 개수") + div input');
        await roomCountInput.fill('4');

        console.log('Clicking Search button...');
        await page.click('button:has-text("지금 탐색")');

        console.log('Waiting for results...');
        // Wait for the loading overlay to disappear or any change in the results section
        await page.waitForTimeout(10000); // Give it enough time for sequential fetches

        await page.screenshot({ path: 'c:/Users/Hoon_DT/gemini/real-estate-bot/production_result.png', fullPage: true });
        console.log('Screenshot saved to production_result.png');

        // Extract table rows count
        const rows = await page.locator('table tbody tr').count();
        console.log(`RENDER_RESULT: Found ${rows} rows in table.`);

    } catch (error) {
        console.error('Playwright Error:', error);
        await page.screenshot({ path: 'c:/Users/Hoon_DT/gemini/real-estate-bot/production_error.png', fullPage: true });
    } finally {
        await browser.close();
    }
})();
