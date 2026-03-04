const fetch = require('node-fetch');

async function testMobileApi() {
    // 1. Get Cluster List (단지 클러스터 목록) with filters
    const cortarNo = '1171010300'; // 풍납동
    // 송파구 1171000000

    // User's URL: https://m.land.naver.com/map/37.514592:127.105863:12/APT/A1?dprcMax=200000&spcMin=132&spcMax=900000000&tag=FOURROOM
    // Let's translate this to API call

    const lat = 37.514592;
    const lon = 127.105863;
    const z = 12; // zoom

    const clusterUrl = `https://m.land.naver.com/cluster/clusterList?view=atcl&cortarNo=1171000000&rletTpCd=APT&tradTpCd=A1&z=${z}&lat=${lat}&lon=${lon}&dprcMax=200000&spcMin=132&spcMax=900000000&tag=FOURROOM`;

    const headers = {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
        'Referer': 'https://m.land.naver.com/',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'ko-KR,ko;q=0.9',
    };

    console.log('Fetching Cluster URL:', clusterUrl);
    const r1 = await fetch(clusterUrl, { headers });
    const clusterData = await r1.json();

    // console.log('Cluster Data:', JSON.stringify(clusterData).substring(0, 300));
    const clusters = clusterData.data?.ARTICLE || [];
    console.log(`Found ${clusters.length} clusters.`);

    if (clusters.length === 0) {
        console.log('No clusters matched the filter.');
        return;
    }

    // Get first cluster
    const cluster = clusters[0];
    console.log('First cluster:', cluster);

    // 2. Fetch specific article list for that cluster
    // URL format: /cluster/ajax/articleList?itemId=...&lgeo=...&rletTpCd=...&tradTpCd=...&z=...&lat=...&lon=...&totCnt=...
    const articleListUrl = `https://m.land.naver.com/cluster/ajax/articleList?itemId=${cluster.lgeo}&lgeo=1171000000&rletTpCd=APT&tradTpCd=A1&z=${z}&lat=${cluster.lat}&lon=${cluster.lon}&totCnt=${cluster.count}&dprcMax=200000&spcMin=132&spcMax=900000000&tag=FOURROOM`;

    console.log('\nFetching Article List URL:', articleListUrl);
    const r2 = await fetch(articleListUrl, { headers });
    if (r2.ok) {
        const articleData = await r2.json();
        const articles = articleData.body || [];
        console.log(`Found ${articles.length} articles!`);
        if (articles.length > 0) {
            console.log('First article:', {
                atclNo: articles[0].atclNo,
                atclNm: articles[0].atclNm,
                prc: articles[0].prc,
                spc1: articles[0].spc1,
                tagList: articles[0].tagList
            });
        }
    } else {
        console.log('Error fetching articles:', await r2.text());
    }
}

testMobileApi().catch(console.error);
