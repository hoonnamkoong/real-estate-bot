const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        viewport: { width: 1280, height: 1600 },
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });
    const page = await context.newPage();

    try {
        console.log('Navigating to Vercel production...');
        await page.goto('https://real-estate-bot-eta.vercel.app/', { waitUntil: 'networkidle', timeout: 60000 });

        console.log('Waiting for "Loading Search..." to disappear...');
        await page.waitForSelector('text="Loading Search..."', { state: 'detached', timeout: 30000 });

        console.log('Setting filters...');
        const regionInput = page.locator('input[placeholder*="구 선택"]');
        await regionInput.click();
        await page.keyboard.type('송파구');
        await page.keyboard.press('Enter');
        await page.waitForTimeout(500);

        const priceInput = page.locator('div:has-text("가격 상한") input, label:has-text("가격 상한") + div input').first();
        await priceInput.fill('20');
        await page.waitForTimeout(500);

        const areaInput = page.locator('div:has-text("최소 면적") input, label:has-text("최소 면적") + div input').first();
        await areaInput.fill('120');
        await page.waitForTimeout(500);

        const roomInput = page.locator('div:has-text("최소 방 개수") input, label:has-text("최소 방 개수") + div input').first();
        await roomInput.fill('4');
        await page.waitForTimeout(500);

        // Capture state before click
        await page.screenshot({ path: 'c:/Users/Hoon_DT/gemini/real-estate-bot/production_pre_search_v5.png' });

        const searchBtn = page.locator('button:has-text("지금 탐색")');
        console.log('Waiting for search button to be enabled...');
        await searchBtn.waitFor({ state: 'visible', timeout: 20000 });

        // Final attempt to wait for button
        for (let i = 0; i < 30; i++) {
            const isDisabled = await searchBtn.getAttribute('disabled');
            if (isDisabled === null) {
                console.log('✔ Search button is finally enabled.');
                break;
            }
            if (i % 5 === 0) console.log(`... waiting for button enablement (${i}s)`);
            await page.waitForTimeout(1000);
        }

        console.log('Clicking "지금 탐색"...');
        await searchBtn.click();

        console.log('Monitoring search progress...');
        // Wait for results section to change or any row to appear
        // We'll take multiple screenshots to show progress
        for (let i = 1; i <= 3; i++) {
            await page.waitForTimeout(15000);
            const progressScreenshot = `c:/Users/Hoon_DT/gemini/real-estate-bot/production_progress_${i}.png`;
            await page.screenshot({ path: progressScreenshot, fullPage: true });
            const rows = await page.locator('table tbody tr').count();
            const msg = await page.locator('.mantine-Text-root').locator('text=/탐색/').first().innerText().catch(() => 'No progress msg');
            console.log(`Phase ${i}: Rows=${rows}, Msg=${msg}`);
            if (rows > 0 && i > 1) break; // If we have results, we can stop early
        }

        const finalScreenshot = 'c:/Users/Hoon_DT/gemini/real-estate-bot/production_final_result_v5.png';
        await page.screenshot({ path: finalScreenshot, fullPage: true });
        console.log(`✔ Final verification saved: ${finalScreenshot}`);

        const rowsCount = await page.locator('table tbody tr').count();
        console.log(`FINAL_SUMMARY: Status=Success, Rows=${rowsCount}`);

    } catch (e) {
        console.error('Playwright Error:', e.message);
        await page.screenshot({ path: 'c:/Users/Hoon_DT/gemini/real-estate-bot/production_crash_v5.png', fullPage: true });
    } finally {
        await browser.close();
    }
})();
