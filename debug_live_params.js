// Native fetch assumed

async function debugLive() {
    // 1. Exact logic from naverLand.ts
    const cortarNo = '1171000000'; // Songpa
    const lat = 37.514544;
    const lon = 127.105918;

    // Adjusted Box Size and Zoom to match User's URL
    const boxSize = 0.08;
    const btm = lat - boxSize;
    const top = lat + boxSize;
    const lft = lon - boxSize;
    const rgt = lon + boxSize;

    // Pagination Loop Simulation (Page 1)
    const params = new URLSearchParams();
    params.append('cortarNo', cortarNo);
    params.append('rletTpCd', 'APT:ABYG:JGC');
    params.append('tradTpCd', 'A1'); // Sale
    params.append('z', '16'); // UPDATED: Match User's Zoom Level
    params.append('lat', String(lat));
    params.append('lon', String(lon));
    params.append('btm', String(btm.toFixed(7)));
    params.append('lft', String(lft.toFixed(7)));
    params.append('top', String(top.toFixed(7)));
    params.append('rgt', String(rgt.toFixed(7)));

    params.append('page', '1');

    // Filters (Songpa, 20Eok, 120m2, 4Room)
    params.append('prc', '0:200000');
    params.append('spcMin', '120');
    params.append('rom', '4');

    const url = `https://m.land.naver.com/cluster/ajax/articleList?${params.toString()}`;
    console.log('Testing z=16 and box=0.08...');

    try {
        const res = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
                'Referer': 'https://m.land.naver.com/'
            }
        });

        if (!res.ok) {
            console.log('Error Status:', res.status);
            const txt = await res.text();
            console.log('Error Body:', txt);
            return;
        }

        const json = await res.json();
        console.log('Response Code:', json.code);
        console.log('Response More:', json.more);

        const list = json.body || [];
        console.log('Body Length:', list.length);

        if (list.length === 0) {
            console.log('WARNING: Body is empty!');
        } else {
            console.log('First Item:', list[0].atclNm);
        }

    } catch (e) {
        console.error('Exception:', e);
    }
}

debugLive();
