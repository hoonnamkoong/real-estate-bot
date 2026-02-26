const fetch = require('node-fetch');

async function testMoreProxies() {
    const rawUrl = 'https://m.land.naver.com/cluster/ajax/articleList?cortarNo=1171011100&rletTpCd=APT%3AABYG%3AJGC&tradTpCd=A1&z=15&lat=37.514544&lon=127.105918&btm=37.4745440&lft=127.0659180&top=37.5545440&rgt=127.1459180&page=1&prc=0%3A200000';

    const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://m.land.naver.com/'
    };

    const targets = [
        { name: 'Proxy1', url: `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(rawUrl)}` },
        { name: 'Proxy2', url: `https://cors-proxy.htmldriven.com/?url=${encodeURIComponent(rawUrl)}` },
        { name: 'Proxy3', url: `https://api.allorigins.win/raw?url=${encodeURIComponent(rawUrl)}` },
        { name: 'Proxy4', url: rawUrl }
    ];

    for (const t of targets) {
        try {
            console.log(`\nTesting ${t.name}...`);
            const res = await fetch(t.url, { headers });
            const text = await res.text();

            try {
                const json = JSON.parse(text);
                const items = json.body || [];
                console.log(`SUCCESS: ${t.name} returned ${items.length} items.`);
            } catch (e) {
                console.log(`FAILED JSON parse for ${t.name}. Starts with: ${text.substring(0, 100)}...`);
            }
        } catch (e) {
            console.log(`ERROR fetching ${t.name}:`, e.message);
        }
    }
}

testMoreProxies();
