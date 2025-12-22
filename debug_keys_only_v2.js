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
            console.log('--- KEYS ---');
            Object.keys(items[0]).forEach(key => console.log(key));

            console.log('--- SAMPLE VALUES ---');
            console.log('ldongNm:', items[0].ldongNm);
            console.log('cortarNm:', items[0].cortarNm);
            console.log('atclAdres:', items[0].atclAdres); // Address often has dong
        } else {
            console.log('No items');
        }
    })
    .catch(err => console.error(err));
