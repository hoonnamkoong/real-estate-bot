const puppeteer = require('puppeteer');

// Parse arguments
const args = process.argv.slice(2);
const cortarNo = args[0] || '1168000000';
// Additional args can be added: tradeType, priceMax, etc.
// For now, we hardcode criteria for testing or pass them as JSON string?
// Better to pass strict args.
const priceMax = args[1]; // e.g. 500000 (Man-won)
const areaMin = args[2]; // e.g. 84
const roomCount = args[3];

console.error(`DEBUG_SCRAPER_ARGS: ${JSON.stringify(args)}`);
console.error(`DEBUG_SCRAPER_CORTAR: ${cortarNo}`);

(async () => {
    let browser;
    try {
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled'],
            ignoreDefaultArgs: ['--enable-automation']
        });
        const page = await browser.newPage();

        // Emulate iPhone 12 Pro
        await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1');
        await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });

        const NAVER_LAND_MOBILE_HOST = 'https://m.land.naver.com';

        // Setup Response Interception
        let apiResponse = null;
        page.on('response', async response => {
            const url = response.url();
            // Broader filter for API
            if (url.includes('articleList')) {
                console.error(`Captured API Response: ${url}`);
                try {
                    apiResponse = await response.json();
                } catch (e) {
                    // ignore
                }
            }
        });

        // Debug Requests
        page.on('request', req => console.error(`DEBUG_REQ: ${req.url()}`));
        page.on('console', msg => console.error(`PAGE LOG: ${msg.text()}`));

        // Construct List Page URL
        // Check CortarNo to determine Map Center
        let lat = '37.517332';
        let lon = '127.047377'; // Default Gangnam
        if (cortarNo === '1171000000') {
            lat = '37.514544';
            lon = '127.105918'; // Songpa
        } else if (cortarNo === '1165000000') { // Seocho
            lat = '37.483574';
            lon = '127.032603';
        }

        // Construct Map URL with Search Filters
        // Note: Filters might need adjustment if not applied correctly
        const mapBase = `${NAVER_LAND_MOBILE_HOST}/map/${lat}:${lon}:14/APT:ABYG:JGC/A1?z=14`;
        const mapUrl = new URL(mapBase);
        if (areaMin) mapUrl.searchParams.append('spcMin', areaMin);
        if (priceMax) mapUrl.searchParams.append('prc', `0:${priceMax}`);
        if (roomCount) mapUrl.searchParams.append('rom', roomCount);

        console.error('Navigating to Map URL: ' + mapUrl.toString());
        await page.goto(mapUrl.toString(), { waitUntil: 'networkidle2', timeout: 30000 });

        // Wait for Map Load
        await new Promise(r => setTimeout(r, 2000));

        // Click List Button to trigger API call
        console.error('Looking for List Button...');
        const listBtnHandle = await page.evaluateHandle(() => {
            return document.querySelector('.btn_list')
                || Array.from(document.querySelectorAll('button, a, div[role="button"]')).find(b => b.innerText.includes('목록'))
                || document.querySelector('._showAllAtclBtn');
        });
        const listBtn = listBtnHandle.asElement();
        if (listBtn) {
            console.error('Clicking List Button...');
            await listBtn.click();
        } else {
            console.error('List button not found. API might not trigger.');
        }

        // Wait for response or timeout
        let retries = 0;
        while (!apiResponse && retries < 40) {
            await new Promise(r => setTimeout(r, 1000));
            retries++;
        }

        let list = [];
        if (apiResponse) {
            list = apiResponse.body || [];
            if (!Array.isArray(list) && apiResponse.result && apiResponse.result.list) {
                list = apiResponse.result.list;
            }
            console.error(`Captured ${list ? list.length : 0} items via API`);
        } else {
            console.error('API response not captured. Falling back to DOM Scraping...');

            // Wait for list items to appear
            try {
                await page.waitForSelector('.item_link', { timeout: 5000 });
            } catch (e) { console.error('DOM wait timeout'); }

            // Scrape DOM
            list = await page.evaluate(() => {
                const elements = document.querySelectorAll('.item_link, .item_area, .list_item, .item');
                return Array.from(elements).map((el, index) => {
                    if (index === 0) console.log('DEBUG_DOM_HTML:', el.outerHTML);
                    const name = el.querySelector('.item_title, .complex_name, strong')?.innerText?.trim() || '';
                    const price = el.querySelector('.price_line, .price')?.innerText?.trim() || '';
                    const specs = el.querySelector('.spec, .info_area')?.innerText?.trim() || '';
                    // Extract ID using _articleno custom attribute
                    let id = el.getAttribute('_articleno') || el.querySelector('[_articleno]')?.getAttribute('_articleno') || '0';
                    const link = el.getAttribute('href') || el.querySelector('a')?.getAttribute('href') || '';

                    if (id === '0' && link && link.match(/article\/(\d+)/)) {
                        id = link.match(/article\/(\d+)/)[1];
                    } else if (id === '0' && el.dataset.atclNo) {
                        id = el.dataset.atclNo;
                    }

                    // Simple parsing for fallback
                    return {
                        atclNo: id,
                        atclNm: name,
                        prc: price,
                        spc1: 0,
                        spc2: specs,
                        rletTpNm: 'APT',
                        tradTpNm: 'Buy'
                    };
                });
            });
            console.error(`Scraped ${list.length} items via DOM`);
            await page.screenshot({ path: 'debug_dom_success.png' });
        }

        if (list.length === 0) {
            await page.screenshot({ path: 'debug_fallback_fail.png' });
            console.log("[]");
            await browser.close();
            return;
        }

        // Map Data (Shared logic)
        if (list.length > 0) {
            console.error('DEBUG_FIRST_ITEM:', JSON.stringify(list[0]));
        }
        const data = list.map(item => {
            let rawPriceVal = 0;
            let price = item.prc || item.price || '';
            if (typeof price === 'number') {
                rawPriceVal = price; // If it's already a number
                price = price.toString();
            } else if (price) {
                const parts = price.match(/(\d+)억\s*(\d*)/);
                if (parts) {
                    const eok = parseInt(parts[1]) || 0;
                    const man = parseInt(parts[2].replace(/,/g, '')) || 0;
                    rawPriceVal = eok * 10000 + man;
                }
            }

            // Area parsing (spc2) if spc1 is missing
            let areaM2 = item.spc1 || 0;
            if (!areaM2 && item.spc2) {
                const m2Match = item.spc2.match(/(\d+(?:\.\d+)?)\s*(?:m²|㎡)/);
                if (m2Match) areaM2 = parseFloat(m2Match[1]);
            }

            return {
                atclNo: item.atclNo || '0',
                atclNm: item.atclNm,
                prc: item.prc,
                _rawPrice: rawPriceVal,
                rletTpNm: item.rletTpNm,
                tradTpNm: item.tradTpNm,
                spc1: areaM2,
                spc2: item.spc2,
                cafes: 0
            };
        });

        // Filter Data Client-Side to ensure strict compliance
        const filteredData = data.filter(item => {
            // 1. Trade Type Check (Only if we want strictly Sale, though URL handles it)
            if (item.tradTpNm !== '매매') return false;

            // 2. Price Check
            if (priceMax && item._rawPrice > parseInt(priceMax)) return false;

            // 3. Area Check
            if (areaMin && item.spc1 < parseInt(areaMin)) return false;

            return true;
        });

        console.log(JSON.stringify(filteredData));
    } catch (error) {
        console.error('Scraper Error:', error);
        console.log("[]");
    } finally {
        if (browser) await browser.close();
    }
})();
