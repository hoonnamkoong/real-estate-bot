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
    id: string; // complexNo or articleNo
    name: string; // complexNam or atclNm
    dongName: string; // address
    price: number; // in 만원
    area: { m2: number; pyeong: number };
    link: string;
    tradeType: string;
}

const MOBILE_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
    'Referer': 'https://m.land.naver.com/',
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'ko-KR,ko;q=0.9',
};

// Vercel direct fetch using Mobile API (Bypasses 429 block, supports filters)
export async function scrapeNaverProperties(
    cortarNos: string[],
    criteria: SearchCriteria
): Promise<ScrapedProperty[]> {
    const allProperties: ScrapedProperty[] = [];

    // Construct common filter params
    const filterParams = new URLSearchParams();
    if (criteria.priceMax) filterParams.set('dprcMax', String(criteria.priceMax)); // in 만원
    if (criteria.areaMin) filterParams.set('spcMin', String(criteria.areaMin)); // in m2
    filterParams.set('spcMax', '900000000');
    if (criteria.roomCount && criteria.roomCount >= 4) filterParams.set('tag', 'FOURROOM');

    for (const cortarNo of cortarNos) {
        const region = REGION_BBOX[cortarNo];
        if (!region) {
            console.error(`[Scraper] No bbox config for cortarNo: ${cortarNo}`);
            continue;
        }

        const [lft, btm, rgt, top] = region.bbox;
        const z = 12; // Zoom level

        // 1. Fetch Cluster List
        const clusterUrl = `https://m.land.naver.com/cluster/clusterList?view=atcl&cortarNo=${cortarNo}&rletTpCd=APT&tradTpCd=${criteria.tradeType || 'A1'}&z=${z}&lat=${region.centerLat}&lon=${region.centerLon}&btm=${btm}&lft=${lft}&top=${top}&rgt=${rgt}&${filterParams.toString()}`;

        console.log(`[Scraper] Fetching mobile clusterList for ${cortarNo}...`);

        try {
            const clusterRes = await fetch(clusterUrl, { headers: MOBILE_HEADERS });
            if (!clusterRes.ok) {
                console.error(`[Scraper] Cluster API failed: ${clusterRes.status}`);
                continue;
            }

            const clusterData = await clusterRes.json();
            const clusters = clusterData.data?.ARTICLE || [];
            console.log(`[Scraper] Got ${clusters.length} clusters for ${cortarNo}`);

            // 2. Fetch Article Details per Cluster (in parallel chunks)
            // Limit concurrency to avoid being blocked if there are many clusters
            const limit = 5;
            for (let i = 0; i < clusters.length; i += limit) {
                const chunk = clusters.slice(i, i + limit);

                await Promise.all(chunk.map(async (cluster: any) => {
                    const lgeo = cluster.lgeo; // This is the complex ID (itemId) for apartments
                    if (!lgeo) return;

                    const articleUrl = `https://m.land.naver.com/cluster/ajax/articleList?itemId=${lgeo}&lgeo=${lgeo}&rletTpCd=APT&tradTpCd=${criteria.tradeType || 'A1'}&z=${z}&lat=${cluster.lat}&lon=${cluster.lon}&totCnt=${cluster.count}&${filterParams.toString()}`;

                    try {
                        const articleRes = await fetch(articleUrl, { headers: MOBILE_HEADERS });
                        if (!articleRes.ok) return;

                        const articleData = await articleRes.json();
                        const articles = articleData.body || [];

                        for (const art of articles) {
                            const priceMwon = art.prc || 0;
                            const areaM2 = art.spc1 || 0;
                            const complexName = art.atclNm || '(이름 없음)';

                            allProperties.push({
                                id: art.atclNo || `${lgeo}_${priceMwon}_${areaM2}`,
                                name: complexName,
                                dongName: '', // Mobile article list does not always provide dongName directly
                                price: priceMwon,
                                area: { m2: areaM2, pyeong: Math.round(areaM2 / 3.3058) },
                                link: `https://m.land.naver.com/article/info/${art.atclNo}`,
                                tradeType: criteria.tradeType || 'A1',
                            });
                        }
                    } catch (e) {
                        console.error(`[Scraper] Article fetch failed for ${lgeo}`);
                    }
                }));
            }
        } catch (e: any) {
            console.error(`[Scraper] Error processing ${cortarNo}: ${e.message}`);
        }
    }

    console.log(`[Scraper] Total properties found before dedup: ${allProperties.length}`);

    // Deduplicate by complex name and price to avoid returning the same listing from multiple realtors
    const seen = new Set<string>();
    const uniqueProps = allProperties.filter(p => {
        const key = `${p.name}_${p.price}_${p.area.m2}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });

    return uniqueProps;
}
