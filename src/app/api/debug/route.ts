import { NextResponse } from 'next/server';
import { naverLand } from '@/services/naverLand';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs'; // Force Node.js runtime for Puppeteer
export const dynamic = 'force-dynamic'; // Disable caching

export async function GET(request: Request) {
    logger.info('API_DEBUG', 'Debug Request Started');
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const keyword = searchParams.get('keyword');

    logger.info('API_DEBUG', 'Debug Endpoint Hit', { action, keyword });

    try {
        let result = {};

        if (action === 'test_search') {
            // Call public method (Puppeteer Scraper)
            const rawList = await naverLand.getArticleList('1168000000', {
                tradeType: 'A1',
                priceMax: 50 * 10000,
                areaMin: 84
            });

            result = rawList.slice(0, 20);
        }

        return NextResponse.json({
            status: 'ok',
            meta: { action },
            data: result
        });
    } catch (error: any) {
        logger.error('API_DEBUG', 'Error Handler', error);
        return new NextResponse(`Error: ${error.message}\n${JSON.stringify(error, null, 2)}`, { status: 500 });
    }
}
