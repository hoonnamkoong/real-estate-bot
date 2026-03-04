const fetch = require('node-fetch');

async function testMobileRom() {
    console.log("Testing Mobile API with redirect follow for room count...");

    // First, get cluster list
    const clusterUrl = 'https://m.land.naver.com/cluster/clusterList?view=atcl&cortarNo=1171010300&rletTpCd=APT&tradTpCd=A1&z=16&lat=37.5340804&lon=127.1179437';
    const headers = {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
        'Referer': 'https://m.land.naver.com/'
    };

    let res = await fetch(clusterUrl, { headers });
    let json = await res.json();
    const articles = json.data.ARTICLE;
    console.log(`Found ${articles.length} clusters.`);

    for (let i = 0; i < Math.min(3, articles.length); i++) {
        const cluster = articles[i];
        const itemId = cluster.lgeo;
        const count = cluster.count;
        console.log(`\nCluster ID: ${itemId}, Count: ${count}`);

        // Correct URL format from previous findings:
        // https://m.land.naver.com/complex/getComplexArticleList ? or ajax/articleList ?
        // Naver mobile uses /complex/getComplexArticleList for complex, and /cluster/ajax/articleList for cluster
        // Let's test ajax/articleList with follow redirect

        const artUrl = `https://m.land.naver.com/cluster/ajax/articleList?itemId=${itemId}&lgeo=1171010300&rletTpCd=APT&tradTpCd=A1&z=16&lat=${cluster.lat}&lon=${cluster.lon}&totCnt=${count}&rom=4`;
        console.log(artUrl);
        let artRes = await fetch(artUrl, { headers, redirect: 'follow' });

        console.log(`Status: ${artRes.status}, Redirected: ${artRes.redirected}, URL: ${artRes.url}`);
        if (artRes.ok) {
            let artJson = await artRes.json();
            console.log(`Body length: ${artJson.body ? artJson.body.length : 0}`);
            if (artJson.body && artJson.body.length > 0) {
                console.log(`First item: ${artJson.body[0].atclNm} - ${artJson.body[0].spc2} - ${artJson.body[0].atclFetrDesc}`);
            }
        }
    }
}

testMobileRom();
