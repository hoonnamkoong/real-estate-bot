const fetch = require('node-fetch');
const fs = require('fs');

async function test(cookies) {
    const cortarNo = '1171010300';

    // Test the single-markers API with Naver cookies
    const url = `https://new.land.naver.com/api/complexes/single-markers/2.0?cortarNo=${cortarNo}&zoom=16&priceType=RETAIL&realEstateType=APT%3APRE%3AABYG%3AJGC&tradeType=A1&tag=%3AFOURROOM%3A%3A%3A%3A%3A%3A%3A&priceMin=0&priceMax=200000&areaMin=120&areaMax=900000000&showArticle=true&leftLon=127.1042108&rightLon=127.1316766&topLat=37.5396103&bottomLat=37.5285501`;

    const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Referer': 'https://new.land.naver.com/',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'ko-KR,ko;q=0.9',
        'Cookie': cookies || ''
    };

    console.log('Testing with cookies (first 50 chars):', (cookies || '').substring(0, 50));
    const r = await fetch(url, { headers });
    console.log('Status:', r.status);

    if (r.ok) {
        const data = await r.json();
        if (Array.isArray(data)) {
            console.log('Got', data.length, 'markers!');
            if (data.length > 0) {
                console.log('First marker keys:', Object.keys(data[0]));
                console.log('First marker:', JSON.stringify(data[0]).substring(0, 400));
            }
        } else {
            console.log('Response:', JSON.stringify(data).substring(0, 200));
        }
    } else {
        const text = await r.text();
        console.log('ERROR:', text.substring(0, 200));
    }

    // Also test mobile articleList with cookies
    console.log('\n--- Testing Mobile articleList with cookies ---');
    const clusterUrl = `https://m.land.naver.com/cluster/clusterList?view=atcl&cortarNo=${cortarNo}&rletTpCd=APT&tradTpCd=A1&z=16&lat=37.5340804&lon=127.1179437`;
    const mobileHeaders = {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
        'Referer': 'https://m.land.naver.com/',
        'Accept': 'application/json',
        'Cookie': cookies || ''
    };
    const r2 = await fetch(clusterUrl, { headers: mobileHeaders });
    const clusterData = await r2.json();
    const clusters = clusterData?.data?.ARTICLE || [];
    const cluster = clusters[0];
    if (cluster) {
        const artUrl = `https://m.land.naver.com/cluster/ajax/articleList?itemId=${cluster.lgeo}&lgeo=${cortarNo}&rletTpCd=APT&tradTpCd=A1&z=16&lat=${cluster.lat}&lon=${cluster.lon}&totCnt=${cluster.count}`;
        const r3 = await fetch(artUrl, { headers: mobileHeaders, redirect: 'manual' });
        console.log(`articleList status: ${r3.status}, location: ${r3.headers.get('location')?.substring(0, 60)}`);
    }
}

// Try to use cookies from the google_maps_agent (if it has naver cookies)
let cookies = '';
try {
    const cookiePath = 'c:/Users/Hoon_DT/gemini/google_maps_agent/cookie_for_vercel_new.txt';
    const cookieData = fs.readFileSync(cookiePath, 'utf8');
    // Parse cookies from file
    cookies = cookieData.trim();
} catch (e) {
    console.log('No cookie file found:', e.message);
}

test(cookies).catch(console.error);
