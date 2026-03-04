import { chromium } from 'playwright';
import { SearchCriteria } from './naverLand';

const REGION_COORDS: Record<string, { lat: number, lon: number, dongCortarNo?: string }> = {
    '1168000000': { lat: 37.514, lon: 127.047 },  // Gangnam
    '1165000000': { lat: 37.476, lon: 127.018 },  // Seocho
    '1171000000': { lat: 37.515, lon: 127.115 },  // Songpa
    '1117000000': { lat: 37.535, lon: 126.989 },  // Yongsan
    '1120000000': { lat: 37.550, lon: 127.038 },  // Seongdong
    '1144000000': { lat: 37.557, lon: 126.921 },  // Mapo
    '1147000000': { lat: 37.520, lon: 126.867 },  // Yangcheon
    '1156000000': { lat: 37.524, lon: 126.896 },  // Yeongdeungpo
    '1174000000': { lat: 37.550, lon: 127.140 },  // Gangdong
    '1111000000': { lat: 37.573, lon: 126.979 },  // Jongno
    '1114000000': { lat: 37.560, lon: 126.998 },  // Jung-gu
    '1123000000': { lat: 37.579, lon: 127.049 },  // Dongdaemun
    '1126000000': { lat: 37.598, lon: 127.086 },  // Jungnang
    '1129000000': { lat: 37.607, lon: 127.017 },  // Seongbuk
    '1132000000': { lat: 37.637, lon: 127.025 },  // Gangbuk
    '1138000000': { lat: 37.668, lon: 127.046 },  // Dobong
    '1135000000': { lat: 37.655, lon: 127.077 },  // Nowon
    '1141000000': { lat: 37.619, lon: 126.921 },  // Eunpyeong
    '1153000000': { lat: 37.495, lon: 126.855 },  // Guro
    '1159000000': { lat: 37.500, lon: 126.945 },  // Dongjak
    '1162000000': { lat: 37.481, lon: 126.953 },  // Gwanak
    '1150000000': { lat: 37.553, lon: 126.850 },  // Gangseo
    '1154000000': { lat: 37.456, lon: 126.900 },  // Geumcheon
};

export interface ScrapedProperty {
    id: string;
    name: string;
    dongName: string;
    price: number;
    area: { m2: number; pyeong: number };
    link: string;
    rooms?: number;
    complexNo?: string;
    tradeType: string;
}

export async function scrapeNaverProperties(
    cortarNos: string[],
    criteria: SearchCriteria
): Promise<ScrapedProperty[]> {
    const browser = await chromium.launch({ headless: true });
    const allProperties: ScrapedProperty[] = [];

    try {
        for (const cortarNo of cortarNos) {
            const center = REGION_COORDS[cortarNo] || { lat: 37.514, lon: 127.047 };

            // Build the Naver Land PC URL with all filters
            const params = new URLSearchParams();
            params.set('ms', `${center.lat},${center.lon},16`);
            params.set('a', 'APT:PRE:ABYG:JGC');
            params.set('b', criteria.tradeType || 'A1');
            params.set('e', 'RETAIL');
            if (criteria.priceMax) params.set('g', String(Math.floor(criteria.priceMax / 100)));
            if (criteria.areaMin) params.set('h', String(criteria.areaMin));
            if (criteria.roomCount && criteria.roomCount >= 4) params.set('q', 'FOURROOM');

            const naverUrl = `https://new.land.naver.com/complexes?${params.toString()}`;

            const context = await browser.newContext({
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                locale: 'ko-KR',
                extraHTTPHeaders: {
                    'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
                }
            });

            const page = await context.newPage();
            const capturedMarkers: any[] = [];

            // Intercept single-markers API to grab property data
            page.on('response', async (response) => {
                const url = response.url();
                if (url.includes('single-markers') && response.status() === 200) {
                    try {
                        const data = await response.json();
                        if (Array.isArray(data)) {
                            capturedMarkers.push(...data);
                        }
                    } catch (_) { }
                }
            });

            try {
                await page.goto(naverUrl, { waitUntil: 'networkidle', timeout: 25000 });
                await page.waitForTimeout(3000);
            } catch (e) {
                console.error(`Goto failed for ${cortarNo}:`, e);
            }

            // Map captured markers to ScrapedProperty
            for (const marker of capturedMarkers) {
                const complexNo = marker.complexNo || marker.markerId || '';
                const price = marker.dealPrice || marker.leasePrice || marker.rentPrice || 0;
                const area = marker.area1 || marker.areaSize || 0;
                const priceMwon = typeof price === 'number' ? price : parseFloat(price) || 0;
                const areaM2 = typeof area === 'number' ? area : parseFloat(area) || 0;

                if (!complexNo || priceMwon === 0) continue;

                // Apply client-side filters as well (belt and suspenders)
                if (criteria.priceMax && priceMwon > criteria.priceMax) continue;
                if (criteria.areaMin && areaM2 < criteria.areaMin) continue;

                allProperties.push({
                    id: String(complexNo),
                    name: marker.complexName || marker.name || '(이름 없음)',
                    dongName: marker.cortarAddress || marker.address || '',
                    price: priceMwon,
                    area: {
                        m2: areaM2,
                        pyeong: Math.round(areaM2 / 3.3058)
                    },
                    link: `https://new.land.naver.com/complexes/${complexNo}`,
                    complexNo,
                    tradeType: criteria.tradeType || 'A1',
                });
            }

            await context.close();
        }
    } finally {
        await browser.close();
    }

    // Remove duplicate complex IDs (keep first / lowest price)
    const seen = new Set<string>();
    const unique = allProperties.filter(p => {
        if (seen.has(p.id)) return false;
        seen.add(p.id);
        return true;
    });

    return unique;
}
