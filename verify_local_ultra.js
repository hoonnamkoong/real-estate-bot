const { chromium } = require('playwright');
const { exec } = require('child_process');

(async () => {
    console.log('Starting local dev server...');
    const serverProcess = exec('npm run dev', { cwd: 'c:/Users/Hoon_DT/gemini/real-estate-bot' });

    // Wait for server to be ready
    await new Promise(res => setTimeout(res, 10000));

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        viewport: { width: 1280, height: 1600 }
    });
    const page = await context.newPage();

    try {
        console.log('Navigating to local server...');
        await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 90000 });

        console.log('Waiting for page initialization...');
        await page.waitForTimeout(5000);

        console.log('Setting filters (Songpa, Sale, 20B, 120m2, 4 rooms)...');
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

        console.log('Clicking "지금 탐색"...');
        const searchBtn = page.locator('button:has-text("지금 탐색")');
        await searchBtn.click({ force: true });

        console.log('Waiting 30 seconds for deep parallel search to finish...');
        await page.waitForTimeout(30000);

        const finalScreenshot = 'C:/Users/Hoon_DT/.gemini/antigravity/brain/b991865a-1fc4-4165-b1b7-bf77894c9eec/local_ULTRA_FINAL.png';
        await page.screenshot({ path: finalScreenshot, fullPage: true });
        console.log(`✔ FINAL VERIFICATION SAVED to Artifacts: ${finalScreenshot}`);

        const rowsCount = await page.locator('table tbody tr').count();
        console.log(`RENDER_SUMMARY: Rows=${rowsCount}`);

        if (rowsCount > 0) {
            const rows = await page.locator('table tbody tr').all();
            for (let i = 0; i < Math.min(rows.length, 5); i++) {
                const text = await rows[i].innerText();
                console.log(`ITEM_${i}: ${text.replace(/\n/g, ' ')}`);
            }
        }

    } catch (e) {
        console.error('Playwright Error:', e.message);
    } finally {
        await browser.close();
        serverProcess.kill();
    }
})();
