import { logger } from '@/lib/logger';
import { Property } from '@/components/Property/ListingTable';

// Types for Search Criteria
export interface SearchCriteria {
    tradeType?: 'A1' | 'B1' | 'B2'; // A1: Sale, B1: Jeonse, B2: Monthly
    priceMax?: number; // Man-won
    areaMin?: number;
    areaMax?: number;
    roomCount?: number;
    minHouseholds?: number;
}

const NAVER_LAND_MOBILE_HOST = 'https://m.land.naver.com';
const NAVER_LAND_FIN_API_HOST = 'https://fin.land.naver.com';

export class NaverLandService {
    private COMPLEX_CACHE: Map<string, { totalHouseholdCount: number, name: string }> = new Map();

    // Dong Coordinates Registry (Approximate Centers)
    private DONG_REGISTRY: Record<string, { name: string; lat: number; lon: number }[]> = {
        // --- GANGNAM 3-GU ---
        '1171000000': [ // Songpa-gu (Precision Dong Coverage)
            { name: '잠실동', lat: 37.5055, lon: 127.0815 },
            { name: '신천동', lat: 37.5191, lon: 127.1030 },
            { name: '풍납동', lat: 37.5350, lon: 127.1150 },
            { name: '송파동', lat: 37.5050, lon: 127.1100 },
            { name: '석촌동', lat: 37.5050, lon: 127.1000 },
            { name: '삼전동', lat: 37.5050, lon: 127.0900 },
            { name: '가락동', lat: 37.4957, lon: 127.1218 },
            { name: '문정동', lat: 37.4859, lon: 127.1218 },
            { name: '장지동', lat: 37.4750, lon: 127.1350 },
            { name: '방이동', lat: 37.5150, lon: 127.1250 },
            { name: '오금동', lat: 37.5050, lon: 127.1300 },
            { name: '거여동', lat: 37.4913, lon: 127.1477 },
            { name: '마천동', lat: 37.4910, lon: 127.1530 }
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
        '1165010800': '방배',

        // Gwangjin-gu (11215)
        '1121510100': '중곡',
        '1121510200': '능동',
        '1121510300': '구의',
        '1121510400': '광장',
        '1121510500': '자양',
        '1121510700': '화양',
        '1121510900': '군자',

        // Gangdong-gu (11740)
        '1174010100': '명일',
        '1174010200': '고덕',
        '1174010300': '상일',
        '1174010500': '길동',
        '1174010600': '둔촌',
        '1174010700': '암사',
        '1174010800': '성내',
        '1174010900': '천호',
        '1174011000': '강일',

        // Dongdaemun-gu (11230)
        '1123010100': '신설',
        '1123010200': '용두',
        '1123010300': '제기',
        '1123010400': '전농',
        '1123010500': '답십리',
        '1123010600': '장안',
        '1123010700': '청량리',
        '1123010800': '회기',
        '1123010900': '휘경',
        '1123011000': '이문',

        // Seongdong-gu (11200)
        '1120010100': '상왕십리',
        '1120010200': '하왕십리',
        '1120010300': '홍익',
        '1120010400': '도선',
        '1120010500': '마장',
        '1120010600': '사근',
        '1120010700': '행당',
        '1120010800': '응봉',
        '1120010900': '금호동1가',
        '1120011000': '금호동2가',
        '1120011100': '금호동3가',
        '1120011200': '금호동4가',
        '1120011300': '옥수',
        '1120011400': '성수동1가',
        '1120011500': '성수동2가',
        '1120011800': '송정',
        '1120012200': '용답'
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
     * Per-dong cortarNo registry: each entry is a 10-digit dong code with center lat/lon.
     * These are used to generate one bbox URL per dong (no zoom-level omissions).
     */
    private DONG_CORTAR_REGISTRY: Record<string, { name: string; cortarNo: string; lat: number; lon: number }[]> = {
        '1171000000': [ // Songpa-gu (Full coverage - 16 points for absolute completeness)
            { name: '잠실동', cortarNo: '1171010100', lat: 37.510, lon: 127.085 },
            { name: '신천동', cortarNo: '1171010200', lat: 37.519, lon: 127.103 }, // RESTORED
            { name: '풍납동', cortarNo: '1171010300', lat: 37.525, lon: 127.115 },
            { name: '송파동', cortarNo: '1171010400', lat: 37.505, lon: 127.110 }, // RESTORED
            { name: '석촌동', cortarNo: '1171010500', lat: 37.505, lon: 127.105 },
            { name: '삼전동', cortarNo: '1171010600', lat: 37.502, lon: 127.092 },
            { name: '가락동(헬리오)', cortarNo: '1171010700', lat: 37.495, lon: 127.110 },
            { name: '가락동(경찰병원)', cortarNo: '1171010700', lat: 37.495, lon: 127.121 },
            { name: '문정동(훼밀리)', cortarNo: '1171010800', lat: 37.490, lon: 127.125 },
            { name: '문정동(래미안)', cortarNo: '1171010800', lat: 37.484, lon: 127.135 },
            { name: '장지동', cortarNo: '1171010900', lat: 37.472, lon: 127.130 },
            { name: '방이동(서)', cortarNo: '1171011100', lat: 37.516, lon: 127.118 },
            { name: '방이동(남)', cortarNo: '1171011100', lat: 37.504, lon: 127.126 },
            { name: '오금동', cortarNo: '1171011200', lat: 37.502, lon: 127.130 },
            { name: '거여동', cortarNo: '1171011300', lat: 37.495, lon: 127.145 },
            { name: '마천동', cortarNo: '1171011400', lat: 37.495, lon: 127.155 },
        ],
        '1168000000': [ // Gangnam-gu
            { name: '역삼동', cortarNo: '1168010100', lat: 37.500, lon: 127.037 },
            { name: '개포동', cortarNo: '1168010300', lat: 37.480, lon: 127.057 },
            { name: '청담동', cortarNo: '1168010400', lat: 37.522, lon: 127.047 },
            { name: '삼성동', cortarNo: '1168010500', lat: 37.512, lon: 127.057 },
            { name: '대치동', cortarNo: '1168010600', lat: 37.494, lon: 127.064 },
            { name: '신사동', cortarNo: '1168010700', lat: 37.520, lon: 127.022 },
            { name: '논현동', cortarNo: '1168010800', lat: 37.511, lon: 127.030 },
            { name: '압구정동', cortarNo: '1168011000', lat: 37.528, lon: 127.027 },
            { name: '세곡동', cortarNo: '1168011100', lat: 37.465, lon: 127.103 },
            { name: '자곡동', cortarNo: '1168011200', lat: 37.465, lon: 127.090 },
            { name: '일원동', cortarNo: '1168011400', lat: 37.485, lon: 127.085 },
            { name: '수서동', cortarNo: '1168011500', lat: 37.487, lon: 127.102 },
            { name: '도곡동', cortarNo: '1168011800', lat: 37.487, lon: 127.047 },
        ],
        '1165000000': [ // Seocho-gu
            { name: '잠원동', cortarNo: '1165010100', lat: 37.515, lon: 127.012 },
            { name: '반포동', cortarNo: '1165010200', lat: 37.505, lon: 127.003 },
            { name: '서초동', cortarNo: '1165010700', lat: 37.487, lon: 127.012 },
            { name: '방배동', cortarNo: '1165010900', lat: 37.482, lon: 126.983 },
            { name: '양재동', cortarNo: '1165011000', lat: 37.475, lon: 127.035 },
        ],
        '1174000000': [ // Gangdong-gu
            { name: '고덕동', cortarNo: '1174010100', lat: 37.558, lon: 127.173 },
            { name: '상일동', cortarNo: '1174010200', lat: 37.548, lon: 127.178 },
            { name: '명일동', cortarNo: '1174010400', lat: 37.550, lon: 127.150 },
            { name: '암사동', cortarNo: '1174010500', lat: 37.551, lon: 127.132 },
            { name: '천호동', cortarNo: '1174010600', lat: 37.540, lon: 127.127 },
            { name: '성내동', cortarNo: '1174010700', lat: 37.534, lon: 127.127 },
            { name: '길동', cortarNo: '1174010800', lat: 37.537, lon: 127.140 },
            { name: '둔촌동', cortarNo: '1174010900', lat: 37.524, lon: 127.141 },
        ],
        '1144000000': [ // Mapo-gu
            { name: '공덕동', cortarNo: '1144010100', lat: 37.543, lon: 126.950 },
            { name: '아현동', cortarNo: '1144010200', lat: 37.556, lon: 126.957 },
            { name: '도화동', cortarNo: '1144010300', lat: 37.538, lon: 126.942 },
            { name: '상암동', cortarNo: '1144011000', lat: 37.570, lon: 126.892 },
            { name: '성산동', cortarNo: '1144011200', lat: 37.563, lon: 126.912 },
            { name: '합정동', cortarNo: '1144011500', lat: 37.549, lon: 126.912 },
            { name: '망원동', cortarNo: '1144011600', lat: 37.556, lon: 126.905 },
        ],
        '1117000000': [ // Yongsan-gu
            { name: '이촌동', cortarNo: '1117010100', lat: 37.523, lon: 126.968 },
            { name: '한남동', cortarNo: '1117010700', lat: 37.534, lon: 127.001 },
            { name: '효창동', cortarNo: '1117011100', lat: 37.540, lon: 126.962 },
        ],
        '1120000000': [ // Seongdong-gu
            { name: '성수동1가', cortarNo: '1120010100', lat: 37.544, lon: 127.039 },
            { name: '성수동2가', cortarNo: '1120010200', lat: 37.540, lon: 127.055 },
            { name: '옥수동', cortarNo: '1120010700', lat: 37.540, lon: 127.018 },
            { name: '금호동', cortarNo: '1120010900', lat: 37.547, lon: 127.023 },
            { name: '행당동', cortarNo: '1120011200', lat: 37.560, lon: 127.035 },
        ],
        '1147000000': [ // Yangcheon-gu
            { name: '목동', cortarNo: '1147010800', lat: 37.527, lon: 126.877 },
            { name: '신정동', cortarNo: '1147010900', lat: 37.513, lon: 126.858 },
        ],
        '1150000000': [ // Gangseo-gu
            { name: '마곡동', cortarNo: '1150010600', lat: 37.562, lon: 126.831 },
            { name: '가양동', cortarNo: '1150010700', lat: 37.558, lon: 126.854 },
            { name: '화곡동', cortarNo: '1150011100', lat: 37.543, lon: 126.847 },
        ],
        '1135000000': [ // Nowon-gu
            { name: '상계동', cortarNo: '1135010100', lat: 37.657, lon: 127.064 },
            { name: '중계동', cortarNo: '1135010200', lat: 37.644, lon: 127.075 },
            { name: '하계동', cortarNo: '1135010300', lat: 37.635, lon: 127.070 },
        ],
    };

    private async fetchWithRetry(url: string, options: any, retries = 2): Promise<Response | null> {
        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Referer': 'https://fin.land.naver.com/',
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
            ...options.headers
        };

        for (let i = 0; i <= retries; i++) {
            try {
                const response = await fetch(url, { ...options, headers });
                if (response.ok) return response;
                if (response.status === 429 || response.status === 503) {
                    console.log(`[fetchWithRetry] Rate limited (Status: ${response.status}). Retrying... (${i + 1}/${retries})`);
                    await new Promise(r => setTimeout(r, 1000 * (i + 1))); // Exponential backoff
                    continue;
                }
                return response;
            } catch (e) {
                if (i === retries) throw e;
                await new Promise(r => setTimeout(r, 1000 * (i + 1)));
            }
        }
        return null;
    }

    async generateProxyUrls(cortarNos: string[], criteria: SearchCriteria): Promise<string[]> {
        const expandedCortarNos = new Set<string>();
        const dongMeta: Record<string, { lat: number, lon: number }> = {};

        // Expansion logic: If a Gu code is provided (ending in 000000), expand to its Dongs
        for (const code of cortarNos) {
            if (this.DONG_CORTAR_REGISTRY[code]) {
                this.DONG_CORTAR_REGISTRY[code].forEach(d => {
                    expandedCortarNos.add(d.cortarNo);
                    if (!dongMeta[d.cortarNo]) {
                        dongMeta[d.cortarNo] = { lat: d.lat, lon: d.lon };
                    }
                });
            } else {
                expandedCortarNos.add(code);
                if (!dongMeta[code]) {
                    dongMeta[code] = this.getRegionCoords(code);
                }
            }
        }

        const urls: string[] = [];
        const dongs = Array.from(expandedCortarNos);
        const batchSize = 10; // Discovery is safe to parallelize more aggressively

        console.log(`[generateProxyUrls] Start scanning ${dongs.length} dongs with batchSize ${batchSize}`);

        for (let i = 0; i < dongs.length; i += batchSize) {
            const batch = dongs.slice(i, i + batchSize);

            await Promise.all(batch.map(async (cortarNo) => {
                try {
                    let complexes = await this.getComplexesByDong(cortarNo);
                    console.log(`[generateProxyUrls] Dong ${cortarNo}: Found ${complexes.length} complexes`);

                    // Optimization for large regions: Represent each dong with its top complexes to avoid timeout
                    // Songpa-gu can have 20+ dongs, each with 100+ complexes. 100s limit is tight.
                    if (dongs.length > 2) {
                        // High-Priority Scan: Top 5 APT + Top 2 OPST per dong to ensure total URLs < 200
                        const apts = complexes.filter(c => ['A01', 'APT', 'ABYG', 'JGC'].includes(c.realEstateTypeCode))
                            .sort((a, b) => (b.totalHouseholdCount || 0) - (a.totalHouseholdCount || 0));
                        const opsts = complexes.filter(c => ['OPST', 'OR'].includes(c.realEstateTypeCode))
                            .sort((a, b) => (b.totalHouseholdCount || 0) - (a.totalHouseholdCount || 0));

                        complexes = [...apts.slice(0, 5), ...opsts.slice(0, 2)];
                    } else if (dongs.length <= 2) {
                        // Single/Double Dong Search (e.g. searching only Jamsil-dong)
                        // Limiting to 30 complexes to ensure "No Filter" scenario completes within 100s
                        complexes = complexes.slice(0, 30);
                    }

                    for (const complex of complexes) {
                        // Filter complexes: Apartment (A01, APT, ABYG), Ju-sang-bok-hap (JGC), Officetel (OPST, OR)
                        const isApartment = ['A01', 'APT', 'ABYG', 'JGC', 'OPST', 'OR'].includes(complex.realEstateTypeCode);
                        if (!isApartment) continue;

                        // Household Filter (e.g. 100+)
                        if (criteria.minHouseholds && complex.totalHouseholdCount < criteria.minHouseholds) continue;

                        const complexNo = String(complex.complexNumber);
                        const complexName = complex.complexName;

                        // Store in cache for mapping phase
                        this.COMPLEX_CACHE.set(complexNo, {
                            totalHouseholdCount: complex.totalHouseholdCount,
                            name: complexName
                        });

                        // Bbox generation: Use complex center if available, else dong center
                        const lat = complex.lat || dongMeta[cortarNo]?.lat || 37.514;
                        const lon = complex.lon || dongMeta[cortarNo]?.lon || 127.105;

                        // Sub-complexes capture (radius ~1.5km)
                        const btm = lat - 0.015;
                        const top = lat + 0.015;
                        const lft = lon - 0.015;
                        const rgt = lon + 0.015;

                        // Max 1 page per complex to stay within 48s limit
                        const params = new URLSearchParams();
                        params.append('itemId', complexNo);
                        params.append('rletTpCd', 'APT:ABYG:JGC:OPST');
                        params.append('tradTpCd', criteria.tradeType === 'B1' ? 'A1:B1' : criteria.tradeType === 'B2' ? 'A1:B2' : criteria.tradeType || 'A1');
                        params.append('z', '16');
                        params.append('lat', lat.toString());
                        params.append('lon', lon.toString());
                        params.append('btm', btm.toString());
                        params.append('lft', lft.toString());
                        params.append('top', top.toString());
                        params.append('rgt', rgt.toString());
                        params.append('page', '1');
                        params.append('addon', 'COMPLEX');
                        params.append('cortarNo', cortarNo);

                        // Serverside early filter
                        if (criteria.priceMax) params.append('dprcMax', String(criteria.priceMax));
                        if (criteria.areaMin) params.append('spcMin', String(Math.floor(criteria.areaMin)));

                        const finalUrl = `${NAVER_LAND_MOBILE_HOST}/cluster/ajax/articleList?${params.toString()}`;
                        urls.push(finalUrl);
                    }
                } catch (e) {
                    console.error(`[generateProxyUrls] Error processing dong ${cortarNo}:`, e);
                }
            }));
        }

        console.log(`[generateProxyUrls] Produced ${urls.length} target URLs`);
        return urls;
    }

    /**
     * Get list of complexes in a specific Dong via fin.land.naver.com API
     */
    async getComplexesByDong(cortarNo: string): Promise<any[]> {
        const url = `https://fin.land.naver.com/front-api/v1/complex/region?eupLegalDivisionNumber=${cortarNo}&size=500&sortType=HOUSEHOLD&page=0`;

        try {
            const response = await this.fetchWithRetry(url, { method: 'GET' });
            if (!response || !response.ok) {
                console.error(`[getComplexesByDong] Failed for ${cortarNo}: Status ${response?.status}`);
                return [];
            }
            const json = await response.json();
            const list = json?.result?.list || json?.result?.complexes || [];

            return list.map((c: any) => {
                const info = c.complexInfo || {};
                return {
                    complexNumber: info.complexNumber,
                    complexName: info.name,
                    realEstateTypeCode: info.type,
                    totalHouseholdCount: info.totalHouseholdNumber || 0,
                    lat: info.latitude,
                    lon: info.longitude
                };
            });
        } catch (e) {
            console.error(`[getComplexesByDong] Error fetching for ${cortarNo}:`, e);
            return [];
        }
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
                // Use tighter bounding box (±0.005) for precision
                const btm = lat - 0.005;
                const top = lat + 0.005;
                const lft = lon - 0.005;
                const rgt = lon + 0.005;

                const allSubItems: any[] = [];
                const maxPages = 5; // Increased to 5 for better depth

                for (let page = 1; page <= maxPages; page++) {
                    const params = new URLSearchParams();
                    params.append('cortarNo', cortarNo);
                    params.append('rletTpCd', 'APT:OP'); // Standard: Apartment & Officetel
                    params.append('tradTpCd', criteria.tradeType || 'A1');
                    params.append('z', '14'); // High precision zoom (tested)
                    params.append('lat', String(lat));
                    params.append('lon', String(lon));
                    params.append('btm', String(btm.toFixed(7)));
                    params.append('lft', String(lft.toFixed(7)));
                    params.append('top', String(top.toFixed(7)));
                    params.append('rgt', String(rgt.toFixed(7)));
                    params.append('page', String(page));

                    if (criteria.priceMax) params.append('prc', `0:${criteria.priceMax}`);

                    const apiUrl = `${NAVER_LAND_MOBILE_HOST}/cluster/ajax/articleList?${params.toString()}`;

                    try {
                        const controller = new AbortController();
                        const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout

                        const response = await fetch(apiUrl, {
                            cache: 'no-store',
                            signal: controller.signal as any,
                            headers: {
                                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
                                'Referer': 'https://m.land.naver.com/'
                            }
                        });
                        clearTimeout(timeoutId);
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
            const CONCURRENCY = 2; // Reduce to avoid triggering naive rate limits

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

            const allItems = results.flat();
            return this.mapNaverItemsToProperties(allItems);

        } catch (error) {
            logger.error('NaverLandService', 'API Fetch Failed', { error });
            return [];
        }
    }

    /**
     * Parse raw Naver items (from Android Proxy) into Property array with optional criteria filtering
     */
    mapNaverItemsToProperties(allItems: any[], criteria?: SearchCriteria): Property[] {
        const uniqueMap = new Map();

        allItems.forEach((item: any) => {
            if (!uniqueMap.has(item.atclNo)) {
                // Keep track of dongName if injected by proxy, else use DONG_CODE_MAP
                const dongName = item._dongName || this.DONG_CODE_MAP[item.cortarNo] || '-';

                // Try to find complex-level household count from cache
                // The GET API doesn't return complexNo/itemId in each item, so we fallback to Name matching
                const complexId = item.complexNo || item.itemId || '';
                let complexInfo = this.COMPLEX_CACHE.get(complexId);

                if (!complexInfo && item.atclNm) {
                    // Search all cache entries for a name match (simple but effective fallback)
                    // We look for the longest match to be precise
                    let bestMatch: any = null;
                    for (const [id, info] of this.COMPLEX_CACHE.entries()) {
                        if (item.atclNm.includes(info.name)) {
                            if (!bestMatch || info.name.length > bestMatch.name.length) {
                                bestMatch = info;
                            }
                        }
                    }
                    if (bestMatch) complexInfo = bestMatch;
                }

                const households = complexInfo?.totalHouseholdCount || 0;

                uniqueMap.set(item.atclNo, {
                    ...item,
                    _dongName: dongName,
                    _households: households
                });
            }
        });

        const uniqueList = Array.from(uniqueMap.values());

        const articles = uniqueList.map((item: any) => {
            const spc1 = typeof item.spc1 === 'string' ? parseFloat(item.spc1) : (Number(item.spc1) || 0);
            const price = typeof item.prc === 'number' ? item.prc : (parseInt(item.prc) || 0);

            // Extract room information from tagList or raw field
            const tags = Array.isArray(item.tagList) ? item.tagList : [];
            // Naver Mobile GET API uses Korean tags like '방네개이상' or '방다섯개이상'
            const has4Rooms = tags.includes('FOURROOM') ||
                tags.includes('방네개이상') ||
                tags.includes('방다섯개이상') ||
                tags.includes('대형평수') ||
                (item.rom && parseInt(item.rom) >= 4);

            return {
                id: String(item.atclNo || Math.random().toString(36).substr(2, 9)),
                name: item.atclNm || item.atclName || 'Unknown Property',
                price: price,
                households: item._households || 0,
                area: {
                    m2: spc1,
                    pyeong: spc1 > 0 ? Math.round(spc1 / 3.3058) : 0
                },
                link: item.atclNo ? `https://m.land.naver.com/article/info/${item.atclNo}` : '#',
                note: undefined,
                _rawPrice: price,
                dongName: item._dongName || '-',
                cortarNo: item.cortarNo || '',
                _has4Rooms: has4Rooms
            };
        });

        // Final Filter based on Criteria (Room Count, Households, Price Range)
        const filteredList = articles.filter(p => {
            if (!p) return false;

            // 1. Price Max (Code-side check for 100% safety)
            if (criteria?.priceMax && p.price > criteria.priceMax) return false;

            // 2. Room Count (4+) - Include fallback for missing tags
            if (criteria?.roomCount && criteria.roomCount >= 4 && !p._has4Rooms) {
                // If it's a very large area but tags are missing, maybe we should keep it? 
                // For now, stick to the tags found by subagent.
                return false;
            }

            // 3. Households (100+)
            if (criteria?.minHouseholds && p.households < criteria.minHouseholds) {
                return false;
            }

            return true;
        });

        filteredList.sort((a, b) => {
            const dongA = a.dongName || '';
            const dongB = b.dongName || '';
            if (dongA !== dongB) {
                return dongA.localeCompare(dongB);
            }
            return a.price - b.price;
        });

        return filteredList;
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
