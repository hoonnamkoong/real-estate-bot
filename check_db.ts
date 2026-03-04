import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    console.log('--- LATEST 5 JOBS ---');
    const jobs = await prisma.searchJob.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5
    });
    console.log(JSON.stringify(jobs.map(j => ({ id: j.id, status: j.status, createdAt: j.createdAt, paramsLength: JSON.stringify(j.params).length })), null, 2));

    console.log('--- LATEST 5 SETTINGS ---');
    const settings = await prisma.searchSetting.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5
    });
    console.log(JSON.stringify(settings.map(s => ({
        id: s.id,
        regions: s.regions,
        createdAt: s.createdAt,
        resultsCount: s.results ? (s.results as any[]).length : 0
    })), null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
