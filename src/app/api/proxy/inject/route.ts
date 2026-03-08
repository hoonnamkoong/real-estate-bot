import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // Find latest setting to use its ID 
        const setting = await prisma.searchSetting.findFirst({ orderBy: { updatedAt: 'desc' } });
        if (!setting) return NextResponse.json({ error: 'no setting' });

        const job = await prisma.searchJob.create({
            data: {
                params: {
                    urls: ['https://new.land.naver.com/api/articles?cortarNo=1171010300&rletTpCd=APT:ABYG:JGC&tradTpCd=A1&page=1&priceMax=200000&areaMin=120&tag=FOURROOM'],
                    triggeredBy: 'test_pc_api'
                },
                status: 'PENDING'
            }
        });

        const apiKey = process.env.JOIN_API_KEY || 'f78d04c55f3c4d378233c629a08cc669';
        const deviceId = process.env.JOIN_DEVICE_ID || '2914080424af4b78acab862f02787791';
        const webhookUrl = `https://joinjoaomgcd.appspot.com/_ah/api/messaging/v1/sendPush?apikey=${apiKey}&text=run_proxy&deviceId=${deviceId}`;

        console.log(`[inject] Triggering Join Webhook (Device: ${deviceId})...`);
        fetch(webhookUrl).then(res => {
            console.log(`[inject] Join Webhook response: ${res.status} ${res.statusText}`);
        }).catch(e => console.error('[inject] Join Webhook failed:', e));

        return NextResponse.json({ success: true, job });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
