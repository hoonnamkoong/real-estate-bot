
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Testing DB Save...');
    try {
        const dummyResults = [
            { id: 'test1', name: 'Test Property', price: 100000, note: 'TestNote' }
        ];

        const saved = await prisma.searchSetting.create({
            data: {
                regions: 'debug',
                type: 'A1',
                priceMax: 30,
                results: dummyResults as any
            } as any
        });
        console.log('SUCCESS: Saved ID:', saved.id);

        console.log('Testing DB Read...');
        const read = await prisma.searchSetting.findUnique({
            where: { id: saved.id }
        });
        console.log('READ Result:', JSON.stringify(read?.results, null, 2));

    } catch (e) {
        console.error('FAILURE:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
