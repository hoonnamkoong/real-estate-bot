// using native fetch

async function inspectItemKeys() {
    const lat = 37.514544; // Songpa
    const lon = 127.105918;
    // Tighter box
    const btm = lat - 0.02;
    const top = lat + 0.02;
    const lft = lon - 0.02;
    const rgt = lon + 0.02;

    const params = new URLSearchParams();
    params.append('rletTpCd', 'APT:ABYG:JGC');
    params.append('tradTpCd', 'A1');
    params.append('z', '14');
    params.append('lat', String(lat));
    params.append('lon', String(lon));
    params.append('btm', String(btm.toFixed(7)));
    params.append('lft', String(lft.toFixed(7)));
    params.append('top', String(top.toFixed(7)));
    params.append('rgt', String(rgt.toFixed(7)));
    // ADD CORTAR NO
    params.append('cortarNo', '1171000000');

    const apiUrl = `https://m.land.naver.com/cluster/ajax/articleList?${params.toString()}`;
    console.log("Fetching: " + apiUrl);

    try {
        const response = await fetch(apiUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
                'Referer': 'https://m.land.naver.com/'
            }
        });

        const json = await response.json();
        const list = json.body || [];
        if (list.length > 0) {
            console.log("Total Items:", list.length);
            // Check keys of first item
            const keys = Object.keys(list[0]);
            console.log("Keys available (first 20):", keys.slice(0, 20).join(", "));

            // Check for household specific keys
            const householdKeys = keys.filter(k => k.toLowerCase().includes('hshld') || k.includes('cnt'));
            console.log("Household related keys:", householdKeys);

            // Print first 5 items to verify region
            console.log("First 5 Items:");
            list.slice(0, 5).forEach(item => {
                console.log(`- ${item.atclNm} (${item.prc}), ID: ${item.atclNo}`);
            });
        } else {
            console.log("No items found.");
        }

    } catch (e) {
        console.error(e);
    }
}

inspectItemKeys();
