import { SearchCriteria } from './naverLand';

// BBox coverage for each gu (구) - adjusted to cover the entire district
const REGION_BBOX: Record<string, { centerLat: number, centerLon: number, bbox: [number, number, number, number] }> = {
    '1168000000': { centerLat: 37.514, centerLon: 127.047, bbox: [127.019, 37.498, 127.080, 37.540] },  // Gangnam
    '1165000000': { centerLat: 37.476, centerLon: 127.018, bbox: [126.980, 37.456, 127.060, 37.510] },  // Seocho
    '1171000000': { centerLat: 37.515, centerLon: 127.115, bbox: [127.080, 37.490, 127.160, 37.545] },  // Songpa
    '1117000000': { centerLat: 37.535, centerLon: 126.989, bbox: [126.960, 37.514, 127.020, 37.560] },  // Yongsan
    '1120000000': { centerLat: 37.550, centerLon: 127.038, bbox: [127.005, 37.530, 127.080, 37.575] },  // Seongdong
    '1144000000': { centerLat: 37.557, centerLon: 126.921, bbox: [126.880, 37.535, 126.970, 37.590] },  // Mapo
    '1147000000': { centerLat: 37.520, centerLon: 126.867, bbox: [126.830, 37.495, 126.910, 37.545] },  // Yangcheon
    '1156000000': { centerLat: 37.524, centerLon: 126.896, bbox: [126.856, 37.500, 126.940, 37.548] },  // Yeongdeungpo
    '1174000000': { centerLat: 37.550, centerLon: 127.140, bbox: [127.105, 37.525, 127.185, 37.574] },  // Gangdong
    '1111000000': { centerLat: 37.573, centerLon: 126.979, bbox: [126.945, 37.550, 127.020, 37.605] },  // Jongno
    '1114000000': { centerLat: 37.560, centerLon: 126.998, bbox: [126.965, 37.538, 127.030, 37.578] },  // Jung-gu
    '1123000000': { centerLat: 37.579, centerLon: 127.049, bbox: [127.015, 37.555, 127.090, 37.605] },  // Dongdaemun
    '1126000000': { centerLat: 37.598, centerLon: 127.086, bbox: [127.055, 37.574, 127.120, 37.625] },  // Jungnang
    '1129000000': { centerLat: 37.607, centerLon: 127.017, bbox: [126.985, 37.582, 127.055, 37.635] },  // Seongbuk
    '1132000000': { centerLat: 37.637, centerLon: 127.025, bbox: [126.990, 37.610, 127.060, 37.668] },  // Gangbuk
    '1138000000': { centerLat: 37.668, centerLon: 127.046, bbox: [127.015, 37.640, 127.080, 37.695] },  // Dobong
    '1135000000': { centerLat: 37.655, centerLon: 127.077, bbox: [127.045, 37.625, 127.115, 37.680] },  // Nowon
    '1141000000': { centerLat: 37.619, centerLon: 126.921, bbox: [126.880, 37.593, 126.960, 37.655] },  // Eunpyeong
    '1153000000': { centerLat: 37.495, centerLon: 126.855, bbox: [126.820, 37.467, 126.895, 37.520] },  // Guro
    '1159000000': { centerLat: 37.500, centerLon: 126.945, bbox: [126.910, 37.475, 126.980, 37.527] },  // Dongjak
    '1162000000': { centerLat: 37.481, centerLon: 126.953, bbox: [126.910, 37.455, 126.990, 37.510] },  // Gwanak
    '1150000000': { centerLat: 37.553, centerLon: 126.850, bbox: [126.805, 37.525, 126.895, 37.583] },  // Gangseo
    '1154000000': { centerLat: 37.456, centerLon: 126.900, bbox: [126.855, 37.430, 126.935, 37.482] },  // Geumcheon
};

export interface ScrapedProperty {
    id: string;
    name: string;
    dongName: string;
    price: number;
    area: { m2: number; pyeong: number };
    link: string;
    tradeType: string;
}

const NAVER_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Referer': 'https://new.land.naver.com/',
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
    'sec-fetch-dest': 'empty',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'same-origin',
};

export async function scrapeNaverProperties(
    cortarNos: string[],
    criteria: SearchCriteria
): Promise<ScrapedProperty[]> {
    const allProperties: ScrapedProperty[] = [];

    for (const cortarNo of cortarNos) {
        const region = REGION_BBOX[cortarNo];
        if (!region) {
            console.error(`[Scraper] No bbox config for cortarNo: ${cortarNo}`);
            continue;
        }

        const [leftLon, bottomLat, rightLon, topLat] = region.bbox;
        const tag = (criteria.roomCount && criteria.roomCount >= 4) ? ':FOURROOM:::::::' : ':::::::';

        const url = `https://new.land.naver.com/api/complexes/single-markers/2.0?` +
            `cortarNo=${cortarNo}&zoom=16&priceType=RETAIL&markerId&markerType&` +
            `selectedComplexNo&selectedComplexBuildingNo&fakeComplexMarker&` +
            `realEstateType=APT%3APRE%3AABYG%3AJGC&tradeType=${criteria.tradeType || 'A1'}&` +
            `tag=${encodeURIComponent(tag)}&rentPriceMin=0&rentPriceMax=900000000&priceMin=0&` +
            (criteria.priceMax ? `priceMax=${criteria.priceMax}&` : '') +
            (criteria.areaMin ? `areaMin=${criteria.areaMin}&` : '') +
            `areaMax=900000000&oldBuildYears&recentlyBuildYears&minHouseHoldCount&maxHouseHoldCount&` +
            `showArticle=false&sameAddressGroup=false&minMaintenanceCost&maxMaintenanceCost&directions=&` +
            `leftLon=${leftLon}&rightLon=${rightLon}&topLat=${topLat}&bottomLat=${bottomLat}&isPresale=true`;

        console.log(`[Scraper] Fetching single-markers for ${cortarNo}...`);
        console.log(`[Scraper] URL: ${url.substring(0, 150)}`);

        let markers: any[] = [];
        try {
            const res = await fetch(url, { headers: NAVER_HEADERS });
            console.log(`[Scraper] Response status: ${res.status}`);

            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data)) {
                    markers = data;
                    console.log(`[Scraper] Got ${markers.length} markers`);
                } else {
                    console.log('[Scraper] Unexpected data format:', typeof data);
                }
            } else {
                const text = await res.text();
                console.error(`[Scraper] Error response: ${text.substring(0, 200)}`);
            }
        } catch (e: any) {
            console.error(`[Scraper] Fetch failed: ${e.message}`);
        }

        // Map markers to properties
        for (const marker of markers) {
            const complexNo = String(marker.complexNo || marker.markerId || '');
            if (!complexNo) continue;

            // The marker from showArticle=false has these fields based on our test
            const dealPrice = marker.dealPrice || marker.minDealPrice || 0;
            const area = marker.area1 || marker.representativeArea || 0;
            const priceMwon = typeof dealPrice === 'number' ? dealPrice : parseFloat(dealPrice) || 0;
            const areaM2 = typeof area === 'number' ? area : parseFloat(area) || 0;

            // Client-side filter
            if (criteria.priceMax && priceMwon > 0 && priceMwon > criteria.priceMax) continue;
            if (criteria.areaMin && areaM2 > 0 && areaM2 < criteria.areaMin) continue;

            allProperties.push({
                id: complexNo,
                name: marker.complexName || '(이름 없음)',
                dongName: marker.cortarAddress || marker.address || '',
                price: priceMwon,
                area: { m2: areaM2, pyeong: Math.round(areaM2 / 3.3058) },
                link: `https://new.land.naver.com/complexes/${complexNo}`,
                tradeType: criteria.tradeType || 'A1',
            });
        }
    }

    // Remove duplicates
    const seen = new Set<string>();
    return allProperties.filter(p => {
        if (seen.has(p.id)) return false;
        seen.add(p.id);
        return true;
    });
}
