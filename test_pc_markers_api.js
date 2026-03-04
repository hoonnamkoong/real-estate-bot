const fetch = require('node-fetch');

async function test() {
    const cortarNo = '1171010300';

    // Use the exact URL captured from browser traffic analysis
    const url = `https://new.land.naver.com/api/complexes/single-markers/2.0?cortarNo=${cortarNo}&zoom=16&priceType=RETAIL&markerId&markerType&selectedComplexNo&selectedComplexBuildingNo&fakeComplexMarker&realEstateType=APT%3APRE%3AABYG%3AJGC&tradeType=A1&tag=%3AFOURROOM%3A%3A%3A%3A%3A%3A%3A&rentPriceMin=0&rentPriceMax=900000000&priceMin=0&priceMax=200000&areaMin=120&areaMax=900000000&oldBuildYears&recentlyBuildYears&minHouseHoldCount&maxHouseHoldCount&showArticle=true&sameAddressGroup=false&minMaintenanceCost&maxMaintenanceCost&directions=&leftLon=127.1042108&rightLon=127.1316766&topLat=37.5396103&bottomLat=37.5285501&isPresale=true`;

    console.log('Testing PC single-markers API...');
    console.log('URL:', url.substring(0, 100));

    // Try with PC headers
    const headersPC = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Referer': 'https://new.land.naver.com/',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'ko-KR,ko;q=0.9',
    };

    const r = await fetch(url, { headers: headersPC });
    console.log('Status:', r.status);

    if (r.ok) {
        const data = await r.json();
        console.log('Response type:', typeof data);
        if (Array.isArray(data)) {
            console.log('Array length:', data.length);
            if (data.length > 0) {
                console.log('First item keys:', Object.keys(data[0]));
                console.log('First item:', JSON.stringify(data[0]).substring(0, 400));
            }
        } else {
            console.log('Keys:', Object.keys(data));
        }
    } else {
        console.log('Error:', (await r.text()).substring(0, 200));
    }
}

test().catch(console.error);
