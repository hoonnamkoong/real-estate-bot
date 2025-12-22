// Native fetch (Node 18+)
const lat = 37.535;
const lon = 127.115;
const apiUrl = `https://m.land.naver.com/cluster/ajax/articleList?cortarNo=1171000000&rletTpCd=APT:ABYG:JGC&tradTpCd=A1&z=16&lat=${lat}&lon=${lon}&btm=${lat - 0.02}&lft=${lon - 0.02}&top=${lat + 0.02}&rgt=${lon + 0.02}&page=1`;

console.log('Fetching...');
fetch(apiUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0' }
})
    .then(res => res.json())
    .then(json => {
        const items = json.body || [];
        if (items.length > 0) {
            console.log('--- FULL ITEM ---');
            console.log(JSON.stringify(items[0], null, 2));
        } else {
            console.log('No items');
        }
    })
    .catch(err => console.error(err));
