import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const jobs = await prisma.searchJob.findMany({
            orderBy: { createdAt: 'desc' },
            take: 5,
            select: { id: true, status: true, createdAt: true }
        });

        const latestCompleted = await prisma.searchJob.findFirst({
            where: { status: 'COMPLETED' },
            orderBy: { updatedAt: 'desc' }
        });

        let latestResultCount = -1;
        if (latestCompleted && latestCompleted.result) {
            const resArr = latestCompleted.result as any[];
            latestResultCount = Array.isArray(resArr) ? resArr.length : -2;
        }

        return NextResponse.json({
            success: true,
            jobs,
            latestCompletedInfo: {
                id: latestCompleted?.id,
                count: latestResultCount
            }
        });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
