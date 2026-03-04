const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const jobs = await prisma.searchJob.findMany({
        orderBy: { createdAt: 'desc' },
        take: 3
    });
    console.log('--- RECENT JOBS ---');
    for (const job of jobs) {
        console.log('Job ID:', job.id, '| Status:', job.status, '| Created:', job.createdAt);
        const res = job.result || [];
        console.log('Result Length:', Array.isArray(res) ? res.length : 'Not an array');
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
