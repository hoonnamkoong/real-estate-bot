const fetch = require('node-fetch');
const fs = require('fs');

async function main() {
    try {
        const res = await fetch('https://new.land.naver.com/api/articles?cortarNo=1171010300&rletTpCd=APT:ABYG:JGC&tradTpCd=A1&page=1&priceMax=200000&areaMin=120&tag=FOURROOM', {
            headers: {
                'User-Agent': 'Mozilla/5.0'
            }
        });
        const json = await res.json();
        if (json.articleList && json.articleList.length > 0) {
            fs.writeFileSync('pc_api_sample.json', JSON.stringify(json.articleList[0], null, 2));
            console.log('Saved to pc_api_sample.json');
        } else {
            console.log('No articles found in response');
        }
    } catch (e) {
        console.error(e);
    }
}
main();
