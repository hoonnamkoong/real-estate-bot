const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        viewport: { width: 1280, height: 1200 }
    });
    const page = await context.newPage();

    try {
        console.log('Navigating to https://real-estate-bot-eta.vercel.app/ ...');
        await page.goto('https://real-estate-bot-eta.vercel.app/', { waitUntil: 'networkidle' });

        console.log('Setting filters with precise selectors...');

        // 1. 지역 선택 (송파구)
        // Mantine MultiSelect typically uses an input followed by dropdown
        const regionSelector = 'input[id^="mantine-"][placeholder*="구 선택"]';
        await page.waitForSelector(regionSelector);
        await page.fill(regionSelector, '송파구');
        await page.keyboard.press('Enter');
        console.log('Region set to Songpa-gu');

        // 2. 가격 상한 (20)
        // Looking for NumberInput. Based on HTML view, labels are siblings or previous elements.
        const priceMaxSelector = 'text="가격 상한" >> xpath=.. >> input';
        await page.waitForSelector(priceMaxSelector);
        await page.fill(priceMaxSelector, '20');
        console.log('Price set to 20');

        // 3. 최소 면적 (120)
        const areaMinSelector = 'text="최소 면적" >> xpath=.. >> input';
        await page.waitForSelector(areaMinSelector);
        await page.fill(areaMinSelector, '120');
        console.log('Area set to 120');

        // 4. 최소 방 개수 (4)
        const roomCountSelector = 'text="최소 방 개수" >> xpath=.. >> input';
        await page.waitForSelector(roomCountSelector);
        await page.fill(roomCountSelector, '4');
        console.log('Room count set to 4');

        // Screenshot before search to see the values
        await page.screenshot({ path: 'c:/Users/Hoon_DT/gemini/real-estate-bot/search_input_state.png' });

        console.log('Clicking Search button...');
        await page.click('button:has-text("지금 탐색")');

        console.log('Waiting for results (15s to allow for server actions)...');
        // Wait for the text "탐색 진행 중" to appear then disappear, or just wait long
        await page.waitForTimeout(15000);

        const screenshotPath = 'c:/Users/Hoon_DT/gemini/real-estate-bot/production_final_result.png';
        await page.screenshot({ path: screenshotPath, fullPage: true });
        console.log(`Screenshot saved to ${screenshotPath}`);

        // Extract table rows count to verify
        const rowsCount = await page.locator('table tbody tr').count();
        console.log(`RENDER_RESULT: Found ${rowsCount} rows in table.`);

        // Get text content of results section for debugging
        const resultsText = await page.locator('h4:has-text("검색 결과") + p, h4:has-text("검색 결과") + div').innerText();
        console.log('RESULTS_TEXT: ' + resultsText.substring(0, 100));

    } catch (error) {
        console.error('Playwright Error:', error);
        await page.screenshot({ path: 'c:/Users/Hoon_DT/gemini/real-estate-bot/production_final_error.png', fullPage: true });
    } finally {
        await browser.close();
    }
})();
