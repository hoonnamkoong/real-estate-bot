const fetch = require('node-fetch');

async function testFetch() {
    const url = 'https://m.land.naver.com/cluster/ajax/articleList?itemId=21221113&mapKey=&lgeo=21221113&rletTpCd=APT&tradTpCd=A1&z=12&lat=37.514592&lon=127.105863&btm=37.4278067&lft=127.0200323&top=37.6012765&rgt=127.1916937&cortarNo=&showR0=&dprcMax=200000&spcMin=132&spcMax=900000000&tag=FOURROOM';

    // First, no cookies
    const headers = {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
        'Referer': 'https://m.land.naver.com/',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'ko-KR,ko;q=0.9',
    };

    console.log('Fetching:', url);
    const r = await fetch(url, { headers, redirect: 'manual' });
    console.log('Status:', r.status);

    if (r.status === 200) {
        const body = await r.json();
        console.log('Data body items:', body.body?.length);
        if (body.body?.length > 0) {
            console.log('First Item name:', body.body[0].atclNm, 'price:', body.body[0].prc);
        }
    } else {
        console.log('Redirect Location:', r.headers.get('location'));
    }
}

testFetch().catch(console.error);
