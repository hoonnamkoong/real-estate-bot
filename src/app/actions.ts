'use server';

import { naverLand, SearchCriteria } from '@/services/naverLand';
import { telegram } from '@/lib/telegram';
import { prisma } from '@/lib/prisma'; // Need to create this if not exists, or use directly
import { FilterValues } from '@/components/Search/FilterForm';
import { Property } from '@/components/Property/ListingTable';

export async function searchProperties(data: FilterValues): Promise<Property[]> {
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

    const cortarNos = await Promise.all(regions.map(r => naverLand.getRegionCode(r)));

    // 3. Fetch from Naver (Parallel)
    // Input priceMax is in Eok (e.g. 30), Naver uses Man-won (e.g. 300000) ?? 
    // Wait, Naver API usually takes Man-won or specific ranges.
    // Actually, let's verify if Naver supports price filtering in API directly.
    // If not, we filter client side. But assuming we pass it or filter later:
    const priceMaxManWon = data.priceMax * 10000;

    const criteria: SearchCriteria = {
        tradeType: data.tradeType as any,
        priceMax: priceMaxManWon,
        areaMin: data.areaMin,
        roomCount: data.roomCount,
    };

    const resultsArrays = await Promise.all(
        cortarNos.map(code => naverLand.getArticleList(code, criteria))
    );

    const results = resultsArrays.flat();

    // 4. Client-side Filtering (Refine) because API filters might be limited
    // Example: Filter by Min Households if data available, or Price Max
    // Ensure accurate type conversion for filtering
    const filtered = results.filter((item: any) => {
        // Filter by Price (item._rawPrice is Man-won, data.priceMax is Eok)
        // Ensure inputs are numbers
        const itemPrice = Number(item._rawPrice);
        const maxPrice = data.priceMax ? data.priceMax * 10000 : Infinity;

        if (data.priceMax && itemPrice > maxPrice) return false;

        // Filter by Area
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
                    results: filtered as any // Save the results snapshot
                } as any
            });
            console.log(`Saved search results snapshot with ID: ${savedSettings.id}`);

            if (filtered.length === 0) {
                await telegram.sendMessage(`[부동산 봇] 검색 결과 없음\n조건: ${data.regions.join(',')} ${data.priceMax ? `~${data.priceMax}억` : ''}`);
                return;
            }

            const header = `[부동산 봇] 검색 결과 (${filtered.length}건)\n조건: ${data.regions.join(',')} ${data.priceMax}억 이하\n\n`;
            let message = header;
            const messages = [];

            for (const item of filtered) {
                // Name | Price | Link
                const line = `▪ ${item.name} (${item.price}만원)\n🔗 ${item.link}\n\n`;
                if (message.length + line.length > 2000) {
                    messages.push(message);
                    message = `(이어서)\n\n${line}`;
                } else {
                    message += line;
                }
            }
            messages.push(message);

            for (const msg of messages) {
                await telegram.sendMessage(msg);
            }
        } catch (e) {
            console.error('Failed to send telegram or save results', e);
        }
    })();

    return filtered;
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
