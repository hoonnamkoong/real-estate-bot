const fetch = require('node-fetch');

async function test() {
    const cortarNo = '1171000000'; // Songpa-gu
    const leftLon = 127.080, bottomLat = 37.490, rightLon = 127.160, topLat = 37.545;

    const tag = ':FOURROOM:::::::';
    const url = `https://new.land.naver.com/api/complexes/single-markers/2.0?` +
        `cortarNo=${cortarNo}&zoom=16&priceType=RETAIL&markerId&markerType&` +
        `selectedComplexNo&selectedComplexBuildingNo&fakeComplexMarker&` +
        `realEstateType=APT%3APRE%3AABYG%3AJGC&tradeType=A1&` +
        `tag=${encodeURIComponent(tag)}&rentPriceMin=0&rentPriceMax=900000000&priceMin=0&` +
        `priceMax=200000&areaMin=120&areaMax=900000000&oldBuildYears&recentlyBuildYears&` +
        `minHouseHoldCount&maxHouseHoldCount&showArticle=false&sameAddressGroup=false&` +
        `minMaintenanceCost&maxMaintenanceCost&directions=&` +
        `leftLon=${leftLon}&rightLon=${rightLon}&topLat=${topLat}&bottomLat=${bottomLat}&isPresale=true`;

    const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Referer': 'https://new.land.naver.com/',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin',
    };

    console.log('Testing URL:', url.substring(0, 120));
    const r = await fetch(url, { headers });
    console.log('Status:', r.status);

    if (r.ok) {
        const data = await r.json();
        if (Array.isArray(data)) {
            console.log('Got', data.length, 'markers!');
            if (data.length > 0) {
                console.log('First marker keys:', Object.keys(data[0]));
                console.log('dealPrice:', data[0].dealPrice, 'area1:', data[0].area1, 'complexName:', data[0].complexName);
            }
        }
    } else {
        const text = await r.text();
        console.log('Error:', text.substring(0, 200));
    }
}

test().catch(console.error);
