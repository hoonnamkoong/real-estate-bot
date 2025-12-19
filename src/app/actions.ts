'use server';

import { naverLand, SearchCriteria } from '@/services/naverLand';
import { prisma } from '@/lib/prisma'; // Need to create this if not exists, or use directly
import { FilterValues } from '@/components/Search/FilterForm';
import { Property } from '@/components/Property/ListingTable';

export async function searchProperties(data: FilterValues): Promise<Property[]> {
    // 1. Save Settings to DB (Async, don't block)
    try {
        // Ideally use real Prisma client
        // await prisma.searchSetting.create({ ... })
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
    const filtered = results.filter((item: any) => {
        // Filter by Price (item._rawPrice is Man-won, data.priceMax is Eok)
        if (data.priceMax && item._rawPrice > data.priceMax * 10000) return false;

        // Filter by Area
        if (data.areaMin && item.area.m2 < data.areaMin) return false;

        return true;
    });

    return filtered;
}

export async function updatePropertyNote(id: string, note: string) {
    // Save note to DB
    console.log(`Saving note for ${id}: ${note}`);
}
