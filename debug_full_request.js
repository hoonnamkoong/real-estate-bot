
const fs = require('fs');

async function testFullSearch() {
    // Mimic the Pungnap points from naverLand.ts
    const points = [
        { name: '풍납1', lat: 37.538, lon: 127.123 },
        { name: '풍납2', lat: 37.529, lon: 127.117 },
        { name: '풍납3', lat: 37.522, lon: 127.110 }
    ];
    // Also include generic Songpa grid just to be sure (Songpa center)
    // 1171000000 -> 37.514544, 127.105918
    // But let's focus on Pungnap first since user mentioned it.

    // User Params: Songpa, A1, Max 20, Min 120, Room 4
    const criteria = {
        priceMax: 200000, // 20 * 10000
        areaMin: 120,
        roomCount: 4,
        tradeType: 'A1'
    };

    const subBoxSize = 0.02; // Current box size

    for (const center of points) {
        const btm = center.lat - subBoxSize;
        const top = center.lat + subBoxSize;
        const lft = center.lon - subBoxSize;
        const rgt = center.lon + subBoxSize;

        console.log(`\nSearching ${center.name} with criteria:`, criteria);

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

        // PARAMETER CHECK:
        // Naver Web uses: g=200000 (price), h=119 (area), q=FOURROOM
        // Mobile API uses: prc=0:200000, spcMin=120, rom=4
        params.append('prc', `0:${criteria.priceMax}`);
        params.append('spcMin', String(criteria.areaMin));
        params.append('rom', String(criteria.roomCount));

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
            const items = json.body || [];

            console.log(`Found ${items.length} items in ${center.name}.`);
            // Log ALL items to check if valid ones exist
            items.forEach(i => console.log(` [RAW] ${i.atclNm} / ${i.prc} / ${i.spc1}`));


            // 1. Map to Property Interface (matching naverLand.ts)
            const mapped = items.map(item => ({
                id: item.atclNo,
                name: item.atclNm,
                price: typeof item.prc === 'number' ? item.prc : parseInt(item.prc),
                area: {
                    m2: typeof item.spc1 === 'string' ? parseFloat(item.spc1) : item.spc1,
                },
                _rawPrice: item.prc
            }));

            // 2. Client-side Filtering (matching actions.ts)
            const filtered = mapped.filter(item => {
                const validationLogs = [];
                let pass = true;

                // Price Filter
                // priceMax is Man-won (200000)
                if (criteria.priceMax && item._rawPrice > criteria.priceMax) {
                    validationLogs.push(`Price Fail: ${item._rawPrice} > ${criteria.priceMax}`);
                    pass = false;
                }

                // Area Filter
                if (criteria.areaMin && item.area.m2 < criteria.areaMin) {
                    validationLogs.push(`Area Fail: ${item.area.m2} < ${criteria.areaMin}`);
                    pass = false;
                }

                if (!pass) console.log(`   [Filtered Out] ${item.name}: ${validationLogs.join(', ')}`);
                return pass;
            });

            console.log(`Remaining after filter: ${filtered.length}`);
            filtered.forEach(i => console.log(`   [KEPT] ${i.name} (${i._rawPrice}, ${i.area.m2}m2)`));

            if (items.length > 0 && filtered.length === 0) {
                console.log("WARNING: All items were filtered out!");
            }


        } catch (e) {
            console.error('Error:', e);
        }
    }
}

testFullSearch();
