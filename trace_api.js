const puppeteer = require('puppeteer');
const fs = require('fs');

async function main() {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    page.on('response', async res => {
        const url = res.url();
        if (url.includes('api/articles') || url.includes('cluster/ajax') || url.includes('region')) {
            try {
                const text = await res.text();
                fs.appendFileSync('pc_api_discovered.txt', url + '\n' + text.substring(0, 300) + '\n\n');
                console.log('Intercepted:', url);
            } catch (e) { }
        }
    });

    console.log('Navigating...');
    await page.goto('https://new.land.naver.com/articles?ms=37.5340804,127.1179437,16&a=APT:PRE:ABYG:JGC&b=A1&e=RETAIL&g=200000&h=120&q=FOURROOM', { waitUntil: 'networkidle2' });

    // Additional wait to ensure dynamic content loads
    await new Promise(r => setTimeout(r, 5000));

    await browser.close();
    console.log('Done.');
}
main().catch(console.error);
