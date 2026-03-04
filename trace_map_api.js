const puppeteer = require('puppeteer');
const fs = require('fs');

async function main() {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    const reqUrls = [];
    page.on('response', async res => {
        const url = res.url();
        if (url.includes('api/articles') || url.includes('cluster/ajax')) {
            reqUrls.push(url);
        }
    });

    console.log('Navigating to PC Web Map...');
    await page.goto('https://new.land.naver.com/articles?ms=37.5340804,127.1179437,16&a=APT:PRE:ABYG:JGC&b=A1&e=RETAIL&g=200000&h=120&q=FOURROOM', { waitUntil: 'networkidle2' });

    // Sometimes it defaults to complexes, let's explicitly click the "매물" button
    console.log('Trying to click articles tab...');
    try {
        await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button, a'));
            const articleBtn = btns.find(b => b.innerText.includes('매물') && !b.innerText.includes('상세'));
            if (articleBtn) articleBtn.click();
        });
    } catch (e) { }

    await new Promise(r => setTimeout(r, 6000));

    fs.writeFileSync('pc_map_api_urls.json', JSON.stringify(reqUrls, null, 2));
    console.log('Done, saved to pc_map_api_urls.json');
    await browser.close();
}
main().catch(console.error);
