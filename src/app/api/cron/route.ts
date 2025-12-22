import { NextResponse } from 'next/server';
import { naverLand, SearchCriteria } from '@/services/naverLand';
import { telegram } from '@/lib/telegram';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic'; // Prevent static caching

export async function GET(request: Request) {
    // Authorization (Optional for Vercel Cron)
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    logger.info('CronJob', 'Starting Daily Report');

    try {
        // 1. Load Last Search Settings
        const lastSetting = await prisma.searchSetting.findFirst({ orderBy: { updatedAt: 'desc' } });

        if (!lastSetting) {
            return NextResponse.json({ success: false, message: 'No settings found' });
        }

        // 2. Fetch Data
        // Support multiple regions (comma separated)
        const regions = lastSetting.regions ? lastSetting.regions.split(',') : ['gangnam'];
        const cortarNos = await Promise.all(regions.map((r: string) => naverLand.getRegionCode(r)));

        const criteria: SearchCriteria = {
            tradeType: (lastSetting.type as any) || 'A1',
            priceMax: lastSetting.priceMax ? lastSetting.priceMax * 10000 : undefined, // Check unit!
            // Wait, schema stores Eok? Actions saves data.priceMax (Eok).
            // Request to Naver Services expects Man-won.
            // actions.ts saves "data.priceMax" (Eok, e.g. 20)
            // naverLand.ts expects Man-won for priceMax (e.g. 200000)
            // So here we multiply by 10000.

            areaMin: lastSetting.areaMin ?? undefined,
            roomCount: lastSetting.roomCount ?? undefined
        };

        const resultsArrays = await Promise.all(
            cortarNos.map((code: string) => naverLand.getArticleList(code, criteria))
        );
        const results = resultsArrays.flat();

        // Filter Logic (Same as actions.ts)
        const filtered = results.filter((item: any) => {
            if (criteria.priceMax && item._rawPrice > criteria.priceMax) return false;
            if (criteria.areaMin && item.area.m2 < criteria.areaMin) return false;
            return true;
        });

        // 3. Filter Top Results
        const topListings = filtered.slice(0, 10); // Top 10

        if (topListings.length === 0) {
            await telegram.sendMessage(`📉 **[부동산 봇]**\n조건에 맞는 매물이 없습니다.`);
            return NextResponse.json({ success: true, count: 0 });
        }

        // 4. Format Message
        let message = `🏘 **[부동산 봇] 오늘의 리포트**\n\n`;
        topListings.forEach((item: any) => {
            const priceEok = Math.floor(item.price / 10000);
            const priceMan = item.price % 10000;
            const priceStr = priceEok > 0 ? `${priceEok}억` + (priceMan ? ` ${priceMan}` : '') : `${priceMan}만`;

            message += `🔹 <a href="${item.link}">${item.name}</a>\n`;
            message += `   💰 ${priceStr} | ${item.area.pyeong}평\n\n`;
        });

        const reportLink = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        message += `👉 <a href="${reportLink}">웹에서 보기</a>`;

        // 5. Send Telegram
        await telegram.sendMessage(message, 'HTML');

        return NextResponse.json({ success: true, sent: topListings.length });

    } catch (error: any) {
        logger.error('CronJob', 'Execution Failed', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
