import { prisma } from '@/lib/prisma';
import { FilterValues } from '@/components/Search/FilterForm';
import { Property } from '@/components/Property/ListingTable';

export async function getLastSearchSetting(): Promise<{ settings: FilterValues, results: Property[] } | null> {
    try {
        const lastRaw = await prisma.searchSetting.findFirst({
            orderBy: { updatedAt: 'desc' }
        });

        if (!lastRaw) {
            return {
                settings: {
                    regions: ['songpa'],
                    tradeType: 'A1',
                    priceMax: 20,
                    areaMin: 120,
                    roomCount: 4,
                    minHouseholds: 500
                },
                results: []
            };
        }

        const last = lastRaw as any;
        return {
            settings: {
                regions: last.regions ? last.regions.split(',') : ['songpa'],
                tradeType: last.type as any || 'A1',
                priceMax: last.priceMax ?? 20,
                areaMin: last.areaMin ?? 120,
                roomCount: last.roomCount ?? 4,
                minHouseholds: 500
            },
            results: (last.results as Property[]) || []
        };
    } catch (e) {
        console.error('Failed to fetch last setting - Returning Fallback for safety', e);
        return {
            settings: {
                regions: ['songpa'],
                tradeType: 'A1',
                priceMax: 20,
                areaMin: 120,
                roomCount: 4,
                minHouseholds: 500
            },
            results: []
        };
    }
}
