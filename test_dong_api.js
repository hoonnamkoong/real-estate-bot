const fetch = require('node-fetch');

async function main() {
    const urls = [
        'https://new.land.naver.com/api/regions/list?cortarNo=1171010300&rletTpCd=APT&tradTpCd=A1&page=1',
        'https://new.land.naver.com/api/articles/region?cortarNo=1171010300&rletTpCd=APT&tradTpCd=A1&page=1',
        'https://new.land.naver.com/api/articles/region/1171010300?rletTpCd=APT&tradTpCd=A1&page=1',
        'https://new.land.naver.com/api/articles/list?cortarNo=1171010300&rletTpCd=APT&tradTpCd=A1&page=1',
    ];
    for (const url of urls) {
        try {
            const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
            console.log(`URL: ${url}`);
            console.log(`STATUS: ${res.status}`);
            if (res.ok) {
                const text = await res.text();
                console.log(`RESPONSE: ${text.substring(0, 50)}...\n`);
            } else {
                console.log('Failed\n');
            }
        } catch (e) {
            console.log(e.message);
        }
    }
}
main();
