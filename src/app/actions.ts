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
            minHouseholds: data.minHouseholds || undefined,
        };

        // 3. Parallel Search across points to beat 10s timeout
        const fetchStart = Date.now();

        // Timeout promise: Return empty (or error info) after 100 seconds
        const timeoutPromise = new Promise<Property[]>((_, reject) =>
            setTimeout(() => reject(new Error('네이버 검색 서버 응답 지연 (100초 초과)')), 100000)
        );

        // 3. Parallel Search across points to beat 10s timeout
        const searchPromise = (async () => {
            console.log(`[searchProperties] Creating SearchJob for APK Proxy`);
            const urls = await naverLand.generateProxyUrls(cortarNos, criteria);
            console.log(`[searchProperties] Generated ${urls.length} URLs for ${cortarNos.length} regions`);

            // 1. CHECK FOR RECENT IDENTICAL JOB (DEDUPLICATION)
            // Check if there's a PENDING job within the last 30 seconds with same parameters
            const thirtySecondsAgo = new Date(Date.now() - 30 * 1000);
            const existingJob = await prisma.searchJob.findFirst({
                where: {
                    status: 'PENDING',
                    createdAt: { gte: thirtySecondsAgo },
                }
            });

            let job;
            if (existingJob && JSON.stringify((existingJob.params as any)?.urls) === JSON.stringify(urls)) {
                console.log(`[searchProperties] Reusing existing PENDING Job ${existingJob.id} instead of creating duplicate.`);
                job = existingJob;
            } else {
                job = await prisma.searchJob.create({
                    data: {
                        params: { cortarNos, criteria, urls } as any,
                        status: 'PENDING'
                    }
                });
                console.log(`[searchProperties] Created Job ${job.id}, triggering phone via Join Webhook...`);

                // 3. Trigger Android Phone via Join Webhook ONLY for new jobs
                const apiKey = process.env.JOIN_API_KEY || 'f78d04c55f3c4d378233c629a08cc669';
                const deviceId = process.env.JOIN_DEVICE_ID || '2914080424af4b78acab862f02787791';
                const webhookUrl = `https://joinjoaomgcd.appspot.com/_ah/api/messaging/v1/sendPush?apikey=${apiKey}&deviceId=${deviceId}&text=run_proxy`;

                console.log(`[searchProperties] Triggering Join Webhook (Device: ${deviceId})...`);
                fetch(webhookUrl, { cache: 'no-store' })
                    .then(res => {
                        console.log(`[searchProperties] Join Webhook response: ${res.status} ${res.statusText}`);
                    })
                    .catch(e => console.error('[searchProperties] Join Webhook failed:', e));
            }

            // 4. Give the phone 5 seconds to turn on screen and fully launch the proxy app
            // User Tasker has 5s wait at the end, so we align with that. 
            await new Promise(resolve => setTimeout(resolve, 5000));
            console.log(`[searchProperties] Finished 5s wait. Start polling Job ${job.id} for results...`);

            // 5. Poll for completion (up to 90.0s)
            const proxyStart = Date.now();
            while (Date.now() - proxyStart < 90000) {
                const checkJob = await prisma.searchJob.findUnique({
                    where: { id: job.id }
                });
                if (checkJob && checkJob.status === 'COMPLETED') {
                    const rawItems = (checkJob.result as any[]) || [];
                    console.log(`[searchProperties] Job ${job.id} completed! raw=${rawItems.length}`);
                    // Map raw Naver API format (spc1, prc, atclNo) → Property format (area, price, id)
                    const mapped = naverLand.mapNaverItemsToProperties(rawItems, (checkJob.params as any).criteria);
                    console.log(`[searchProperties] Mapped to ${mapped.length} Property items`);
                    return mapped;
                }
                if (checkJob?.status === 'ERROR') {
                    throw new Error('안드로이드 프록시 측 검색 오류 발생');
                }
                await new Promise(resolve => setTimeout(resolve, 600)); // Poll every 600ms
            }
            // If loop finishes without status COMPLETED, try to return partial results if available
            const finalCheck = await prisma.searchJob.findUnique({ where: { id: job.id } });
            const partialItems = (finalCheck?.result as any[]) || [];
            if (partialItems.length > 0) {
                console.log(`[searchProperties] Returning ${partialItems.length} partial articles for Job ${job.id}`);
                return naverLand.mapNaverItemsToProperties(partialItems, (finalCheck?.params as any)?.criteria || criteria);
            }
            throw new Error('안드로이드 홈서버 앱이 멈춰있거나 오프라인입니다.');
        })();

        let results: Property[] = [];
        let isSuccess = false;
        try {
            results = await Promise.race([searchPromise, timeoutPromise]);
            isSuccess = true;
        } catch (e: any) {
            console.warn(`[searchProperties] Timeout Handling: ${e.message}`);
            // Special: If we have a SearchJob ID, try one last time to get whatever was stored
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

        // Webhook trigger moved to end of async block to allow 5s delay

        // Remove duplicates safely
        const uniqueItems = Array.from(new Map(results.map(item => [((item as any).atclNo || item.id), item])).values());
        results = uniqueItems;

        // Special handling for Client-side chunking:
        // If results are incomplete or if it's a "heavy" region, we might want to tell the client to do more.
        // For now, we return what we found within the 5.5s limit.

        // 4. No client-side filtering — Naver already filtered by prc and spc1 in the URL
        // Just pass through all mapped results
        console.log(`[searchProperties] Total results from Naver proxy: ${results.length}`);

        const validGuPrefixes = cortarNos.map(code => code.substring(0, 5));

        const filtered = results.filter((item: any) => {
            if (item?.id === 'TIMEOUT_ERR') return true;
            if (!item) return false;
            // Filter out properties from adjacent districts that were caught in the wider BBox
            if (item.cortarNo && !validGuPrefixes.includes(String(item.cortarNo).substring(0, 5))) {
                return false;
            }
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
                        results: filtered as any
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

            // Delayed Webhook (5 seconds after UI renders) - REMOVED redundant trigger
            /*
            if (isSuccess) {
                try {
                ...
            }
            */
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
