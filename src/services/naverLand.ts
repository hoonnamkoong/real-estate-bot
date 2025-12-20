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
        logger.info('NaverLandService', 'Fetching Article List API', { cortarNo, criteria });

        try {
            const { lat, lon } = this.getRegionCoords(cortarNo);

            // Construct TIGHTER Bounding Box (Approx +/- 0.02 deg for ~2km radius)
            // This reduces the chance of bleeding into neighboring districts (e.g. Gangnam vs Songpa)
            const boxSize = 0.02;
            const btm = lat - boxSize;
            const top = lat + boxSize;
            const lft = lon - boxSize;
            const rgt = lon + boxSize;

            // Prepare Query Params
            const params = new URLSearchParams();
            params.append('cortarNo', cortarNo); // CRITICAL: Filter by Region Code
            params.append('rletTpCd', 'APT:ABYG:JGC'); // Apartment, Presale, Reconstruction
            params.append('tradTpCd', criteria.tradeType || 'A1'); // A1: Sale
            params.append('z', '14');
            params.append('lat', String(lat));
            params.append('lon', String(lon));
            params.append('btm', String(btm.toFixed(7)));
            params.append('lft', String(lft.toFixed(7)));
            params.append('top', String(top.toFixed(7)));
            params.append('rgt', String(rgt.toFixed(7)));

            // Filter by Price/Area directly in API params
            // Naver API uses 'prc' in format 'min:max' e.g. '0:50000' (Man-won)
            if (criteria.priceMax) {
                params.append('prc', `0:${criteria.priceMax}`);
            }
            if (criteria.areaMin) {
                params.append('spcMin', String(criteria.areaMin));
            }
            if (criteria.roomCount) {
                params.append('rom', String(criteria.roomCount));
            }

            const apiUrl = `${NAVER_LAND_MOBILE_HOST}/cluster/ajax/articleList?${params.toString()}`;
            logger.info('NaverLandService', 'API URL', { url: apiUrl });

            const response = await fetch(apiUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
                    'Referer': 'https://m.land.naver.com/'
                }
            });

            if (!response.ok) {
                throw new Error(`Naver API Response: ${response.status} ${response.statusText}`);
            }

            const json = await response.json();
            const list = json.body || [];

            if (!Array.isArray(list)) {
                logger.warn('NaverLandService', 'API returned non-array body', { json });
                return [];
            }

            logger.info('NaverLandService', 'API Success', { count: list.length });

            // Map to Property Interface
            const articles = list.map((item: any) => ({
                id: item.atclNo,
                name: item.atclNm, // e.g. "Olymipc Family Town"
                price: item.hanPrc, // Use "hanPrc" for display (e.g. "17억")
                households: 0, // Not available in 'cluster/articleList' API
                area: {
                    m2: typeof item.spc1 === 'string' ? parseFloat(item.spc1) : item.spc1,
                    pyeong: typeof item.spc1 === 'string' ? Math.round(parseFloat(item.spc1) / 3.3) : Math.round(item.spc1 / 3.3)
                },
                link: `https://m.land.naver.com/article/info/${item.atclNo}`,
                note: '',
                _rawPrice: item.prc // Use "prc" (Man-won number) for filtering
            }));

            // Post-processing: No longer needed for price parsing since 'prc' gives number
            const processed = articles;

            return processed;

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
