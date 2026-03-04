import { logger } from '@/lib/logger';
import { spawn } from 'child_process';
import path from 'path';

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

    /**
     * Get Article List using Child Process Scraper
     */
    async getArticleList(cortarNo: string, criteria: SearchCriteria) {
        logger.info('NaverLandService', 'Spawning Scraper Process', { cortarNo, criteria });

        return new Promise<any[]>((resolve, reject) => {
            const scriptPath = path.join(process.cwd(), 'src', 'services', 'scraper.js');

            const args = [cortarNo];
            if (criteria.priceMax) args.push(String(criteria.priceMax));
            if (criteria.areaMin) args.push(String(criteria.areaMin));
            if (criteria.roomCount) args.push(String(criteria.roomCount));

            logger.info('NaverLandService', 'Exec', { scriptPath, args });

            const child = spawn('node', [scriptPath, ...args]);

            let stdout = '';
            let stderr = '';

            child.stdout.on('data', (data) => {
                stdout += data.toString();
            });

            child.stderr.on('data', (data) => {
                stderr += data.toString();
            });

            child.on('close', (code) => {
                if (stderr) logger.info('NaverLandService', 'Scraper Stderr', { stderr });

                if (code !== 0) {
                    logger.error('NaverLandService', 'Scraper Process Failed', { code, stderr });
                    resolve([]);
                    return;
                }

                try {
                    const list = JSON.parse(stdout);
                    logger.info('NaverLandService', 'Scraper Success', { count: list.length });

                    if (!Array.isArray(list)) {
                        logger.warn('NaverLandService', 'Scraper returned non-array', { stdout });
                        resolve([]);
                        return;
                    }

                    const articles = list.map((item: any) => ({
                        id: item.atclNo,
                        name: item.atclNm,
                        price: item.prc,
                        households: 0,
                        area: { m2: item.spc1, pyeong: Math.round(item.spc1 / 3.3) },
                        link: `https://m.land.naver.com/article/info/${item.atclNo}`,
                        note: '',
                        _rawPrice: item._rawPrice
                    }));
                    resolve(articles);
                } catch (e) {
                    logger.error('NaverLandService', 'JSON Parse Error', { error: e, preview: stdout.slice(0, 100) });
                    resolve([]);
                }
            });
        });
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
