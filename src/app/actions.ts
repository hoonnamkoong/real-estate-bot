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

        // 3. Parallel Search across points to beat 10s timeout
        const priceMaxManWon = (data.priceMax || 0) * 10000;
        const criteria: SearchCriteria = {
            tradeType: data.tradeType as any,
            priceMax: priceMaxManWon > 0 ? priceMaxManWon : undefined,
            areaMin: data.areaMin || undefined,
            roomCount: data.roomCount || undefined,
        };

        // 3. Parallel Search across points to beat 10s timeout
        const fetchStart = Date.now();

        // Timeout promise: Return empty (or error info) after 13.5 seconds
        const timeoutPromise = new Promise<Property[]>((_, reject) =>
            setTimeout(() => reject(new Error('네이버 검색 서버 응답 지연 (50초 초과)')), 50000)
        );

        // Vercel Serverless maximum duration can be set if needed
        const searchPromise = (async () => {
            console.log(`[searchProperties] Creating SearchJob for APK Proxy`);
            const urls = naverLand.generateProxyUrls(cortarNos, criteria);
            const job = await prisma.searchJob.create({
                data: {
                    params: { cortarNos, criteria, urls } as any,
                    status: 'PENDING'
                }
            });
            console.log(`[searchProperties] Created Job ${job.id}, waiting for APK Proxy...`);

            // Poll for completion (up to 12.0s to stay mostly within Vercel execution limits but give max time)
            const proxyStart = Date.now();
            while (Date.now() - proxyStart < 48000) {
                const check = await prisma.searchJob.findUnique({ where: { id: job.id } });
                if (check?.status === 'COMPLETED') {
                    const rawItems = (check.result as any[]) || [];
                    console.log(`[searchProperties] Job ${job.id} completed! raw=${rawItems.length}`);
                    // Map raw Naver API format (spc1, prc, atclNo) → Property format (area, price, id)
                    const mapped = naverLand.mapNaverItemsToProperties(rawItems);
                    console.log(`[searchProperties] Mapped to ${mapped.length} Property items`);
                    return mapped;
                }
                if (check?.status === 'ERROR') {
                    throw new Error('안드로이드 프록시 측 검색 오류 발생');
                }
                await new Promise(resolve => setTimeout(resolve, 600)); // Poll every 600ms
            }
            throw new Error('안드로이드 홈서버 앱이 멈춰있거나 오프라인입니다.');
        })();

        let results: Property[] = [];
        try {
            results = await Promise.race([searchPromise, timeoutPromise]);
        } catch (e: any) {
            console.warn(`[searchProperties] Timeout or Error: ${e.message}`);
            // Return a special debug item so we know it timed out
            results = [{
                id: 'TIMEOUT_ERR',
                name: `[서버 지연] 검색 시간이 너무 오래 걸려 중단되었습니다 (${e.message})`,
                price: 0,
                area: { m2: 0, pyeong: 0 },
                link: '#',
                dongName: '시스템',
                note: 'High' as any
            } as any];
        }

        // Remove duplicates safely
        const uniqueItems = Array.from(new Map(results.map(item => [((item as any).atclNo || item.id), item])).values());
        results = uniqueItems;

        // Special handling for Client-side chunking:
        // If results are incomplete or if it's a "heavy" region, we might want to tell the client to do more.
        // For now, we return what we found within the 5.5s limit.

        // 4. No client-side filtering — Naver already filtered by prc and spc1 in the URL
        // Just pass through all mapped results
        console.log(`[searchProperties] Total results from Naver proxy: ${results.length}`);
        const filtered = results.filter((item: any) => item && item.id !== 'TIMEOUT_ERR' ? true : item?.id === 'TIMEOUT_ERR');

    } else if (rawCount === 0) {
        filtered.unshift({
            id: 'DEBUG_ERROR',
            name: `[시스템 점검] 네이버 API에서 0건 리턴 (차단 가능성)`,
            price: 0,
            area: { m2: 0, pyeong: 0 },
            link: '#',
            dongName: '시스템',
            note: 'High' as any
        } as any);
    }

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
