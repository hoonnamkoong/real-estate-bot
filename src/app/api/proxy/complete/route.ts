import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { naverLand } from '@/services/naverLand';
import { telegram } from '@/lib/telegram';

export const maxDuration = 45;

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { jobId, result, status } = body;

        if (!jobId) {
            return NextResponse.json({ success: false, error: 'jobId is required' }, { status: 400 });
        }

        const jobExists = await prisma.searchJob.findUnique({ where: { id: jobId } });
        if (!jobExists) return NextResponse.json({ success: false, error: 'job not found' }, { status: 404 });

        // Two-Step Proxy Architecture Step 1 Intercept has been removed.
        // We now use 1-Step PC BBox Grid API, which returns articleList directly.

        const job = await prisma.searchJob.update({
            where: { id: jobId },
            data: {
                status: status || 'COMPLETED',
                result: result || []
            }
        });

        // If this was a scheduled Tasker job, send Telegram notification
        const params = job.params as any;
        if (status === 'COMPLETED' && params?.triggeredBy === 'tasker-schedule' && Array.isArray(result) && result.length > 0) {
            try {
                const properties = naverLand.mapNaverItemsToProperties(result);
                const filtered = properties.filter((item: any) => {
                    if (!item?.area) return false;
                    const criteria = params.criteria || {};
                    if (criteria.priceMax && item.price > criteria.priceMax) return false;
                    if (criteria.areaMin && item.area.m2 < criteria.areaMin) return false;
                    return true;
                }).slice(0, 15);

                if (filtered.length === 0) {
                    await telegram.sendMessage(`📉 **[부동산 봇 자동검색]**\n조건에 맞는 매물이 없습니다.`);
                } else {
                    let message = `🏘 **[부동산 봇 자동검색] ${filtered.length}건**\n\n`;
                    for (const item of filtered) {
                        const priceEok = Math.floor(item.price / 10000);
                        const priceMan = item.price % 10000;
                        const priceStr = priceEok > 0 ? `${priceEok}억` + (priceMan ? ` ${priceMan}` : '') : `${priceMan}만`;
                        message += `🔹 <a href="${item.link}">${item.name}</a>\n`;
                        message += `   💰 ${priceStr} | ${item.area?.pyeong || '-'}평\n\n`;
                    }
                    message += `👉 <a href="https://real-estate-bot-eta.vercel.app">웹에서 전체 보기</a>`;
                    await telegram.sendMessage(message, 'HTML');
                }
            } catch (tgErr: any) {
                console.error('Telegram notification failed:', tgErr.message);
            }
        }

        return NextResponse.json({ success: true, job });
    } catch (error: any) {
        console.error('Error completing job:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
