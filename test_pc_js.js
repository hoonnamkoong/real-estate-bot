const { PrismaClient } = require('@prisma/client');
const fetch = require('node-fetch');
const prisma = new PrismaClient();

async function main() {
    try {
        const job = await prisma.searchJob.create({
            data: {
                params: {
                    urls: ['https://new.land.naver.com/api/articles?cortarNo=1171010300&rletTpCd=APT:ABYG:JGC&tradTpCd=A1&page=1&priceMax=200000&areaMin=120&tag=FOURROOM'],
                    triggeredBy: 'test_pc_api'
                },
                status: 'PENDING'
            }
        });
        console.log('Job created:', job.id);

        await fetch('https://joinjoaomgcd.appspot.com/_ah/api/messaging/v1/sendPush?apikey=f78d04c55f3c4d378233c629a08cc669&text=run_proxy&deviceId=2914080424af4b78acab862f02787791');
        console.log('Pinged phone.');
    } catch (e) {
        console.error('Error:', e);
    }
}
main().finally(() => process.exit(0));
