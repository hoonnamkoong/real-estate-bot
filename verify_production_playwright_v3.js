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

        // 1. 지역 선택 (송파구)
        // MultiSelect has an input with placeholder
        const regionInput = page.locator('input[placeholder*="구 선택"]');
        await regionInput.click();
        await page.keyboard.type('송파구');
        await page.keyboard.press('Enter');
        console.log('✔ Region: Songpa-gu set');

        // 2. 가격 상한 (20)
        // In Mantine, NumberInput usually has an input field. 
        // We will find inputs by their value or position if labels fail.
        // Let's try finding the input containing '20' (default) or by placeholder
        const priceInput = page.locator('div:has-text("가격 상한") input, label:has-text("가격 상한") + div input').first();
        await priceInput.fill('20');
        console.log('✔ Price: 20 set');

        // 3. 최소 면적 (120)
        const areaInput = page.locator('div:has-text("최소 면적") input, label:has-text("최소 면적") + div input').first();
        await areaInput.fill('120');
        console.log('✔ Area: 120 set');

        // 4. 최소 방 개수 (4)
        const roomInput = page.locator('div:has-text("최소 방 개수") input, label:has-text("최소 방 개수") + div input').first();
        await roomInput.fill('4');
        console.log('✔ Room: 4 set');

        await page.screenshot({ path: 'c:/Users/Hoon_DT/gemini/real-estate-bot/search_pre_click.png' });

        console.log('Clicking "지금 탐색" button...');
        await page.click('button:has-text("지금 탐색")');

        console.log('Waiting 20s for server actions and sequential fetches...');
        // Vercel sequential fetch for Songpa takes time
        await page.waitForTimeout(20000);

        const finalScreenshot = 'c:/Users/Hoon_DT/gemini/real-estate-bot/production_final_result.png';
        await page.screenshot({ path: finalScreenshot, fullPage: true });
        console.log(`✔ Final screenshot saved: ${finalScreenshot}`);

        // Extract Summary
        const resultsTitle = await page.locator('h4:has-text("검색 결과")').innerText();
        const rowsCount = await page.locator('table tbody tr').count();
        console.log(`RENDER_SUMMARY: ${resultsTitle}, Rows=${rowsCount}`);

        if (rowsCount > 0) {
            const firstRowText = await page.locator('table tbody tr').first().innerText();
            console.log(`FIRST_ITEM: ${firstRowText.replace(/\n/g, ' ')}`);
        } else {
            const emptyMsg = await page.locator('text="조건에 맞는 매물이 없습니다"').count();
            if (emptyMsg > 0) console.log('RENDER_RESULT: Empty results (Matching filter)');
            else console.log('RENDER_RESULT: No table and no empty message found.');
        }

    } catch (e) {
        console.error('Playwright Error:', e.message);
        await page.screenshot({ path: 'c:/Users/Hoon_DT/gemini/real-estate-bot/production_crash.png' });
    } finally {
        await browser.close();
    }
})();
