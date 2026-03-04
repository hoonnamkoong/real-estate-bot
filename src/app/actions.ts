'use server';

import { naverLand, SearchCriteria } from '@/services/naverLand';
import { scrapeNaverProperties } from '@/services/naverLandScraper';
import { telegram } from '@/lib/telegram';
import { prisma } from '@/lib/prisma';
import { FilterValues } from '@/components/Search/FilterForm';
import { Property } from '@/components/Property/ListingTable';

export async function searchProperties(data: FilterValues): Promise<Property[]> {
    try {
        console.log(`[searchProperties] Starting search for: ${JSON.stringify(data)}`);

        // 1. Resolve Regions
        const regions = data.regions || [];
        if (regions.length === 0) return [];

        console.log(`[searchProperties] Resolving region codes for: ${regions}`);
        const cortarNos = await Promise.all(regions.map(r => naverLand.getRegionCode(r)));
        console.log(`[searchProperties] Resolved codes: ${cortarNos}`);

        // 2. Build criteria (priceMax in Naver units = 만원 * 100 = 억원 * 10000 / 100 = ...)
        // Naver shows priceMax in "만원" in URL (g=200000 means 20억원)
        const priceMaxManWon = (data.priceMax || 0) * 10000;
        const criteria: SearchCriteria = {
            tradeType: data.tradeType as any,
            priceMax: priceMaxManWon > 0 ? priceMaxManWon : undefined,
            areaMin: data.areaMin || undefined,
            roomCount: data.roomCount || undefined,
        };

        // 3. Use Playwright scraper to directly fetch Naver listings
        console.log(`[searchProperties] Launching Playwright scraper...`);
        const scraped = await scrapeNaverProperties(cortarNos, criteria);
        console.log(`[searchProperties] Scraper returned ${scraped.length} properties`);

        // 4. Map to Property format
        const results: Property[] = scraped.map(item => ({
            id: item.id,
            name: item.name,
            dongName: item.dongName,
            price: item.price,
            area: item.area,
            link: item.link,
            tradeType: item.tradeType,
        } as Property));

        // 5. Remove duplicates, sort by dong
        const uniqueMap = new Map(results.map(p => [p.id, p]));
        let filtered = Array.from(uniqueMap.values());

        // Sort by dongName
        filtered.sort((a, b) => {
            if (!a.dongName || !b.dongName) return 0;
            return a.dongName.localeCompare(b.dongName, 'ko');
        });

        console.log(`[searchProperties] Final result: ${filtered.length} items`);

        // 6. Async: Save snapshot & send Telegram
        (async () => {
            try {
                await prisma.searchSetting.create({
                    data: {
                        regions: data.regions ? data.regions.join(',') : '',
                        type: data.tradeType,
                        priceMax: data.priceMax || null,
                        areaMin: data.areaMin || null,
                        areaMax: null,
                        roomCount: data.roomCount || null,
                        results: filtered as any
                    } as any
                });
            } catch (e) {
                console.error('Non-critical DB save failure:', e);
            }

            try {
                if (filtered.length === 0) {
                    await telegram.sendMessage(`📉 **[부동산 봇]**\n조건에 맞는 매물이 없습니다.\n지정된 구: ${data.regions.join(', ')}`);
                    return;
                }

                const header = `🏘 **[부동산 봇] 검색 결과 (${filtered.length}건)**\n조건: ${data.regions.join(', ')} ${data.priceMax}억 이하\n\n`;
                let message = header;
                const messages = [];

                for (const item of filtered) {
                    const priceEok = Math.floor(item.price / 10000);
                    const priceMan = item.price % 10000;
                    const priceStr = priceEok > 0 ? `${priceEok}억` + (priceMan ? ` ${priceMan}` : '') : `${priceMan}만`;
                    const line = `🔹 <a href="${item.link}">${item.name}</a>\n   💰 ${priceStr} | ${item.area?.pyeong || '-'}평\n\n`;
                    if (message.length + line.length > 3500) {
                        messages.push(message);
                        message = `(이어서)\n\n${line}`;
                    } else {
                        message += line;
                    }
                }
                messages.push(message);
                for (const msg of messages) {
                    await telegram.sendMessage(msg, 'HTML');
                }
            } catch (e) {
                console.error('Failed to send telegram:', e);
            }
        })();

        return filtered;

    } catch (error: any) {
        console.error('[searchProperties] UNHANDLED ERROR:', error);
        return [{
            id: 'ERROR',
            name: `[오류] 검색 중 문제가 발생했습니다: ${error.message}`,
            price: 0,
            area: { m2: 0, pyeong: 0 },
            link: '#',
            dongName: '시스템',
        } as any];
    }
}

export async function updatePropertyNote(id: string, note: string) {
    try {
        const latestSetting = await prisma.searchSetting.findFirst({
            orderBy: { updatedAt: 'desc' }
        });

        if (!latestSetting) throw new Error('No SearchSetting found');
        const results = ((latestSetting as any).results as Property[]) || [];

        const newResults = results.map(item =>
            item.id === id ? { ...item, note } : item
        );

        await prisma.searchSetting.update({
            where: { id: latestSetting.id },
            data: { results: newResults as any }
        });

        return true;
    } catch (e) {
        console.error('[updatePropertyNote] FAILED', e);
        throw e;
    }
}

export async function getRegionPointCount(region: string): Promise<{ code: string; count: number }> {
    const code = await naverLand.getRegionCode(region);
    return { code, count: 1 };
}

export async function searchPropertiesChunk(data: FilterValues, regionCode: string, startIndex: number, endIndex: number): Promise<Property[]> {
    return searchProperties({ ...data, regions: ['songpa'] });
}
