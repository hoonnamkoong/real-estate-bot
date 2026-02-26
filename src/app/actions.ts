'use server';

import { naverLand, SearchCriteria } from '@/services/naverLand';
import { telegram } from '@/lib/telegram';
import { prisma } from '@/lib/prisma'; // Need to create this if not exists, or use directly
import { FilterValues } from '@/components/Search/FilterForm';
import { Property } from '@/components/Property/ListingTable';

export async function searchProperties(data: FilterValues): Promise<Property[]> {
    try {
        console.log(`[searchProperties] Starting search for: ${JSON.stringify(data)}`);

        // 1. Save Settings to DB (Async, don't block)
        try {
            await prisma.searchSetting.create({
                data: {
                    regions: data.regions ? data.regions.join(',') : '',
                    type: data.tradeType,
                    priceMax: data.priceMax || null,
                    areaMin: data.areaMin || null,
                    areaMax: null,
                    roomCount: data.roomCount || null,
                } as any
            });
        } catch (e) {
            console.error('Failed to save settings', e);
        }

        // 2. Resolve Regions (Support Multiple)
        const regions = data.regions || [];
        if (regions.length === 0) return [];

        console.log(`[searchProperties] Resolving region codes for: ${regions}`);
        const cortarNos = await Promise.all(regions.map(r => naverLand.getRegionCode(r)));
        console.log(`[searchProperties] Resolved codes: ${cortarNos}`);

        // 3. Fetch from Naver (Serial for Hobby, Parallel for Pro)
        const priceMaxManWon = (data.priceMax || 0) * 10000;
        const criteria: SearchCriteria = {
            tradeType: data.tradeType as any,
            priceMax: priceMaxManWon > 0 ? priceMaxManWon : undefined,
            areaMin: data.areaMin || undefined,
            roomCount: data.roomCount || undefined,
        };

        // Critical: For Vercel Hobby 10s limit, we take ONLY THE FIRST 1 point for Songpa
        const isSongpa = regions.includes('songpa');
        const searchCodes = isSongpa ? [cortarNos[0]] : cortarNos;

        const fetchStart = Date.now();
        const resultsArrays = [];
        for (const code of searchCodes) {
            const subStart = Date.now();
            const list = await naverLand.getArticleList(code, criteria, true);
            console.log(`[searchProperties] Code ${code} fetch duration: ${Date.now() - subStart}ms, count=${list.length}`);
            resultsArrays.push(list);
            if (isSongpa) break; // Aggressive skip to save time
        }

        const results = resultsArrays.flat();
        console.log(`[searchProperties] Total fetch completed in ${Date.now() - fetchStart}ms, total articles: ${results.length}`);

        // Special handling for Client-side chunking:
        // If results are incomplete or if it's a "heavy" region, we might want to tell the client to do more.
        // For now, we return what we found within the 5.5s limit.

        // 4. Client-side Filtering (Refine)
        const filtered = results.filter((item: any) => {
            if (!item || !item.area) return false;

            const itemPrice = Number(item._rawPrice);
            const maxPrice = data.priceMax ? data.priceMax * 10000 : Infinity;

            if (data.priceMax && itemPrice > maxPrice) return false;
            if (data.areaMin && item.area.m2 < data.areaMin) return false;

            return true;
        });

        // 5. Send Telegram Notification (Async)
        (async () => {
            try {
                // Updated: Save results to DB
                const savedSettings = await prisma.searchSetting.create({
                    data: {
                        regions: data.regions ? data.regions.join(',') : '',
                        type: data.tradeType,
                        priceMax: data.priceMax || null,
                        areaMin: data.areaMin || null,
                        areaMax: null,
                        roomCount: data.roomCount || null,
                        results: filtered.map((a: any) => ({
                            id: String(a.atclNo),
                            name: a.atclNm || 'Unknown',
                            price: Number(a.prc) || 0,
                            area: {
                                m2: Number(a.spc1) || 0,
                                pyeong: Math.round((Number(a.spc1) || 0) * 0.3025 * 10) / 10
                            },
                            link: `https://fintech-api.land.naver.com/v1/ad/article/${a.atclNo}`,
                            dongName: a._dongName || '',
                            note: (a.note as any) || undefined
                        })) as any
                    } as any
                });
                console.log(`Saved search results snapshot with ID: ${savedSettings.id}`);
            } catch (e) {
                console.error('Non-critical DB save failure (Telegram/Snapshot):', e);
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

                    if (message.length + line.length > 3500) { // Telegram 4096 limit
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
                console.error('Failed to send telegram notification:', e);
            }
        })();

        return filtered;
    } catch (error: any) {
        console.error('[searchProperties] UNHANDLED ERROR:', error);
        // CRITICAL: Return empty array instead of throwing to prevent Next.js RSC crash (HTML error page)
        return [];
    }
}

export async function updatePropertyNote(id: string, note: string) {
    try {
        console.log(`[updatePropertyNote] Starting update for ID: ${id}, Note: ${note}`);

        // 1. Get the latest SearchSetting
        // Cast to any to bypass stale TS errors if client isn't updated
        const latestSetting = await prisma.searchSetting.findFirst({
            orderBy: { updatedAt: 'desc' }
        });

        if (!latestSetting) {
            console.error('[updatePropertyNote] No SearchSetting found in DB');
            throw new Error('No SearchSetting found - cannot update note');
        }

        if (!(latestSetting as any).results) {
            console.error('[updatePropertyNote] SearchSetting has no results field');
            // Initialize as empty array if missing
            (latestSetting as any).results = [];
        }

        // 2. Parse results
        const results = (latestSetting as any).results as Property[];

        let found = false;

        // 3. Find and update item
        const newResults = results.map((item) => {
            if (item.id === id) {
                found = true;
                return { ...item, note: note };
            }
            return item;
        });

        if (!found) {
            console.warn(`[updatePropertyNote] Item ID ${id} not found in current snapshot`);
        }

        // 4. Save back to DB
        await prisma.searchSetting.update({
            where: { id: latestSetting.id },
            data: { results: newResults as any }
        });

        console.log(`[updatePropertyNote] SUCCESS: Updated note for ${id} in setting ${latestSetting.id}`);
        return true;

    } catch (e) {
        console.error('[updatePropertyNote] FAILED to update property note', e);
        throw e; // Rethrow so frontend/Sentry catches it
    }
}

/**
 * Get Point Count for a Region (DEPRECATED - Returning 1 to disable client chunks)
 */
export async function getRegionPointCount(region: string): Promise<{ code: string; count: number }> {
    const code = await naverLand.getRegionCode(region);
    return { code, count: 1 };
}

export async function searchPropertiesChunk(data: FilterValues, regionCode: string, startIndex: number, endIndex: number): Promise<Property[]> {
    return searchProperties({ ...data, regions: ['songpa'] });
}
