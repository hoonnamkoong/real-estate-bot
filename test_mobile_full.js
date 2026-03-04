const fetch = require('node-fetch');
const fs = require('fs');

async function main() {
    try {
        const url = 'https://m.land.naver.com/cluster/ajax/articleList?cortarNo=1171010300&rletTpCd=APT:ABYG:JGC&tradTpCd=A1&page=1&z=15&lat=37.5340804&lon=127.1179437&btm=37.5255403&lft=127.1007775&top=37.5426184&rgt=127.13511';
        const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        const json = await res.json();

        if (json.body && json.body.length > 0) {
            fs.writeFileSync('mobile_full_sample.json', JSON.stringify(json.body[0], null, 2));
            console.log('Saved to mobile_full_sample.json');
        }
    } catch (e) {
        console.error(e);
    }
}
main();
