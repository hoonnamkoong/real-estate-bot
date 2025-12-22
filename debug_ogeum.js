
const DONG_COORDS = { lat: 37.505, lon: 127.135 }; // Ogeum
const BOX_SIZE = 0.02;

async function run() {
    const lat = DONG_COORDS.lat;
    const lon = DONG_COORDS.lon;
    const btm = lat - BOX_SIZE;
    const top = lat + BOX_SIZE;
    const lft = lon - BOX_SIZE;
    const rgt = lon + BOX_SIZE;

    const params = new URLSearchParams();
    params.append('cortarNo', '1171000000'); // Songpa-gu
    params.append('rletTpCd', 'APT:ABYG:JGC');
    params.append('tradTpCd', 'A1'); // Sale
    params.append('z', '16');
    params.append('lat', String(lat));
    params.append('lon', String(lon));
    params.append('btm', String(btm.toFixed(7)));
    params.append('lft', String(lft.toFixed(7)));
    params.append('top', String(top.toFixed(7)));
    params.append('rgt', String(rgt.toFixed(7)));
    params.append('page', '1');

    // User Criteria: 20 Eok Max, 119m2 Min, 4 Rooms
    params.append('prc', '0:200000');
    params.append('spcMin', '119');
    params.append('rom', '4');

    const url = `https://m.land.naver.com/cluster/ajax/articleList?${params.toString()}`;
    console.log('Fetching:', url);

    try {
        const res = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
                'Referer': 'https://m.land.naver.com/'
            }
        });
        const json = await res.json();

        console.log('Response Status:', res.status);
        if (json.body) {
            console.log('Total Items:', json.body.length);
            const fs = require('fs');
            fs.writeFileSync('debug_ogeum_output.json', JSON.stringify(json.body, null, 2));
            console.log('Saved output to debug_ogeum_output.json');
        } else {
            console.log('No body in response:', json);
        }

    } catch (e) {
        console.error('Error:', e);
    }
}

run();
