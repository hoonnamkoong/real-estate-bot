const fetch = require('node-fetch');

async function main() {
    const url = 'https://new.land.naver.com/api/articles?rletTpCd=APT&tradTpCd=A1&z=15&lat=37.5340804&lon=127.1179437&btm=37.5255403&lft=127.1007775&top=37.5426184&rgt=127.13511&tag=FOURROOM';

    // Simulate Android App's exact headers
    const res = await fetch(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
            'Referer': 'https://m.land.naver.com/'
        }
    });

    console.log('Status:', res.status);
    if (res.ok) {
        const json = await res.json();
        if (json.articleList) {
            console.log('Success! articleList length:', json.articleList.length);
        } else {
            console.log('Keys:', Object.keys(json));
            console.log('No articleList');
        }
    } else {
        console.log(await res.text());
    }
}
main();
