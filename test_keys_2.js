const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function main() {
    try {
        const job = await prisma.searchJob.findFirst({
            where: { status: 'COMPLETED' },
            orderBy: { updatedAt: 'desc' }
        });
        if (job && job.result && job.result.length > 0) {
            fs.writeFileSync('pc_item_sample.json', JSON.stringify(job.result[0], null, 2));
            console.log('Saved to pc_item_sample.json');
        } else {
            console.log('No result found');
        }
    } catch (e) {
        console.error(e);
    }
}
main().finally(() => process.exit(0));
