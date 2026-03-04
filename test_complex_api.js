const fetch = require('node-fetch');

async function test() {
    const cortarNo = '1171010300'; // Pungnap-dong
    const lat = 37.5340804;
    const lon = 127.1179437;

    const headers = {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
        'Referer': 'https://m.land.naver.com/',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'ko-KR,ko;q=0.9',
    };

    // Get clusters
    const clusterUrl = `https://m.land.naver.com/cluster/clusterList?view=atcl&cortarNo=${cortarNo}&rletTpCd=APT&tradTpCd=A1&z=16&lat=${lat}&lon=${lon}`;
    const r1 = await fetch(clusterUrl, { headers });
    const clusterData = await r1.json();
    const clusters = clusterData?.data?.ARTICLE || [];
    console.log('Total clusters:', clusters.length);

    let allArticles = [];

    // Try getComplexArticleList for each cluster
    for (const cluster of clusters.slice(0, 5)) {
        const url = `https://m.land.naver.com/complex/getComplexArticleList?hscpNo=${cluster.lgeo}&tradTpCd=A1&order=prc`;
        const r = await fetch(url, { headers });

        if (!r.ok) {
            console.log(`cluster ${cluster.lgeo}: FAILED ${r.status}`);
            continue;
        }

        const data = await r.json();
        const articles = data?.result?.houseArticleList || data?.result?.articleList || [];
        console.log(`cluster ${cluster.lgeo}: ${articles.length} articles`);

        if (articles.length > 0) {
            console.log('Sample keys:', Object.keys(articles[0]));
            console.log('Sample[0]:', JSON.stringify(articles[0]).substring(0, 300));
        }

        allArticles.push(...articles);
        if (allArticles.length > 0) break; // Got some data
    }

    console.log('\nTotal articles:', allArticles.length);
}

test().catch(console.error);
