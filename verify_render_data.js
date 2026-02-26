import { searchProperties } from './src/app/actions.js';

(async () => {
    try {
        const res = await searchProperties({
            regions: ['songpa'],
            tradeType: 'A1',
            priceMax: 20,
            areaMin: 120,
            roomCount: 4,
            minHouseholds: 500
        });
        console.log('=== SEARCH_RESULT_START ===');
        console.log(JSON.stringify(res, null, 2));
        console.log('=== SEARCH_RESULT_END ===');
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
})();
