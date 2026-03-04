const { scrapeNaverProperties } = require('./src/services/naverLandScraper');

async function debugScraper() {
    const cortarNos = ['1171000000']; // 송파구
    const criteria = {
        tradeType: 'A1',
        priceMax: 200000, // 20억 (만원 단위)
        areaMin: 120,
        roomCount: 4,
    };

    console.log('Testing scrapeNaverProperties with:', criteria);
    const results = await scrapeNaverProperties(cortarNos, criteria);
    console.log('Final results count:', results.length);
    if (results.length > 0) {
        console.log('First 3:', results.slice(0, 3));
    }
}

// We need to run this with ts-node since it imports typescript code
debugScraper().catch(console.error);
