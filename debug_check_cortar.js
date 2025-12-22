// Native fetch (Node 18+)
// We need to check two areas: Pungnap (near Sincheon) and Macheon (near Ogeum)

const areas = [
    { name: 'PungnapArea', lat: 37.535, lon: 127.115 }, // Near Sincheon
    { name: 'MacheonArea', lat: 37.495, lon: 127.155 }  // Near Ogeum
];

const checkArea = async (area) => {
    const { lat, lon } = area;
    const params = new URLSearchParams();
    params.append('cortarNo', '1171000000');
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
    console.log(`Fetching ${area.name}...`);

    try {
        const res = await fetch(apiUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        const json = await res.json();
        const items = json.body || [];

        console.log(`Items in ${area.name}: ${items.length}`);

        // Find specific targets
        items.forEach(item => {
            if (item.atclNm.includes('극동') || item.atclNm.includes('마천') || item.atclNm.includes('파크리오')) {
                console.log(`[${area.name}] Found: ${item.atclNm}, CortarNo: ${item.cortarNo}, LdongNm: ${item.ldongNm || 'N/A'}`);
            }
        });
    } catch (e) {
        console.error(e);
    }
};

(async () => {
    for (const area of areas) {
        await checkArea(area);
    }
})();
