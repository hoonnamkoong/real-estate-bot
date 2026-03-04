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

    // First get cluster data
    const clusterUrl = `https://m.land.naver.com/cluster/clusterList?view=atcl&cortarNo=${cortarNo}&rletTpCd=APT&tradTpCd=A1&z=16&lat=${lat}&lon=${lon}`;
    const r1 = await fetch(clusterUrl, { headers });
    const clusterData = await r1.json();
    const clusters = clusterData?.data?.ARTICLE || [];

    const cluster = clusters[0];
    if (!cluster) { console.log('no cluster'); return; }

    console.log('Testing different article API variants for cluster:', cluster.lgeo);

    // Try variant 1: original (307 redirect)
    const v1 = `https://m.land.naver.com/cluster/ajax/articleList?itemId=${cluster.lgeo}&lgeo=${cortarNo}&rletTpCd=APT&tradTpCd=A1&z=16&lat=${cluster.lat}&lon=${cluster.lon}&totCnt=${cluster.count}`;
    const r2 = await fetch(v1, { headers, redirect: 'manual' });
    console.log('v1 status:', r2.status, 'location:', r2.headers.get('location')?.substring(0, 80));

    // Try variant 2: /complex/getComplexArticleList (PC API)
    const v2 = `https://new.land.naver.com/api/regions/complexes?cortarNo=${cortarNo}&rletTpCd=APT:ABYG:JGC&tradTpCd=A1`;
    const r3 = await fetch(v2, { headers });
    console.log('PC complexes status:', r3.status);

    // Try variant 3: different mobile API endpoint
    const v3 = `https://m.land.naver.com/complex/getComplexArticleList?hscpNo=${cluster.lgeo}&tradTpCd=A1&order=prc`;
    const r4 = await fetch(v3, { headers });
    console.log('getComplexArticleList status:', r4.status);
    if (r4.ok) {
        const data = await r4.json();
        console.log('  keys:', Object.keys(data));
    }

    // Try variant 4: with cookie
    const headersWithCookie = {
        ...headers,
        'Cookie': 'NNB=SAMPLECOOKIE123; nid_aut=SAMPLEAUTH;'
    };
    const r5 = await fetch(v1, { headers: headersWithCookie, redirect: 'manual' });
    console.log('v1 with cookie status:', r5.status);
}

test().catch(console.error);
