const { NaverLandService } = require('./src/services/naverLand'); // This might fail if typescript, so I'll write a pure JS version or use ts-node if available. 
// Actually, I'll write a standalone JS script that mocks the fetch part to just hit the API for a known coordinate or just uses the logic.

// Let's write a pure JS script that hits the API near Pungnap/Sincheon to find 'Hangang Geukdong'
// Pungnap lat/lon: 37.535, 127.115
// Sincheon lat/lon: 37.520, 127.105

async function run() {
    const fetch = (await import('node-fetch')).default;

    // Coordinates between Sincheon and Pungnap to capture the target
    const lat = 37.535; // Pungnap area
    const lon = 127.115;

    // We'll search explicitly for specific names if possible, but the API is geographic.
    // I will replicate the request `naverLand.ts` makes.

    const params = new URLSearchParams();
    params.append('cortarNo', '1171000000'); // Songpa
    params.append('rletTpCd', 'APT:ABYG:JGC');
    params.append('tradTpCd', 'A1');
    params.append('z', '16');
    params.append('lat', String(lat));
    params.append('lon', String(lon));
    params.append('btm', String(lat - 0.02));
    params.append('lft', String(lon - 0.02));
    params.append('top', String(lat + 0.02));
    params.append('rgt', String(lon + 0.02));
    params.append('page', '1');

    const apiUrl = `https://m.land.naver.com/cluster/ajax/articleList?${params.toString()}`;

    console.log('Fetching:', apiUrl);

    try {
        const response = await fetch(apiUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
                'Referer': 'https://m.land.naver.com/'
            }
        });

        const json = await response.json();
        const items = json.body || [];

        // Find '한강극동' (Hangang Geukdong)
        const target = items.find(i => i.atclNm.includes('한강극동'));

        if (target) {
            console.log('Found Target:', target.atclNm);
            console.log('Keys:', Object.keys(target));
            console.log('Full Object:', JSON.stringify(target, null, 2));
        } else {
            console.log('Target not found in this search box.');
            console.log('First 3 items:', items.slice(0, 3).map(i => i.atclNm));
        }

    } catch (e) {
        console.error(e);
    }
}

run();
