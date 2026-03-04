const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const jobs = await prisma.searchJob.findMany({
        orderBy: { createdAt: 'desc' },
        take: 1
    });
    if (jobs.length > 0) {
        console.log('--- LATEST JOB ---');
        console.log('Job ID:', jobs[0].id);
        console.log('Created At:', jobs[0].createdAt);
        console.log('Status:', jobs[0].status);
        const urls = jobs[0].params?.urls || [];
        console.log('URLs Count:', urls.length);
        console.log('Sample URL 1:', urls[0]);
        console.log('Sample URL 2:', urls[1]);
    } else {
        console.log('No jobs found');
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
