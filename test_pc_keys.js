const fetch = require('node-fetch');

async function main() {
    try {
        const url = 'https://new.land.naver.com/api/articles/complex/103848?tag=FOURROOM';
        const res = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                'Referer': 'https://new.land.naver.com/'
            }
        });
        if (res.ok) {
            const json = await res.json();
            if (json.articleList && json.articleList.length > 0) {
                console.log(Object.keys(json.articleList[0]).join(', '));
                console.log('Sample data:', {
                    atclNo: json.articleList[0].atclNo,
                    atclNm: json.articleList[0].atclNm,
                    prc: json.articleList[0].prc,
                    spc1: json.articleList[0].spc1
                });
            } else {
                console.log('No articles found');
            }
        } else {
            console.log(res.status, await res.text());
        }
    } catch (e) {
        console.error(e);
    }
}
main();
