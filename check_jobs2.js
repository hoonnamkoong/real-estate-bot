const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const jobs = await prisma.searchJob.findMany({ orderBy: { createdAt: 'desc' }, take: 2 });
    if (jobs.length) {
        for (const job of jobs) {
            console.log('Job:', job.id, job.status, 'Result Length:', job.result ? (Array.isArray(job.result) ? job.result.length : 'not array') : 'empty');
            if (Array.isArray(job.result) && job.result.length > 0) {
                console.log('Sample result:', JSON.stringify(job.result[0]).substring(0, 100));
            }
        }
    }

    const settings = await prisma.searchSetting.findMany({ orderBy: { createdAt: 'desc' }, take: 2 });
    if (settings.length) {
        for (const setting of settings) {
            console.log('Setting:', setting.id, setting.createdAt, 'Results Count:', setting.results ? (Array.isArray(setting.results) ? setting.results.length : 'not array') : 'empty');
            if (Array.isArray(setting.results) && setting.results.length > 0) {
                console.log('Sample setting result:', JSON.stringify(setting.results[0]).substring(0, 100));
            }
        }
    }
}
main().catch(console.error).finally(() => prisma.$disconnect());
