const fs = require('fs');

async function testPungnap() {
    // New Pungnap Points (North, Central, South)
    const points = [
        { name: '풍납1', lat: 37.538, lon: 127.123 },
        { name: '풍납2', lat: 37.529, lon: 127.117 },
        { name: '풍납3', lat: 37.522, lon: 127.110 }
    ];
    const subBoxSize = 0.02;

    // User Criteria
    const criteria = {
        priceMax: 200000,
        areaMin: 120,
        roomCount: 4,
        tradeType: 'A1'
    };

    for (const center of points) {
        const btm = center.lat - subBoxSize;
        const top = center.lat + subBoxSize;
        const lft = center.lon - subBoxSize;
        const rgt = center.lon + subBoxSize;

        console.log(`\nSearching ${center.name}: Lat ${center.lat}, Lon ${center.lon}`);

        const params = new URLSearchParams();
        params.append('cortarNo', '1171000000'); // Songpa-gu
        params.append('rletTpCd', 'APT:ABYG:JGC');
        params.append('tradTpCd', criteria.tradeType);
        params.append('z', '16');
        params.append('lat', String(center.lat));
        params.append('lon', String(center.lon));
        params.append('btm', String(btm));
        params.append('lft', String(lft));
        params.append('top', String(top));
        params.append('rgt', String(rgt));
        params.append('page', '1');
        params.append('prc', `0:${criteria.priceMax}`);
        params.append('spcMin', String(criteria.areaMin));
        params.append('rom', String(criteria.roomCount));

        const url = `https://m.land.naver.com/cluster/ajax/articleList?${params.toString()}`;

        try {
            const res = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X)'
                }
            });
            const json = await res.json();
            const items = json.body || [];

            console.log(`Found ${items.length} items in ${center.name}.`);
            items.forEach(i => {
                console.log(` - ${i.atclNm} (${i.prc}만원, ${i.spc1}m2)`);
            });

        } catch (e) {
            console.error('Error:', e);
        }
    }
}

testPungnap();
