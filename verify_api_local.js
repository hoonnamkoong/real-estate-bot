// using native fetch

// Mock the Service Logic
async function testNaverApi() {
    console.log("Starting API Test...");

    // Gangnam Coords
    const lat = 37.517332;
    const lon = 127.047377;
    const btm = lat - 0.05;
    const top = lat + 0.05;
    const lft = lon - 0.06;
    const rgt = lon + 0.06;

    const params = new URLSearchParams();
    params.append('rletTpCd', 'APT:ABYG:JGC');
    params.append('tradTpCd', 'A1'); // Sale
    params.append('z', '14');
    params.append('lat', String(lat));
    params.append('lon', String(lon));
    params.append('btm', String(btm.toFixed(7)));
    params.append('lft', String(lft.toFixed(7)));
    params.append('top', String(top.toFixed(7)));
    params.append('rgt', String(rgt.toFixed(7)));

    // Test with Price Max 30 Eok to mimic user case?
    // params.append('prc', '0:300000'); 

    const apiUrl = `https://m.land.naver.com/cluster/ajax/articleList?${params.toString()}`;
    console.log("Fetching: " + apiUrl);

    try {
        const response = await fetch(apiUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
                'Referer': 'https://m.land.naver.com/'
            }
        });

        if (!response.ok) {
            console.error(`Status: ${response.status} ${response.statusText}`);
            const text = await response.text();
            console.error("Body:", text);
            return;
        }

        const json = await response.json();
        console.log("JSON Body Type:", typeof json.body);
        if (Array.isArray(json.body)) {
            console.log(`Success! Found ${json.body.length} items.`);
            if (json.body.length > 0) {
                console.log("First Item:", json.body[0]);
            }
        } else {
            console.log("Body is not an array:", json);
        }

    } catch (e) {
        console.error("Fetch Error:", e);
    }
}

testNaverApi();
