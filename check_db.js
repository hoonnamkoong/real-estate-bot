const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const job = await prisma.searchJob.findFirst({
            orderBy: { createdAt: 'desc' }
        });
        console.log('LATEST_JOB_START');
        console.log(JSON.stringify(job, null, 2));
        console.log('LATEST_JOB_END');
    } catch (e) {
        console.error('DB_ERROR:', e.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
