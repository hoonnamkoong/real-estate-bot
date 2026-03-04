const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const jobs = await prisma.searchJob.findMany({ orderBy: { createdAt: 'desc' }, take: 3 });
    for (const job of jobs) {
        console.log(`Job ID: ${job.id} | Status: ${job.status} | CreatedAt: ${job.createdAt}`);
        if (job.result) {
            const res = Array.isArray(job.result) ? job.result : JSON.parse(JSON.stringify(job.result));
            console.log(`  Result items count: ${res.length}`);
            if (res.length > 0) {
                console.log(`  Sample: ${JSON.stringify(res[0]).substring(0, 150)}`);
            }
        } else {
            console.log(`  Result is null/empty.`);
        }
    }
}
main().catch(console.error).finally(() => prisma.$disconnect());
