const fetch = require('node-fetch');

async function testMobile() {
    console.log('Testing Mobile API with rom=4');
    const url = 'https://m.land.naver.com/cluster/ajax/articleList?itemId=103848&lgeo=1171010300&rletTpCd=APT&tradTpCd=A1&z=16&lat=37.5340804&lon=127.1179437&totCnt=50&rom=4';
    const headers = {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
        'Referer': 'https://m.land.naver.com/'
    };
    const res = await fetch(url, { headers });
    const json = await res.json();
    console.log('Result length:', json.body ? json.body.length : 0);
    if (json.body && json.body.length > 0) {
        console.log('Sample 1 feature:', json.body[0].atclFetrDesc);
    }
}
testMobile();
