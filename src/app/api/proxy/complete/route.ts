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

        // Two-Step Proxy Architecture Step 1 Intercept:
        // If result contains `complexList`, it's the Step 1 response from PC API
        if (Array.isArray(result) && result[0] && Array.isArray(result[0].complexList)) {
            const complexNos = result[0].complexList.map((c: any) => c.complexNo);
            const paramsData = jobExists.params as any;
            const criteria = paramsData?.criteria || {};

            // Build Step 2 URLs for each complex
            const step2Urls = complexNos.map((no: string) => {
                const searchParams = new URLSearchParams();
                searchParams.append('rletTpCd', 'APT:ABYG:JGC');
                searchParams.append('tradTpCd', criteria.tradeType || 'A1');
                searchParams.append('page', '1');

                if (criteria.priceMax) searchParams.append('priceMax', String(criteria.priceMax));
                if (criteria.areaMin) searchParams.append('areaMin', String(Math.floor(criteria.areaMin)));
                if (criteria.areaMax) searchParams.append('areaMax', String(Math.ceil(criteria.areaMax)));
                if (criteria.roomCount && criteria.roomCount >= 4) searchParams.append('tag', 'FOURROOM');

                return `https://new.land.naver.com/api/articles/complex/${no}?${searchParams.toString()}`;
            });

            // Update Job with new URLs, keep PENDING state to force Proxy App's second loop
            await prisma.searchJob.update({
                where: { id: jobId },
                data: {
                    status: 'PENDING',
                    params: {
                        ...paramsData,
                        proxyRequest: { urls: step2Urls }
                    }
                }
            });

            // Re-trigger Android App
            if (process.env.JOIN_WEBHOOK_URL) {
                const triggerUrl = new URL(process.env.JOIN_WEBHOOK_URL);
                triggerUrl.searchParams.set('text', 'run_proxy');
                fetch(triggerUrl.toString()).catch(console.error);
            }

            return NextResponse.json({ success: true, message: 'Step 1 completed. Transformed to Step 2.' });
        }

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
