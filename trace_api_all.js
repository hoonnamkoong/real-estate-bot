const puppeteer = require('puppeteer');
const fs = require('fs');

async function main() {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    const logs = [];
    page.on('response', async res => {
        const url = res.url();
        const type = res.headers()['content-type'] || '';
        if (type.includes('json') || url.includes('api/')) {
            try {
                const text = await res.text();
                logs.push({ url, text: text.substring(0, 300) });
            } catch (e) { }
        }
    });

    console.log('Navigating to PC Web Map...');
    // We navigate to the complex-level with FOURROOM query
    await page.goto('https://new.land.naver.com/complexes?ms=37.5340804,127.1179437,16&a=APT:PRE:ABYG:JGC&b=A1&e=RETAIL&g=200000&h=120&q=FOURROOM', { waitUntil: 'networkidle2' });

    // Switch to Articles view
    try {
        await page.evaluate(() => {
            const btn = Array.from(document.querySelectorAll('button, a')).find(b => b.innerText.includes('매물') && !b.innerText.includes('상세'));
            if (btn) btn.click();
        });
    } catch (e) { }

    await new Promise(r => setTimeout(r, 6000));

    fs.writeFileSync('all_api_logs.json', JSON.stringify(logs, null, 2));
    console.log('Done, saved to all_api_logs.json');
    await browser.close();
}
main().catch(console.error);
