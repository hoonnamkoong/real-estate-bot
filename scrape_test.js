const puppeteer = require('puppeteer');

async function scrape() {
    console.log('Starting Scraper...');
    let browser;
    try {
        browser = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-blink-features=AutomationControlled'
            ],
            ignoreDefaultArgs: ['--enable-automation']
        });
        const page = await browser.newPage();

        // Set a realistic User-Agent and Viewport via Emulation
        const iPhone = puppeteer.KnownDevices['iPhone 12'];
        await page.emulate(iPhone);

        console.log('Navigating...');
        console.log('Navigating...');
        const NAVER_LAND_MOBILE_HOST = 'https://m.land.naver.com';
        // Navigate to Gangnam Map directly to force Mobile Context
        await page.goto(`${NAVER_LAND_MOBILE_HOST}/map/37.517332:127.047377:14/APT:ABYG:JGC/A1:B1?z=14`, { waitUntil: 'networkidle2', timeout: 30000 });

        const cortarNo = '1168000000';
        const apiUrl = new URL(`${NAVER_LAND_MOBILE_HOST}/article/getArticleList`);
        apiUrl.searchParams.append('cortarNo', cortarNo);
        apiUrl.searchParams.append('rletTpCd', 'A01');
        apiUrl.searchParams.append('tradTpCd', 'A1');
        apiUrl.searchParams.append('order', 'date_desc');
        apiUrl.searchParams.append('showR0', 'N');
        apiUrl.searchParams.append('page', '1');
        // apiUrl.searchParams.append('spcMin', '84');
        // apiUrl.searchParams.append('prcMax', '500000');

        console.log('Fetching API:', apiUrl.toString());

        const result = await page.evaluate(async (url) => {
            const diag = {
                url: window.location.href,
                hasFetch: typeof fetch !== 'undefined',
                userAgent: navigator.userAgent
            };

            try {
                const response = await fetch(url, {
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest',
                        'Accept': 'application/json, text/plain, */*'
                    }
                });
                if (!response.ok) return { error: response.statusText, status: response.status, diag };
                const json = await response.json();
                return { ...json, diag };
            } catch (err) {
                return { error: err.toString(), diag };
            }
        }, apiUrl.toString());

        if (result.error) {
            console.error('Fetch Error:', result);
        } else {
            const list = result.body || result.result?.list || [];
            console.log('Success! Found items:', list.length);
            if (list.length > 0) console.log('First item:', list[0]);
        }

    } catch (error) {
        console.error('Critical Error:', error);
    } finally {
        if (browser) await browser.close();
    }
}

scrape();
