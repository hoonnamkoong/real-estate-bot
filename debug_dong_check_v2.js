// Native fetch (Node 18+)
// Pungnap area coordinates
const lat = 37.535;
const lon = 127.115;

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

fetch(apiUrl, {
    headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
        'Referer': 'https://m.land.naver.com/'
    }
})
    .then(res => res.json())
    .then(json => {
        const items = json.body || [];
        console.log(`Total items: ${items.length}`);

        // Try to find ANY item to see its keys
        if (items.length > 0) {
            // Find '한강극동'
            const target = items.find(i => i.atclNm.includes('한강극동'));
            if (target) {
                console.log('--- FOUND TARGET: 한강극동 ---');
                console.log(JSON.stringify(target, null, 2));
            } else {
                console.log('--- TARGET NOT FOUND ---');
                console.log('First Item:', JSON.stringify(items[0], null, 2));
            }
        } else {
            console.log('No items returned.');
        }
    })
    .catch(err => console.error('Error:', err));
