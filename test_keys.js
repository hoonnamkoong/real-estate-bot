const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const job = await prisma.searchJob.findFirst({
        where: { status: 'COMPLETED' },
        orderBy: { updatedAt: 'desc' }
    });
    if (job && job.result && job.result.length > 0) {
        console.log(Object.keys(job.result[0]).join(', '));
        console.log(JSON.stringify(job.result[0], null, 2));
    } else {
        console.log('No result found');
    }
}
main().finally(() => process.exit(0));
