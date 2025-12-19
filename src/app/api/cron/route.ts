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
        // const lastSetting = await prisma.searchSetting.findFirst({ orderBy: { updatedAt: 'desc' } });
        // Mock for now if no DB
        const lastSetting = {
            gu: 'gangnam',
            type: 'A1',
            priceMax: 300000,
        }; // Default fallback

        if (!lastSetting) {
            return NextResponse.json({ success: false, message: 'No settings found' });
        }

        // 2. Fetch Data
        const regionCode = await naverLand.getRegionCode(lastSetting.gu || 'gangnam');
        const criteria: SearchCriteria = {
            tradeType: (lastSetting.type as any) || 'A1',
            priceMax: lastSetting.priceMax,
        };

        const results = await naverLand.getArticleList(regionCode, criteria);

        // 3. Filter Top Results (e.g., top 5 cheapest or newest)
        const topListings = results.slice(0, 5); // Just top 5 for report

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
