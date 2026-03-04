const fetch = require('node-fetch');

async function testBoundingBox() {
    // A point in Jamsil, Songpa-gu
    const lat = 37.514;
    const lon = 127.047;
    const btm = lat - 0.01;
    const top = lat + 0.01;
    const lft = lon - 0.01;
    const rgt = lon + 0.01;

    const params = new URLSearchParams({
        reitId: '',
        rletTpCd: 'APT',
        tradTpCd: 'A1',
        z: '14',
        lat: String(lat),
        lon: String(lon),
        btm: String(btm),
        lft: String(lft),
        top: String(top),
        rgt: String(rgt),
        pgr: '1',
        cortNo: '1171000000', // Songpa-gu
        dprcMax: '200000',    // Max 20억
        spcMin: '120',        // Min 120m2
        spcMax: '900000000',
        tag: 'FOURROOM'       // 4 rooms
    });

    const url = `https://m.land.naver.com/cluster/ajax/articleList?${params.toString()}`;
    console.log("Fetching URL:", url);

    const res = await fetch(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
            'Referer': 'https://m.land.naver.com/'
        }
    });

    const json = await res.json();
    console.log("Response JSON body length:", Array.isArray(json.body) ? json.body.length : "Not an array");

    if (Array.isArray(json.body) && json.body.length > 0) {
        console.log("First item:", json.body[0].atclNm, json.body[0].prc, json.body[0].spc1);
    } else {
        console.log("Full response:", json);
    }
}

testBoundingBox();
