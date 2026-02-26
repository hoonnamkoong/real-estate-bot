const fetch = require('node-fetch');

async function checkRealSongpa() {
    console.log('Checking Songpa REAL data...');

    // Songpa Points - Let's try multiple points to be sure
    const points = [
        { lat: 37.514544, lon: 127.105918 }, // Jamsil Center
        { lat: 37.498, lon: 127.124 },        // Garak
        { lat: 37.517, lon: 127.086 }         // Jamsil West
    ];

    const results = [];

    for (const pt of points) {
        const subBoxSize = 0.03;
        const btm = pt.lat - subBoxSize;
        const top = pt.lat + subBoxSize;
        const lft = pt.lon - subBoxSize;
        const rgt = pt.lon + subBoxSize;

        const params = new URLSearchParams({
            cortarNo: '1171000000',
            rletTpCd: 'APT:ABYG:JGC',
            tradTpCd: 'A1',
            z: '15',
            lat: String(pt.lat),
            lon: String(pt.lon),
            btm: btm.toFixed(7),
            lft: lft.toFixed(7),
            top: top.toFixed(7),
            rgt: rgt.toFixed(7),
            page: '1',
            prc: '0:200000', // 20억
            spcMin: '120',
            rom: '4'
        });

        const url = `https://m.land.naver.com/cluster/ajax/articleList?${params.toString()}`;
        console.log(`Checking point ${pt.lat}, ${pt.lon}...`);

        try {
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
                    'Referer': 'https://m.land.naver.com/'
                }
            });
            const json = await response.json();
            const items = json.body || [];
            console.log(`- Found ${items.length} items here`);

            for (const item of items) {
                const prc = Number(item.prc);
                const spc = Number(item.spc1);
                console.log(`  [ITEM] ${item.atclNm} | Price: ${prc} | Area: ${spc}`);
            }
        } catch (e) {
            console.error('Error at point:', e);
        }
    }
}

checkRealSongpa();
