const fetch = require('node-fetch');

// Test: Can Vercel (or local node) call m.land.naver.com mobile API?
// If this works, we can skip Android app entirely.

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

    // Step 1: Get cluster list for dong
    console.log('Step 1: Get cluster list...');
    const clusterUrl = `https://m.land.naver.com/cluster/clusterList?view=atcl&cortarNo=${cortarNo}&rletTpCd=APT&tradTpCd=A1&z=16&lat=${lat}&lon=${lon}`;
    const r1 = await fetch(clusterUrl, { headers });
    console.log('Status:', r1.status);

    if (!r1.ok) {
        console.log('FAILED:', (await r1.text()).substring(0, 200));
        return;
    }

    const clusterData = await r1.json();
    const clusters = clusterData?.data?.ARTICLE || [];
    console.log('Total clusters:', clusters.length);

    let allArticles = [];

    // Step 2: Get articles for first 5 clusters
    for (const cluster of clusters.slice(0, 5)) {
        const artUrl = `https://m.land.naver.com/cluster/ajax/articleList?itemId=${cluster.lgeo}&lgeo=${cortarNo}&rletTpCd=APT&tradTpCd=A1&z=16&lat=${cluster.lat}&lon=${cluster.lon}&totCnt=${cluster.count}`;
        const r2 = await fetch(artUrl, { headers, redirect: 'follow' });
        console.log(`Cluster ${cluster.lgeo}: status=${r2.status}, url=${r2.url.substring(0, 60)}`);

        if (r2.ok && !r2.url.includes('error/abuse')) {
            const data = await r2.json();
            const body = data.body || [];
            console.log(`  -> ${body.length} articles found`);
            allArticles.push(...body);
        }
    }

    console.log('\nTotal articles collected:', allArticles.length);
    if (allArticles.length > 0) {
        const sample = allArticles[0];
        console.log('Sample article keys:', Object.keys(sample));
        console.log('Sample:', JSON.stringify(sample, null, 2).substring(0, 300));
    }
}

test().catch(console.error);
