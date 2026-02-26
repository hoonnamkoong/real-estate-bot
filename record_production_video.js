const { chromium } = require('playwright');
const path = require('path');

(async () => {
    const videoDir = 'c:/Users/Hoon_DT/gemini/real-estate-bot/recordings';
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        viewport: { width: 1280, height: 1600 },
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        recordVideo: {
            dir: videoDir,
            size: { width: 1280, height: 1600 }
        }
    });

    const page = await context.newPage();

    try {
        console.log('Navigating to Vercel production...');
        await page.goto('https://real-estate-bot-eta.vercel.app/?v=' + Date.now(), { waitUntil: 'networkidle', timeout: 90000 });

        await page.waitForTimeout(5000);

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

        console.log('Capturing video of search process (30s)...');
        await page.waitForTimeout(30000);

        const videoPath = await page.video().path();
        console.log(`✔ VIDEO_SAVED: ${videoPath}`);

    } catch (e) {
        console.error('Playwright Error:', e.message);
    } finally {
        await context.close();
        await browser.close();
    }
})();
