import { logger } from '@/lib/logger';
import { Property } from '@/components/Property/ListingTable';

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
        // --- GANGNAM 3-GU ---
        '1171000000': [ // Songpa-gu (Balanced for coverage vs performance)
            { name: '잠실/신천', lat: 37.512, lon: 127.090 },
            { name: '방이/오금', lat: 37.510, lon: 127.125 },
            { name: '가락/문정', lat: 37.492, lon: 127.125 },
            { name: '거여/마천', lat: 37.495, lon: 127.145 },
            { name: '풍납/잠실4,6', lat: 37.525, lon: 127.115 }
        ],
        '1168000000': [ // Gangnam-gu
            { name: '압구정1(구현대)', lat: 37.530, lon: 127.028 },
            { name: '압구정2(신현대/미성)', lat: 37.528, lon: 127.020 },
            { name: '신사', lat: 37.520, lon: 127.022 },
            { name: '논현', lat: 37.512, lon: 127.030 },
            { name: '청담', lat: 37.522, lon: 127.045 },
            { name: '삼성1(코엑스)', lat: 37.512, lon: 127.058 },
            { name: '삼성2(선정릉)', lat: 37.510, lon: 127.045 },
            { name: '역삼1(역세권)', lat: 37.500, lon: 127.035 },
            { name: '역삼2(주거)', lat: 37.495, lon: 127.045 },
            { name: '대치1(학원가)', lat: 37.495, lon: 127.060 },
            { name: '대치2(은마)', lat: 37.498, lon: 127.068 },
            { name: '도곡1(타워팰리스)', lat: 37.488, lon: 127.052 },
            { name: '도곡2(매봉)', lat: 37.485, lon: 127.040 },
            { name: '개포', lat: 37.480, lon: 127.060 },
            { name: '일원', lat: 37.485, lon: 127.085 },
            { name: '수서', lat: 37.488, lon: 127.102 },
            { name: '세곡', lat: 37.465, lon: 127.105 }
        ],
        '1165000000': [ // Seocho-gu
            { name: '잠원', lat: 37.515, lon: 127.015 },
            { name: '반포1(한강변)', lat: 37.508, lon: 127.000 },
            { name: '반포2(터미널)', lat: 37.505, lon: 127.012 },
            { name: '반포3(서래)', lat: 37.498, lon: 126.995 },
            { name: '서초1(법원)', lat: 37.493, lon: 127.010 },
            { name: '서초2(남부)', lat: 37.483, lon: 127.015 },
            { name: '방배1(내방)', lat: 37.488, lon: 126.990 },
            { name: '방배2(사당)', lat: 37.478, lon: 126.985 },
            { name: '양재', lat: 37.478, lon: 127.040 },
            { name: '우면', lat: 37.465, lon: 127.025 }
        ],
        '1174000000': [ // Gangdong-gu
            { name: '고덕1(그라시움)', lat: 37.555, lon: 127.170 },
            { name: '고덕2(비즈밸리)', lat: 37.565, lon: 127.170 },
            { name: '상일', lat: 37.550, lon: 127.175 },
            { name: '명일', lat: 37.550, lon: 127.150 },
            { name: '암사', lat: 37.550, lon: 127.130 },
            { name: '천호', lat: 37.540, lon: 127.125 },
            { name: '성내', lat: 37.530, lon: 127.125 },
            { name: '길동', lat: 37.535, lon: 127.140 },
            { name: '둔촌(올림픽파크)', lat: 37.525, lon: 127.140 }
        ],

        // --- MA-YONG-SEONG ---
        '1144000000': [ // Mapo-gu
            { name: '공덕/아현', lat: 37.548, lon: 126.953 },
            { name: '도화/마포', lat: 37.540, lon: 126.945 },
            { name: '용강/대흥', lat: 37.545, lon: 126.940 },
            { name: '상암', lat: 37.575, lon: 126.890 },
            { name: '성산', lat: 37.565, lon: 126.910 },
            { name: '합정/망원', lat: 37.550, lon: 126.910 },
            { name: '연남/동교', lat: 37.560, lon: 126.925 }
        ],
        '1117000000': [ // Yongsan-gu
            { name: '이촌1(동부)', lat: 37.520, lon: 126.980 },
            { name: '이촌2(서부)', lat: 37.525, lon: 126.960 },
            { name: '한남/이태원', lat: 37.535, lon: 127.000 },
            { name: '서빙고', lat: 37.520, lon: 126.995 },
            { name: '용산역/한강로', lat: 37.530, lon: 126.965 },
            { name: '후암/남영', lat: 37.545, lon: 126.975 },
            { name: '효창/원효', lat: 37.540, lon: 126.960 }
        ],
        '1120000000': [ // Seongdong-gu
            { name: '성수1(서울숲)', lat: 37.545, lon: 127.040 },
            { name: '성수2(전략정비)', lat: 37.538, lon: 127.055 },
            { name: '옥수', lat: 37.541, lon: 127.017 },
            { name: '금호', lat: 37.548, lon: 127.023 },
            { name: '왕십리/행당', lat: 37.561, lon: 127.037 },
            { name: '마장', lat: 37.566, lon: 127.042 }
        ],

        // --- SEOUL CENTRAL (GANGBUK) ---
        '1111000000': [ // Jongno-gu
            { name: '평창/구기', lat: 37.605, lon: 126.965 },
            { name: '광화문/사직', lat: 37.575, lon: 126.970 },
            { name: '혜화/이화', lat: 37.580, lon: 127.000 },
            { name: '창신/숭인', lat: 37.575, lon: 127.015 }
        ],
        '1114000000': [ // Jung-gu
            { name: '신당/황학', lat: 37.565, lon: 127.018 },
            { name: '약수/청구', lat: 37.555, lon: 127.012 },
            { name: '중림/회현', lat: 37.558, lon: 126.968 }
        ],
        '1123000000': [ // Dongdaemun-gu
            { name: '청량리', lat: 37.582, lon: 127.048 },
            { name: '전농/답십리', lat: 37.575, lon: 127.055 },
            { name: '장안', lat: 37.570, lon: 127.070 },
            { name: '이문/휘경', lat: 37.595, lon: 127.065 }
        ],
        '1121500000': [ // Gwangjin-gu
            { name: '광장', lat: 37.542, lon: 127.103 },
            { name: '구의', lat: 37.540, lon: 127.085 },
            { name: '자양', lat: 37.535, lon: 127.070 },
            { name: '화양/군자', lat: 37.550, lon: 127.075 },
            { name: '중곡', lat: 37.565, lon: 127.085 }
        ],

        // --- SOUTHWEST (YEO-YANG-DONG) ---
        '1156000000': [ // Yeongdeungpo-gu
            { name: '여의도', lat: 37.525, lon: 126.930 },
            { name: '당산', lat: 37.535, lon: 126.900 },
            { name: '영등포/문래', lat: 37.518, lon: 126.900 },
            { name: '신길', lat: 37.505, lon: 126.915 }
        ],
        '1147000000': [ // Yangcheon-gu
            { name: '목동1(앞단지)', lat: 37.535, lon: 126.885 },
            { name: '목동2(뒷단지)', lat: 37.520, lon: 126.870 },
            { name: '신정', lat: 37.515, lon: 126.855 },
            { name: '신월', lat: 37.525, lon: 126.835 }
        ],
        '1159000000': [ // Dongjak-gu
            { name: '흑석', lat: 37.508, lon: 126.963 },
            { name: '노량진', lat: 37.512, lon: 126.942 },
            { name: '상도', lat: 37.498, lon: 126.945 },
            { name: '사당', lat: 37.485, lon: 126.972 },
            { name: '대방/신대방', lat: 37.500, lon: 126.925 }
        ],
        '1162000000': [ // Gwanak-gu
            { name: '봉천/서울대', lat: 37.482, lon: 126.952 },
            { name: '신림1(역세권)', lat: 37.485, lon: 126.930 },
            { name: '신림2(난곡)', lat: 37.470, lon: 126.918 }
        ],
        '1150000000': [ // Gangseo-gu
            { name: '마곡1(지구)', lat: 37.565, lon: 126.830 },
            { name: '가양/등촌', lat: 37.558, lon: 126.855 },
            { name: '염창', lat: 37.550, lon: 126.870 },
            { name: '화곡', lat: 37.540, lon: 126.845 },
            { name: '방화', lat: 37.575, lon: 126.815 }
        ],
        '1153000000': [ // Guro-gu
            { name: '신도림', lat: 37.508, lon: 126.880 },
            { name: '구로', lat: 37.495, lon: 126.885 },
            { name: '개봉/고척', lat: 37.495, lon: 126.855 }
        ],
        '1154500000': [ // Geumcheon-gu
            { name: '가산/독산', lat: 37.470, lon: 126.895 },
            { name: '시흥', lat: 37.450, lon: 126.905 }
        ],

        // --- NORTHEAST (NO-DO-GANG) ---
        '1135000000': [ // Nowon-gu
            { name: '상계', lat: 37.660, lon: 127.065 },
            { name: '중계', lat: 37.645, lon: 127.075 },
            { name: '하계', lat: 37.635, lon: 127.070 },
            { name: '공릉', lat: 37.625, lon: 127.075 },
            { name: '월계', lat: 37.625, lon: 127.055 }
        ],
        '1132000000': [ // Dobong-gu
            { name: '창동', lat: 37.650, lon: 127.045 },
            { name: '방학', lat: 37.665, lon: 127.035 },
            { name: '쌍문', lat: 37.650, lon: 127.035 },
            { name: '도봉', lat: 37.680, lon: 127.045 }
        ],
        '1130500000': [ // Gangbuk-gu
            { name: '미아1(뉴타운)', lat: 37.620, lon: 127.020 },
            { name: '미아2(사거리)', lat: 37.613, lon: 127.030 },
            { name: '수유/번동', lat: 37.640, lon: 127.025 }
        ],
        '1129000000': [ // Seongbuk-gu
            { name: '길음/뉴타운', lat: 37.605, lon: 127.020 },
            { name: '성북/돈암', lat: 37.595, lon: 127.015 },
            { name: '종암/월곡', lat: 37.600, lon: 127.035 },
            { name: '석관/장위', lat: 37.615, lon: 127.055 }
        ],
        '1126000000': [ // Jungnang-gu
            { name: '상봉/망우', lat: 37.595, lon: 127.090 },
            { name: '면목', lat: 37.580, lon: 127.085 },
            { name: '신내', lat: 37.615, lon: 127.095 },
            { name: '중화/묵동', lat: 37.605, lon: 127.075 }
        ],

        // --- NORTHWEST ---
        '1138000000': [ // Eunpyeong-gu
            { name: '은평1(뉴타운)', lat: 37.640, lon: 126.920 },
            { name: '녹번/응암', lat: 37.600, lon: 126.925 },
            { name: '연신내/불광', lat: 37.620, lon: 126.920 },
            { name: '수색/증산', lat: 37.580, lon: 126.895 }
        ],
        '1141000000': [ // Seodaemun-gu
            { name: '가재울/DMC', lat: 37.575, lon: 126.915 },
            { name: '홍제/무악', lat: 37.585, lon: 126.945 },
            { name: '신촌/연희', lat: 37.560, lon: 126.935 },
            { name: '북아현', lat: 37.560, lon: 126.955 }
        ]
    };

    // Map of specific CortarNo (10-digit) to Dong Name
    private DONG_CODE_MAP: Record<string, string> = {
        // Songpa-gu (11710)
        '1171010100': '잠실',
        '1171010200': '신천',
        '1171010300': '풍납',
        '1171010400': '송파',
        '1171010500': '석촌',
        '1171010600': '삼전',
        '1171010700': '가락',
        '1171010800': '문정',
        '1171010900': '장지',
        '1171011100': '방이',
        '1171011200': '오금',
        '1171011300': '거여',
        '1171011400': '마천',

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
    async getArticleList(cortarNo: string, criteria: SearchCriteria, isInteractive: boolean = false) {
        logger.info('NaverLandService', 'Fetching Article List (Dong Search)', { cortarNo, criteria });

        try {
            // Determine Search Points
            // If Region is in Registry, use named Dongs.
            // If not, use generic 4x4 Grid.
            let searchPoints: { name: string, lat: number, lon: number }[] = [];
            const subBoxSize = 0.04; // Increased for better coverage per point

            if (this.DONG_REGISTRY[cortarNo]) {
                searchPoints = this.DONG_REGISTRY[cortarNo];
                logger.info('NaverLandService', `Using ${searchPoints.length} Known Dong Centers`);
            } else {
                // Fallback: Grid
                const { lat: centerLat, lon: centerLon } = this.getRegionCoords(cortarNo);
                const gridSize = isInteractive ? 3 : 4;
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
                logger.info('NaverLandService', `Using ${gridSize}x${gridSize} Grid Search`);
            }

            const fetchSubRegion = async (point: { name: string, lat: number, lon: number }) => {
                const { lat, lon } = point;
                const btm = lat - subBoxSize;
                const top = lat + subBoxSize;
                const lft = lon - subBoxSize;
                const rgt = lon + subBoxSize;

                const allSubItems: any[] = [];
                const maxPages = 1; // Critical: Limit to 1 page for Vercel Hobby

                for (let page = 1; page <= maxPages; page++) {
                    const params = new URLSearchParams();
                    params.append('cortarNo', cortarNo);
                    params.append('rletTpCd', 'APT:ABYG:JGC');
                    params.append('tradTpCd', criteria.tradeType || 'A1');
                    params.append('z', '15'); // Better zoom level for cluster search
                    params.append('lat', String(lat));
                    params.append('lon', String(lon));
                    params.append('btm', String(btm.toFixed(7)));
                    params.append('lft', String(lft.toFixed(7)));
                    params.append('top', String(top.toFixed(7)));
                    params.append('rgt', String(rgt.toFixed(7)));
                    params.append('page', String(page));

                    if (criteria.priceMax) params.append('prc', `0:${criteria.priceMax}`);
                    // spcMin and rom removed from API params to simplify request

                    const apiUrl = `${NAVER_LAND_MOBILE_HOST}/cluster/ajax/articleList?${params.toString()}`;

                    try {
                        const response = await fetch(apiUrl, {
                            cache: 'no-store', // Bypass any server-side or Vercel cache
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

            // Parallel execute with safer 7.5s internal limit for Vercel Hobby
            const startTime = Date.now();
            const MAX_MS = 7500; // Allow more time for individual point fetches

            console.log(`[NaverLandService] Fetching ${searchPoints.length} points with concurrency limit (Batch size: 4)...`);

            const resultsArrays: any[][] = [];
            const CONCURRENCY = 4;

            for (let i = 0; i < searchPoints.length; i += CONCURRENCY) {
                const batch = searchPoints.slice(i, i + CONCURRENCY);
                const batchStart = Date.now();

                const batchResults = await Promise.all(
                    batch.map(async (point, localIdx) => {
                        const idx = i + localIdx;
                        const elapsed = Date.now() - startTime;

                        if (isInteractive && (elapsed > MAX_MS)) {
                            console.warn(`[NaverLandService] SKIP: Point #${idx} (${point.name}) at ${elapsed}ms due to limit`);
                            return [];
                        }

                        try {
                            const pStart = Date.now();
                            const list = await fetchSubRegion(point);
                            console.log(`[NaverLandService] DONE: Point #${idx} (${point.name}) in ${Date.now() - pStart}ms, items=${list.length}`);
                            return list;
                        } catch (e) {
                            return [];
                        }
                    })
                );
                resultsArrays.push(...batchResults);

                // If we've already exceeded our target time and are interactive, break early
                if (isInteractive && (Date.now() - startTime >= MAX_MS)) {
                    console.log(`[NaverLandService] Breaking out of batch loop early to respect interactive timeout.`);
                    break;
                }
            }

            const results = resultsArrays.flat();

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
            const articles = uniqueList.map((item: any) => {
                const spc1 = typeof item.spc1 === 'string' ? parseFloat(item.spc1) : (Number(item.spc1) || 0);
                const price = typeof item.prc === 'number' ? item.prc : (parseInt(item.prc) || 0);

                return {
                    id: String(item.atclNo || Math.random().toString(36).substr(2, 9)),
                    name: item.atclNm || 'Unknown Property',
                    price: price,
                    households: 0,
                    area: {
                        m2: spc1,
                        pyeong: spc1 > 0 ? Math.round(spc1 / 3.3058) : 0
                    },
                    link: item.atclNo ? `https://m.land.naver.com/article/info/${item.atclNo}` : '#',
                    note: undefined,
                    _rawPrice: price,
                    dongName: item._dongName || '-'
                };
            });

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
     * Get Total Number of Points for a region
     */
    getPointCount(regionCode: string): number {
        return this.DONG_REGISTRY[regionCode]?.length || 0;
    }

    /**
     * Get Article List for a specific chunk (range of points)
     */
    async getArticleListByChunk(regionCode: string, criteria: SearchCriteria, startIndex: number, endIndex: number): Promise<Property[]> {
        const allPoints = this.DONG_REGISTRY[regionCode] || [];
        const searchPoints = allPoints.slice(startIndex, endIndex);

        if (searchPoints.length === 0) return [];

        console.log(`[NaverLandService] Fetching chunk [${startIndex}-${endIndex}] for ${regionCode} (${searchPoints.length} points)`);

        try {
            const fetchSubRegion = async (point: { name: string; lat: number; lon: number }) => {
                let allSubItems: any[] = [];
                for (let page = 1; page <= 2; page++) {
                    const params = new URLSearchParams({
                        reitId: '', rletTpCd: 'OPST:APT:JGC:ABYG', tradTpCd: criteria.tradeType || 'A1',
                        z: '15', lat: String(point.lat), lon: String(point.lon),
                        btm: String(point.lat - 0.01), lft: String(point.lon - 0.01),
                        top: String(point.lat + 0.01), rgt: String(point.lon + 0.01),
                        pgr: String(page), cortNo: regionCode
                    });

                    if (criteria.priceMax) params.append('prc', `0:${criteria.priceMax}`);
                    if (criteria.areaMin) params.append('spcMin', String(criteria.areaMin));
                    if (criteria.roomCount) params.append('rom', String(criteria.roomCount));

                    const apiUrl = `${NAVER_LAND_MOBILE_HOST}/cluster/ajax/articleList?${params.toString()}`;

                    const response = await fetch(apiUrl, {
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
                            'Referer': 'https://m.land.naver.com/'
                        }
                    });
                    if (!response.ok) break;
                    const json = await response.json();
                    const items = Array.isArray(json.body) ? json.body : [];
                    if (items.length === 0) {
                        // If center of point has no results, don't stop entire point search, 
                        // but maybe current coordinates don't have matching filter.
                        // However, since we use clustering, usually page 1 has something if it exists.
                        // We continue instead of break to allow other searchPoints in the chunk.
                        break;
                    }

                    allSubItems.push(...items.map((item: any) => ({
                        ...item,
                        _dongName: this.DONG_CODE_MAP[item.cortarNo] || point.name
                    })));
                    if (items.length < 20) break;
                }
                return allSubItems;
            };

            const resultsArrays = await Promise.all(
                searchPoints.map(async (point) => {
                    try {
                        return await fetchSubRegion(point);
                    } catch (e) {
                        return [];
                    }
                })
            );

            const allItems = resultsArrays.flat();
            const uniqueMap = new Map();
            allItems.forEach((item: any) => {
                if (!uniqueMap.has(item.atclNo)) {
                    uniqueMap.set(item.atclNo, item);
                }
            });

            return Array.from(uniqueMap.values()).map((item: any) => {
                const spc1 = typeof item.spc1 === 'string' ? parseFloat(item.spc1) : (Number(item.spc1) || 0);
                const price = typeof item.prc === 'number' ? item.prc : (parseInt(item.prc) || 0);
                return {
                    id: String(item.atclNo),
                    name: item.atclNm || 'Unknown',
                    price: price,
                    households: 0,
                    area: { m2: spc1, pyeong: spc1 > 0 ? Math.round(spc1 / 3.3058) : 0 },
                    link: `https://m.land.naver.com/article/info/${item.atclNo}`,
                    _rawPrice: price,
                    dongName: item._dongName || '-'
                };
            });
        } catch (e) {
            console.error('getArticleListByChunk Error', e);
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
