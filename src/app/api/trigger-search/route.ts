import { NextResponse } from 'next/server';
import { naverLand, SearchCriteria } from '@/services/naverLand';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * POST /api/trigger-search
 * Called by Android Tasker on schedule.
 * Creates a SearchJob using the last saved settings, then returns immediately.
 * The Android proxy app picks up the job and processes it.
 * After completion, /api/proxy/complete sends the Telegram notification.
 */
export async function POST(request: Request) {
    try {
        logger.info('TriggerSearch', 'Scheduled trigger received from Tasker');

        // Load last search settings from DB
        const lastSetting = await prisma.searchSetting.findFirst({
            orderBy: { updatedAt: 'desc' }
        });

        if (!lastSetting) {
            logger.warn('TriggerSearch', 'No SearchSetting found in database');
            return NextResponse.json({ success: false, message: 'No settings saved yet. Please search once from the web UI first.' }, { status: 404 });
        }

        const regions = lastSetting.regions ? lastSetting.regions.split(',') : ['songpa'];
        const cortarNos = await Promise.all(regions.map((r: string) => naverLand.getRegionCode(r)));

        const criteria: SearchCriteria = {
            tradeType: (lastSetting.type as any) || 'A1',
            priceMax: lastSetting.priceMax ? lastSetting.priceMax * 10000 : undefined,
            areaMin: lastSetting.areaMin ?? undefined,
            roomCount: lastSetting.roomCount ?? undefined,
        };

        const urls = naverLand.generateProxyUrls(cortarNos, criteria);

        const job = await prisma.searchJob.create({
            data: {
                params: { cortarNos, criteria, urls, triggeredBy: 'tasker-schedule' } as any,
                status: 'PENDING'
            }
        });

        logger.info('TriggerSearch', `Created SearchJob ${job.id} with ${urls.length} URLs`);

        return NextResponse.json({ success: true, jobId: job.id, urlCount: urls.length });

    } catch (error: any) {
        logger.error('TriggerSearch', 'Failed to create search job', { message: error.message });
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

// Also allow GET for simple trigger (easier to use with Tasker)
export async function GET(request: Request) {
    return POST(request);
}
