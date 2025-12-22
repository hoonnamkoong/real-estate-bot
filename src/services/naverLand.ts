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

    // Dong Coordinates Registry (Approximate Centers)
    private DONG_REGISTRY: Record<string, { name: string; lat: number; lon: number }[]> = {
        '1171000000': [ // Songpa-gu
            { name: 'Jamsil', lat: 37.512, lon: 127.094 },
            { name: 'Sincheon', lat: 37.520, lon: 127.105 },
            { name: 'Pungnap', lat: 37.535, lon: 127.115 },
            { name: 'Songpa', lat: 37.505, lon: 127.115 },
            { name: 'Seokchon', lat: 37.503, lon: 127.105 },
            { name: 'Samjeon', lat: 37.502, lon: 127.090 },
            { name: 'Bangi', lat: 37.515, lon: 127.125 },
            { name: 'Ogeum', lat: 37.505, lon: 127.135 },
            { name: 'Garak', lat: 37.495, lon: 127.125 },
            { name: 'Munjeong', lat: 37.485, lon: 127.125 },
            { name: 'Jangji', lat: 37.478, lon: 127.135 },
            { name: 'Geoyeo', lat: 37.495, lon: 127.145 },
            { name: 'Macheon', lat: 37.495, lon: 127.155 }
        ],
        '1168000000': [ // Gangnam-gu
            { name: 'Apgujeong', lat: 37.528, lon: 127.028 },
            { name: 'Sinsa', lat: 37.522, lon: 127.022 },
            { name: 'Cheongdam', lat: 37.522, lon: 127.045 },
            { name: 'Nonhyeon', lat: 37.512, lon: 127.030 },
            { name: 'Samseong', lat: 37.512, lon: 127.058 },
            { name: 'Yeoksam', lat: 37.500, lon: 127.038 },
            { name: 'Daechi', lat: 37.498, lon: 127.060 },
            { name: 'Dogok', lat: 37.490, lon: 127.045 },
            { name: 'Gaepo', lat: 37.480, lon: 127.065 },
            { name: 'Ilwon', lat: 37.485, lon: 127.085 },
            { name: 'Suseo', lat: 37.488, lon: 127.102 },
            { name: 'Segok', lat: 37.465, lon: 127.105 }
        ],
        '1165000000': [ // Seocho-gu
            { name: 'Jamwon', lat: 37.515, lon: 127.015 },
            { name: 'Banpo', lat: 37.505, lon: 127.000 },
            { name: 'Seocho', lat: 37.488, lon: 127.015 },
            { name: 'Bangbae', lat: 37.482, lon: 126.995 },
            { name: 'Yangjae', lat: 37.482, lon: 127.038 },
            { name: 'Umyeon', lat: 37.465, lon: 127.025 },
            { name: 'Naegok', lat: 37.455, lon: 127.065 }
        ]
    };

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
        logger.info('NaverLandService', 'Fetching Article List (Dong Search)', { cortarNo, criteria });

        try {
            // Determine Search Points
            // If Region is in Registry, use named Dongs.
            // If not, use generic 4x4 Grid.
            let searchPoints: { name: string, lat: number, lon: number }[] = [];
            const subBoxSize = 0.02; // 2km radius is safe for both Dong and Grid

            if (this.DONG_REGISTRY[cortarNo]) {
                searchPoints = this.DONG_REGISTRY[cortarNo];
                logger.info('NaverLandService', `Using ${searchPoints.length} Known Dong Centers`);
            } else {
                // Fallback: 4x4 Grid
                const { lat: centerLat, lon: centerLon } = this.getRegionCoords(cortarNo);
                const gridSize = 4;
                const step = 0.04;
                const startOffset = -0.06;
                for (let i = 0; i < gridSize; i++) {
                    for (let j = 0; j < gridSize; j++) {
                        searchPoints.push({
                            name: `Grid_${i}_${j}`,
                            lat: centerLat + startOffset + (i * step),
                            lon: centerLon + startOffset + (j * step)
                        });
                    }
                }
                logger.info('NaverLandService', 'Using Generic Grid Search');
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
                params.append('page', '1'); // Fetch 1st page of each sub-region

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
                    logger.error('NaverLandService', 'Sub-region Fetch Error', { error: e });
                    return [];
                }
            };

            // Execute in parallel
            // 16 requests might hit rate limits, but usually fine for this specific API.
            // We can batch if needed, but Promise.all is fastest.
            const results = await Promise.all(searchPoints.map(p => fetchSubRegion(p)));

            // Aggregate and Deduplicate
            const allItems = results.flat();
            const uniqueMap = new Map();

            allItems.forEach((item: any) => {
                if (!uniqueMap.has(item.atclNo)) {
                    uniqueMap.set(item.atclNo, item);
                }
            });

            const uniqueList = Array.from(uniqueMap.values());
            logger.info('NaverLandService', 'Search Success', {
                points: searchPoints.length,
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
