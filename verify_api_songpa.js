const { naverLand } = require('./src/services/naverLand');

(async () => {
    try {
        console.log('Direct Naver API Test (Songpa, Sale, 20억, 120m2, Room 4)...');
        const criteria = {
            tradeType: 'A1',
            priceMax: 200000, // 20억
            areaMin: 120,
            roomCount: 4
        };
        // Songpa code: 1171000000
        const results = await naverLand.getArticleList('1171000000', criteria, true);
        console.log(`API_TEST_RESULT: Found ${results.length} items.`);
        if (results.length > 0) {
            console.log('Sample Item:', JSON.stringify(results[0], null, 2));
        }
    } catch (e) {
        console.error('API_TEST_ERROR:', e);
    }
})();
