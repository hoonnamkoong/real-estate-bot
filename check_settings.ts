
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Current Search Settings ---');
    const settings = await prisma.searchSetting.findMany({
        orderBy: { updatedAt: 'desc' },
        take: 5
    });

    if (settings.length === 0) {
        console.log('No settings found in database.');
    } else {
        settings.forEach((s, i) => {
            console.log(`[${i}] ID: ${s.id}, Regions: ${s.regions}, Type: ${s.type}, PriceMax: ${s.priceMax}, UpdatedAt: ${s.updatedAt}`);
        });
    }

    console.log('\n--- Recent Results Summary ---');
    if (settings[0]?.results) {
        const results = settings[0].results as any[];
        console.log(`Latest setting (${settings[0].id}) has ${results.length} results saved.`);
        if (results.length > 0) {
            console.log('First result:', JSON.stringify(results[0], null, 2));
        }
    }

    await prisma.$disconnect();
}

main();
