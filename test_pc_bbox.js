const fetch = require('node-fetch');

async function main() {
    try {
        const url = 'https://new.land.naver.com/api/articles?rletTpCd=APT&tradTpCd=A1&z=15&lat=37.5340804&lon=127.1179437&btm=37.5255403&lft=127.1007775&top=37.5426184&rgt=127.13511&tag=FOURROOM';
        const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        console.log(`STATUS: ${res.status}`);
        if (res.ok) {
            const json = await res.json();
            console.log(json.articleList ? `Success! Found ${json.articleList.length} items.` : 'No articleList in response');
            if (json.articleList && json.articleList.length > 0) {
                console.log(Object.keys(json.articleList[0]).join(', '));
            }
        } else {
            console.log(await res.text());
        }
    } catch (e) {
        console.error(e);
    }
}
main();
