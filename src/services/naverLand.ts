import { logger } from '@/lib/logger';

// Types for Search Criteria
export interface SearchCriteria {
    tradeType?: 'A1' | 'B1' | 'B2'; // A1: Sale, B1: Jeonse, B2: Monthly
    priceMax?: number; // Man-won
    areaMin?: number;
    areaMax?: number;
    roomCount?: number;
}

const NAVER_LAND_MOBILE_HOST = 'https://m.land.naver.com';

export class NaverLandService {

    // Hardcoded coordinates for each region (approximate center)
    // Used to construct the API request
    private getRegionCoords(cortarNo: string) {
        // Default: Gangnam (1168000000)
        let lat = 37.517332;
        let lon = 127.047377;

        if (cortarNo === '1171000000') { // Songpa
            lat = 37.514544;
            lon = 127.105918;
        } else if (cortarNo === '1165000000') { // Seocho
            lat = 37.483574;
            lon = 127.032603;
        } else if (cortarNo === '1144000000') { // Mapo
            lat = 37.566283;
            lon = 126.901642;
        } else if (cortarNo === '1117000000') { // Yongsan
            lat = 37.532326;
            lon = 126.990703;
        } else if (cortarNo === '1120000000') { // Seongdong
            lat = 37.563456;
            lon = 127.036821;
        }
        // Add more regions if needed or use a generic fallback
        return { lat, lon };
    }

    /**
     * Get Article List using Direct API Fetch (No Puppeteer)
     */
    async getArticleList(cortarNo: string, criteria: SearchCriteria) {
        logger.info('NaverLandService', 'Fetching Article List (Grid Search)', { cortarNo, criteria });

        try {
            const { lat: centerLat, lon: centerLon } = this.getRegionCoords(cortarNo);

            // Grid Search Strategy
            // The API rejects large bounding boxes (e.g. 0.08) from server IPs.
            // We split the 0.08 radius area into a 4x4 grid of safe 0.02 boxes.
            // Total width/height covered: 0.16 deg (approx 16km).

            const gridSize = 4;      // 4x4 grid
            const step = 0.04;       // Distance between sub-centers
            const subBoxSize = 0.02; // Safe box size (verified 0.01 works, 0.02 likely safe)

            // Start from bottom-left
            // Center - 0.06 is the first sub-center (since we want +/- 0.08 total)
            // -0.06, -0.02, +0.02, +0.06 covers the range [-0.08, 0.08] with +/- 0.02 boxes
            const startOffset = -0.06;

            const gridPoints: { lat: number, lon: number }[] = [];

            for (let i = 0; i < gridSize; i++) {
                for (let j = 0; j < gridSize; j++) {
                    gridPoints.push({
                        lat: centerLat + startOffset + (i * step),
                        lon: centerLon + startOffset + (j * step)
                    });
                }
            }

            const fetchSubRegion = async (point: { lat: number, lon: number }) => {
                const { lat, lon } = point;
                const btm = lat - subBoxSize;
                const top = lat + subBoxSize;
                const lft = lon - subBoxSize;
                const rgt = lon + subBoxSize;

                // Prepare Query Params
                const params = new URLSearchParams();
                params.append('cortarNo', cortarNo);
                params.append('rletTpCd', 'APT:ABYG:JGC');
                params.append('tradTpCd', criteria.tradeType || 'A1');
                params.append('z', '16'); // Use User's Zoom Level
                params.append('lat', String(lat));
                params.append('lon', String(lon));
                params.append('btm', String(btm.toFixed(7)));
                params.append('lft', String(lft.toFixed(7)));
                params.append('top', String(top.toFixed(7)));
                params.append('rgt', String(rgt.toFixed(7)));
                params.append('page', '1'); // Fetch 1st page of each grid

                // Filters
                if (criteria.priceMax) params.append('prc', `0:${criteria.priceMax}`);
                if (criteria.areaMin) params.append('spcMin', String(criteria.areaMin));
                if (criteria.roomCount) params.append('rom', String(criteria.roomCount));

                const apiUrl = `${NAVER_LAND_MOBILE_HOST}/cluster/ajax/articleList?${params.toString()}`;

                try {
                    const response = await fetch(apiUrl, {
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
                            'Referer': 'https://m.land.naver.com/'
                        }
                    });
                    if (!response.ok) return [];
                    const json = await response.json();
                    return Array.isArray(json.body) ? json.body : [];
                } catch (e) {
                    logger.error('NaverLandService', 'Grid Fetch Error', { error: e });
                    return [];
                }
            };

            // Execute in parallel
            // 16 requests might hit rate limits, but usually fine for this specific API.
            // We can batch if needed, but Promise.all is fastest.
            const results = await Promise.all(gridPoints.map(p => fetchSubRegion(p)));

            // Aggregate and Deduplicate
            const allItems = results.flat();
            const uniqueMap = new Map();

            allItems.forEach((item: any) => {
                if (!uniqueMap.has(item.atclNo)) {
                    uniqueMap.set(item.atclNo, item);
                }
            });

            const uniqueList = Array.from(uniqueMap.values());
            logger.info('NaverLandService', 'Grid Search Success', {
                gridPoints: gridPoints.length,
                totalRaw: allItems.length,
                unique: uniqueList.length
            });

            // Map to Property Interface
            const articles = uniqueList.map((item: any) => ({
                id: item.atclNo,
                name: item.atclNm,
                price: typeof item.prc === 'number' ? item.prc : parseInt(item.prc),
                households: 0,
                area: {
                    m2: typeof item.spc1 === 'string' ? parseFloat(item.spc1) : item.spc1,
                    pyeong: typeof item.spc1 === 'string' ? Math.round(parseFloat(item.spc1) / 3.3) : Math.round(item.spc1 / 3.3)
                },
                link: `https://m.land.naver.com/article/info/${item.atclNo}`,
                note: undefined,
                _rawPrice: item.prc
            }));

            // Sort by Date or Price (Optional, but good for UI)
            // Default to most recent (highest ID usually)
            articles.sort((a, b) => Number(b.id) - Number(a.id));

            return articles;

        } catch (error) {
            logger.error('NaverLandService', 'API Fetch Failed', { error });
            return [];
        }
    }

    /**
     * Get Region Code (CortarNo)
     */
    async getRegionCode(keyword: string): Promise<string> {
        const map: Record<string, string> = {
            'gangnam': '1168000000', 'seocho': '1165000000', 'songpa': '1171000000',
            'yongsan': '1117000000', 'seongdong': '1120000000', 'gwangjin': '1121500000',
            'mapo': '1144000000', 'yangcheon': '1147000000', 'yeongdeungpo': '1156000000',
            'gangdong': '1174000000', 'jongno': '1111000000', 'junggu': '1114000000',
            'dongdaemun': '1123000000', 'jungnang': '1126000000', 'seongbuk': '1129000000',
            'gangbuk': '1130500000', 'dobong': '1132000000', 'nowon': '1135000000',
            'eunpyeong': '1138000000', 'seodaemun': '1141000000', 'gangseo': '1150000000',
            'guro': '1153000000', 'geumcheon': '1154500000', 'dongjak': '1159000000',
            'gwanak': '1162000000'
        };
        return map[keyword] || '1168000000';
    }
}

export const naverLand = new NaverLandService();
