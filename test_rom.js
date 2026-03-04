const fetch = require('node-fetch');
const fs = require('fs');

async function main() {
    try {
        const url1 = 'https://m.land.naver.com/cluster/ajax/articleList?cortarNo=1171010300&rletTpCd=APT:ABYG:JGC&tradTpCd=A1&page=1&z=15&lat=37.5340804&lon=127.1179437&btm=37.5255403&lft=127.1007775&top=37.5426184&rgt=127.13511&dprcMax=200000&spcMin=120';
        const url2 = url1 + '&rom=4';

        const res1 = await fetch(url1, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        const json1 = await res1.json();

        const res2 = await fetch(url2, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        const json2 = await res2.json();

        console.log('Without rom=4:', json1.body ? json1.body.length : 0);
        console.log('With rom=4:', json2.body ? json2.body.length : 0);

        if (json2.body && json2.body.length > 0) {
            fs.writeFileSync('mobile_room.json', JSON.stringify(json2.body[0], null, 2));
        }
    } catch (e) {
        console.error(e);
    }
}
main();
