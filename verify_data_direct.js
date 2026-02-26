import { naverLand } from './src/services/naverLand.js';

(async () => {
    try {
        console.log('--- Fetching real data for Songpa-gu for verification ---');
        const criteria = {
            regions: ['songpa'],
            tradeType: 'A1',
            priceMax: 20,
            areaMin: 120,
            roomCount: 4,
            minHouseholds: 500
        };

        // Use the core service directly to bypass action wrapping if needed
        const results = await naverLand.searchProperties(criteria);

        console.log('=== VERIFICATION_DATA_START ===');
        console.log(`Found ${results.length} total items.`);
        if (results.length > 0) {
            console.log('Sample Data (First 3 items):');
            console.log(JSON.stringify(results.slice(0, 3), null, 2));
        }
        console.log('=== VERIFICATION_DATA_END ===');
        process.exit(0);
    } catch (e) {
        console.error('Data Fetch Failure:', e);
        process.exit(1);
    }
})();
