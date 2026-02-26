import { NextResponse } from 'next/server';
import { naverLand, SearchCriteria } from '@/services/naverLand';
import { telegram } from '@/lib/telegram';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import dayjs from 'dayjs';

export const dynamic = 'force-dynamic'; // Prevent static caching

export async function GET(request: Request) {
    // Authorization (Optional for Vercel Cron)
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    logger.info('CronJob', 'Starting Daily Report Execution');

    try {
        // 1. Load Last Search Settings
        const lastSetting = await prisma.searchSetting.findFirst({ orderBy: { updatedAt: 'desc' } });

        if (!lastSetting) {
            logger.warn('CronJob', 'No SearchSetting found in database');
            return NextResponse.json({ success: false, message: 'No settings found' });
        }

        logger.info('CronJob', `Using settings: ${JSON.stringify(lastSetting)}`);

        // 2. Fetch Data
        const regions = lastSetting.regions ? lastSetting.regions.split(',') : ['songpa'];
        const cortarNos = await Promise.all(regions.map((r: string) => naverLand.getRegionCode(r)));

        logger.info('CronJob', `Resolved regions to CortarNos: ${cortarNos.join(', ')}`);

        const criteria: SearchCriteria = {
            tradeType: (lastSetting.type as any) || 'A1',
            priceMax: lastSetting.priceMax ? lastSetting.priceMax * 10000 : undefined,
            areaMin: lastSetting.areaMin ?? undefined,
            roomCount: lastSetting.roomCount ?? undefined
        };

        const resultsArrays = await Promise.all(
            cortarNos.map((code: string) => naverLand.getArticleList(code, criteria))
        );
        const results = resultsArrays.flat();

        // Filter Logic
        const filtered = results.filter((item: any) => {
            if (!item || !item.area) return false;
            const itemPrice = Number(item._rawPrice);
            if (criteria.priceMax && itemPrice > criteria.priceMax) return false;
            if (criteria.areaMin && item.area.m2 < criteria.areaMin) return false;
            return true;
        });

        logger.info('CronJob', `Found ${results.length} raw results, ${filtered.length} after filter`);

        // 3. Filter Top Results
        const topListings = filtered.slice(0, 15); // Show up to 15

        if (topListings.length === 0) {
            const regionNames = regions.join(', ');
            await telegram.sendMessage(`📉 **[부동산 봇]**\n오늘(${dayjs().format('MM/DD')})의 리포트: 조건에 맞는 매물이 없습니다.\n지정된 구: ${regionNames}`);
            return NextResponse.json({ success: true, count: 0 });
        }

        // 4. Format Message
        let message = `🏘 **[부동산 봇] 오늘의 리포트 (${dayjs().format('MM/DD')})**\n\n`;
        topListings.forEach((item: any) => {
            const priceEok = Math.floor(item.price / 10000);
            const priceMan = item.price % 10000;
            const priceStr = priceEok > 0 ? `${priceEok}억` + (priceMan ? ` ${priceMan}` : '') : `${priceMan}만`;

            message += `🔹 <a href="${item.link}">${item.name}</a>\n`;
            message += `   💰 ${priceStr} | ${item.area?.pyeong || '-'}평\n\n`;
        });

        const reportLink = process.env.NEXT_PUBLIC_APP_URL || 'https://real-estate-bot-eta.vercel.app';
        message += `👉 <a href="${reportLink}">웹에서 전체 보기</a>`;

        // 5. Send Telegram
        await telegram.sendMessage(message, 'HTML');
        logger.info('CronJob', 'Daily Report Sent Successfully');

        return NextResponse.json({ success: true, sent: topListings.length });

    } catch (error: any) {
        logger.error('CronJob', 'CRITICAL FAILURE', { message: error.message, stack: error.stack });
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
