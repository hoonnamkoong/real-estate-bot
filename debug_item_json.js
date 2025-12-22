const fs = require('fs');

async function debugData() {
    // Songpa
    const lat = 37.514544;
    const lon = 127.105918;
    const params = new URLSearchParams({
        cortarNo: '1171000000',
        rletTpCd: 'APT:ABYG:JGC',
        tradTpCd: 'A1',
        z: '14',
        lat: String(lat),
        lon: String(lon),
        btm: String(lat - 0.02),
        top: String(lat + 0.02),
        lft: String(lon - 0.02),
        rgt: String(lon + 0.02),
    });

    const url = `https://m.land.naver.com/cluster/ajax/articleList?${params.toString()}`;
    console.log("Fetching...", url);

    try {
        const res = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
                'Referer': 'https://m.land.naver.com/'
            }
        });
        const json = await res.json();
        const list = json.body || [];

        if (list.length > 0) {
            console.log(`Found ${list.length} items.`);
            const firstItem = list[0];
            // Save to file for inspection
            fs.writeFileSync('item.json', JSON.stringify(firstItem, null, 2), 'utf8');
            console.log("Saved first item to item.json");

            // Check Price types
            console.log("Price Sample:", firstItem.prc, typeof firstItem.prc);
            console.log("Raw Price Sample:", firstItem._rawPrice, typeof firstItem._rawPrice);
        } else {
            console.log("No items.");
        }
    } catch (e) {
        console.error(e);
    }
}

debugData();
