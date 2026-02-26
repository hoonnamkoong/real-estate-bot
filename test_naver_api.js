const fetch = require('node-fetch');

async function testSongpa() {
    console.log('Testing Songpa Direct API...');

    // Songpa Center: 37.514544, 127.105918
    const lat = 37.514544;
    const lon = 127.105918;
    const subBoxSize = 0.02;
    const btm = lat - subBoxSize;
    const top = lat + subBoxSize;
    const lft = lon - subBoxSize;
    const rgt = lon + subBoxSize;

    const params = new URLSearchParams({
        cortarNo: '1171000000',
        rletTpCd: 'APT:ABYG:JGC',
        tradTpCd: 'A1',
        z: '16',
        lat: String(lat),
        lon: String(lon),
        btm: btm.toFixed(7),
        lft: lft.toFixed(7),
        top: top.toFixed(7),
        rgt: rgt.toFixed(7),
        page: '1',
        prc: '0:200000', // 20억
        spcMin: '120',
        rom: '4'
    });

    const url = `https://m.land.naver.com/cluster/ajax/articleList?${params.toString()}`;
    console.log('URL:', url);

    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
                'Referer': 'https://m.land.naver.com/'
            }
        });
        const json = await response.json();
        const items = json.body || [];
        console.log(`FOUND_ITEMS_COUNT: ${items.length}`);
        if (items.length > 0) {
            console.log('SAMPLE_ITEM:', items[0].atclNm, items[0].prc, items[0].spc1);
        }
    } catch (e) {
        console.error('FETCH_ERROR:', e);
    }
}

testSongpa();
