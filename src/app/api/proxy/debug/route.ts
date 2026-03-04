import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const jobs = await prisma.searchJob.findMany({
            orderBy: { createdAt: 'desc' },
            take: 5,
            select: {
                id: true,
                status: true,
                createdAt: true,
                updatedAt: true,
            }
        });

        const settings = await prisma.searchSetting.findMany({
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: {
                id: true,
                createdAt: true,
            }
        });

        // For the latest completed job, get result length
        const latestCompleted = await prisma.searchJob.findFirst({
            where: { status: 'COMPLETED' },
            orderBy: { updatedAt: 'desc' },
            select: { id: true, updatedAt: true, result: true, params: true }
        });

        let latestResultCount = -1;
        let latestParams = null;
        if (latestCompleted && latestCompleted.result) {
            latestResultCount = Array.isArray(latestCompleted.result) ? latestCompleted.result.length : -2;
            latestParams = latestCompleted.params;
        }

        return NextResponse.json({
            success: true, jobs, settings, latestCompletedInfo: {
                id: latestCompleted?.id,
                updatedAt: latestCompleted?.updatedAt,
                count: latestResultCount,
                params: latestParams
            }
        });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
