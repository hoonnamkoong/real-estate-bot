const fetch = require('node-fetch');

async function main() {
    try {
        const url = 'https://new.land.naver.com/api/regions/complexes?cortarNo=1171010300&rletTpCd=APT&tradTpCd=A1';
        const res = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36',
                'Referer': 'https://new.land.naver.com/complexes?ms=37.5340804,127.1179437,16&a=APT:PRE:ABYG:JGC&b=A1&e=RETAIL',
                'Accept': 'application/json, text/plain, */*'
            }
        });
        console.log(`STATUS: ${res.status}`);
        if (res.ok) {
            const json = await res.json();
            if (json.complexList) {
                console.log(`Success! Found ${json.complexList.length} complexes.`);
                if (json.complexList.length > 0) {
                    console.log('Sample Complex:', Object.keys(json.complexList[0]).join(', '));
                    console.log('Complex Number:', json.complexList[0].complexNo);
                }
            } else {
                console.log('No complexList in response', JSON.stringify(json).substring(0, 50));
            }
        } else {
            console.log(await res.text());
        }
    } catch (e) {
        console.error(e);
    }
}
main();
