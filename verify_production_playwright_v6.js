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

        // Wait for Loading to finish
        await page.waitForSelector('text="Loading Search..."', { state: 'detached', timeout: 30000 }).catch(() => console.log('Wait for loading timed out, proceeding anyway.'));

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

        // Capture current state
        await page.screenshot({ path: 'c:/Users/Hoon_DT/gemini/real-estate-bot/production_state_pre_force.png' });

        console.log('Attempting multiple submission methods...');
        const searchBtn = page.locator('button:has-text("지금 탐색")');

        // Method 1: Press Enter in one of the inputs
        await roomInput.focus();
        await page.keyboard.press('Enter');
        console.log('✔ Enter key submission attempted.');

        // Method 2: Force click the button even if Playwright thinks it's disabled
        await searchBtn.click({ force: true }).catch(e => console.log('Force click failed:', e.message));

        console.log('Waiting 45 seconds to ensure Vercel sequential fetch completes...');
        await page.waitForTimeout(45000);

        const finalScreenshot = 'c:/Users/Hoon_DT/gemini/real-estate-bot/production_final_result_v6.png';
        await page.screenshot({ path: finalScreenshot, fullPage: true });
        console.log(`✔ FINAL SCREENSHOT: ${finalScreenshot}`);

        // Extract Summary from DOM
        const rowsCount = await page.locator('table tbody tr').count();
        const resultsTitle = await page.locator('h4:has-text("검색 결과")').innerText().catch(() => 'Title Not Found');
        console.log(`RENDER_SUMMARY: Title="${resultsTitle}", Rows=${rowsCount}`);

        if (rowsCount > 0) {
            const rowContents = await page.locator('table tbody tr').first().innerText();
            console.log(`FIRST_ROW_DATA: ${rowContents.replace(/\n/g, ' ')}`);
        } else {
            const bodyText = await page.locator('body').innerText();
            console.log('DEBUG_HTML_SNIPPET: ' + bodyText.substring(0, 1000));
        }

    } catch (e) {
        console.error('CRITICAL PLAYWRIGHT ERROR:', e.message);
        await page.screenshot({ path: 'c:/Users/Hoon_DT/gemini/real-estate-bot/production_critical_crash.png', fullPage: true });
    } finally {
        await browser.close();
    }
})();
