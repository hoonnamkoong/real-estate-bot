const fetch = require('node-fetch');

async function testApi(name, url, isBbox) {
    console.log(`\nTesting ${name}:`);
    const headers = {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
        'Referer': 'https://m.land.naver.com/'
    };
    const res = await fetch(url, { headers });
    console.log(`Status: ${res.status}`);
    if (res.ok) {
        const json = await res.json();
        if (isBbox) {
            console.log('Keys:', Object.keys(json));
            console.log('articleList length:', json.articleList ? json.articleList.length : 'none');
        } else {
            console.log('Keys:', Object.keys(json));
            console.log('complexList length:', json.complexList ? json.complexList.length : 'none');
        }
    } else {
        console.log('Error Text:', (await res.text()).substring(0, 100));
    }
}

async function main() {
    await testApi(
        'PC Complex API with Mobile Headers',
        'https://new.land.naver.com/api/regions/complexes?cortarNo=1171010300&rletTpCd=APT:ABYG:JGC&tradTpCd=A1',
        false
    );

    await testApi(
        'PC BBox API with Mobile Headers',
        'https://new.land.naver.com/api/articles?rletTpCd=APT&tradTpCd=A1&z=15&lat=37.5340804&lon=127.1179437&btm=37.5255403&lft=127.1007775&top=37.5426184&rgt=127.13511&tag=FOURROOM',
        true
    );
}

main();
