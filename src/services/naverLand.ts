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
            { name: '잠실', lat: 37.512, lon: 127.094 },
            { name: '신천', lat: 37.520, lon: 127.105 },
            // Pungnap - Split into North/South to cover elongated shape
            { name: '풍납1', lat: 37.538, lon: 127.123 }, // Near City Geukdong/Pungnap Toseong
            { name: '풍납2', lat: 37.529, lon: 127.117 }, // Near Pungnap Baekje/Riverville
            { name: '풍납3', lat: 37.522, lon: 127.110 }, // Near Asan Hospital/Pungnap 2-dong
            { name: '송파', lat: 37.505, lon: 127.115 },
            { name: '석촌', lat: 37.503, lon: 127.105 },
            { name: '삼전', lat: 37.502, lon: 127.090 },
            { name: '방이', lat: 37.515, lon: 127.125 },
            { name: '오금', lat: 37.505, lon: 127.135 },
            { name: '가락', lat: 37.495, lon: 127.125 },
            { name: '문정', lat: 37.485, lon: 127.125 },
            { name: '장지', lat: 37.478, lon: 127.135 },
            { name: '거여', lat: 37.495, lon: 127.145 },
            { name: '마천', lat: 37.495, lon: 127.155 }
        ],
        '1168000000': [ // Gangnam-gu
            { name: '압구정', lat: 37.528, lon: 127.028 },
            { name: '신사', lat: 37.522, lon: 127.022 },
            { name: '청담', lat: 37.522, lon: 127.045 },
            { name: '논현', lat: 37.512, lon: 127.030 },
            { name: '삼성', lat: 37.512, lon: 127.058 },
            { name: '역삼', lat: 37.500, lon: 127.038 },
            { name: '대치', lat: 37.498, lon: 127.060 },
            { name: '도곡', lat: 37.490, lon: 127.045 },
            { name: '개포', lat: 37.480, lon: 127.065 },
            { name: '일원', lat: 37.485, lon: 127.085 },
            { name: '수서', lat: 37.488, lon: 127.102 },
            { name: '세곡', lat: 37.465, lon: 127.105 }
        ],
        '1165000000': [ // Seocho-gu
            { name: '잠원', lat: 37.515, lon: 127.015 },
            { name: '반포', lat: 37.505, lon: 127.000 },
            { name: '서초', lat: 37.488, lon: 127.015 },
            { name: '방배', lat: 37.482, lon: 126.995 },
            { name: '양재', lat: 37.482, lon: 127.038 },
            { name: '우면', lat: 37.465, lon: 127.025 },
            { name: '내곡', lat: 37.455, lon: 127.065 }
        ]
    };

    // Map of specific CortarNo (10-digit) to Dong Name
    private DONG_CODE_MAP: Record<string, string> = {
        // Songpa-gu (11710)
        '1171010100': '잠실',
        '1171010200': '신천',
        '1171010300': '풍납', // Fixed: Hangang Geukdong is here
        '1171010400': '송파',
        '1171010500': '석촌',
        '1171010600': '삼전',
        '1171010700': '가락',
        '1171010800': '문정',
        '1171010900': '장지',
        '1171011100': '방이',
        '1171011200': '오금',
        '1171011300': '거여',
        '1171011400': '마천', // Fixed: Macheon Kumho is here

        // Gangnam-gu (11680)
        '1168010100': '역삼',
        '1168010300': '개포',
        '1168010400': '청담',
        '1168010500': '삼성',
        '1168010600': '대치',
        '1168010700': '신사',
        '1168010800': '논현',
        '1168011000': '압구정',
        '1168011100': '세곡',
        '1168011200': '자곡',
        '1168011300': '율현',
        '1168011400': '일원',
        '1168011500': '수서',
        '1168011800': '도곡',

        // Seocho-gu (11650)
        '1165010100': '서초',
        '1165010200': '양재',
        '1165010300': '우면',
        '1165010400': '원지',
        '1165010600': '잠원',
        '1165010700': '반포',
        '1165010800': '방배'
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

            const fetchSubRegion = async (point: { name: string, lat: number, lon: number }) => {
                const { lat, lon } = point;
                const btm = lat - subBoxSize;
                const top = lat + subBoxSize;
                const lft = lon - subBoxSize;
                const rgt = lon + subBoxSize;

                const allSubItems: any[] = [];
                const maxPages = 3; // Reduced from 5 to avoid Timeout on Vercel

                for (let page = 1; page <= maxPages; page++) {
                    const params = new URLSearchParams();
                    params.append('cortarNo', cortarNo);
                    params.append('rletTpCd', 'APT:ABYG:JGC');
                    params.append('tradTpCd', criteria.tradeType || 'A1');
                    params.append('z', '16');
                    params.append('lat', String(lat));
                    params.append('lon', String(lon));
                    params.append('btm', String(btm.toFixed(7)));
                    params.append('lft', String(lft.toFixed(7)));
                    params.append('top', String(top.toFixed(7)));
                    params.append('rgt', String(rgt.toFixed(7)));
                    params.append('page', String(page));

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
                        if (!response.ok) break;
                        const json = await response.json();
                        const items = Array.isArray(json.body) ? json.body : [];

                        if (items.length === 0) break; // Stop if no items

                        allSubItems.push(...items.map((item: any) => ({
                            ...item,
                            // Use mapped name from item's cortarNo if available, otherwise fallback to search point name
                            _dongName: this.DONG_CODE_MAP[item.cortarNo] || point.name
                        })));

                        // Optimization: If fewer than 20 items returned, it's the last page
                        if (items.length < 20) break;

                    } catch (e) {
                        logger.error('NaverLandService', `Sub-region Fetch Error (Page ${page})`, { error: e });
                        break;
                    }
                }
                return allSubItems;
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
                _rawPrice: item.prc,
                dongName: item._dongName
            }));

            // Sort by Dong Name then Price
            articles.sort((a, b) => {
                const dongA = a.dongName || '';
                const dongB = b.dongName || '';
                if (dongA !== dongB) {
                    return dongA.localeCompare(dongB);
                }
                return a.price - b.price;
            });

            return articles;

        } catch (error) {
            logger.error('NaverLandService', 'API Fetch Failed', { error });
            return [];
        }
    }

    /**
     * Get Article Detail (To get households if needed, but expensive)
     * Skipped for now.
     */

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
