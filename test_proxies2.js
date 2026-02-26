const fetch = require('node-fetch');

async function testProxies() {
    const lat = 37.514544;
    const lon = 127.105918;
    const subBoxSize = 0.04;
    const btm = lat - subBoxSize;
    const top = lat + subBoxSize;
    const lft = lon - subBoxSize;
    const rgt = lon + subBoxSize;

    const params = new URLSearchParams({
        cortarNo: '1171011100', // Bangi
        rletTpCd: 'APT:ABYG:JGC',
        tradTpCd: 'A1',
        z: '15',
        lat: String(lat),
        lon: String(lon),
        btm: btm.toFixed(7),
        lft: lft.toFixed(7),
        top: top.toFixed(7),
        rgt: rgt.toFixed(7),
        page: '1',
        prc: '0:200000'
    });

    const rawUrl = `https://m.land.naver.com/cluster/ajax/articleList?${params.toString()}`;

    const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://m.land.naver.com/'
    };

    const targets = [
        { name: 'Direct', url: rawUrl },
        { name: 'CodeTabs', url: `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(rawUrl)}` },
        { name: 'ThingProxy', url: `https://thingproxy.freeboard.io/fetch/${rawUrl}` },
        { name: 'AllOriginsGet', url: `https://api.allorigins.win/get?url=${encodeURIComponent(rawUrl)}` }
    ];

    for (const t of targets) {
        try {
            console.log(`\nTesting ${t.name}...`);
            const res = await fetch(t.url, { headers });

            if (t.name === 'AllOriginsGet') {
                const jsonWrapper = await res.json();
                const text = jsonWrapper.contents;
                const json = JSON.parse(text);
                const items = json.body || [];
                console.log(`SUCCESS: ${t.name} returned ${items.length} items.`);
                continue;
            }

            const text = await res.text();
            try {
                const json = JSON.parse(text);
                const items = json.body || [];
                console.log(`SUCCESS: ${t.name} returned ${items.length} items.`);
            } catch (e) {
                console.log(`FAILED JSON parse for ${t.name}. Starts with: ${text.substring(0, 100)}`);
            }
        } catch (e) {
            console.log(`ERROR fetching ${t.name}:`, e.message);
        }
    }
}

testProxies();
