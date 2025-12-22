import { NextResponse } from 'next/server';
import { naverLand } from '@/services/naverLand';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        // Default: Pungnap 1 point
        const cortarNo = searchParams.get('cortarNo') || '1171000000';

        // Manual criteria mimicking the failing search
        const criteria = {
            tradeType: 'A1',
            priceMax: 200000,
            areaMin: 120,
            roomCount: 4
        } as any;

        // Call the service directly
        // We will target Pungnap1 explicitly to test a specific known point
        // Pungnap1: 37.538, 127.123
        // But getArticleList iterates points.

        const results = await naverLand.getArticleList(cortarNo, criteria);

        return NextResponse.json({
            success: true,
            count: results.length,
            sample: results.slice(0, 3), // Show first 3
            params: { cortarNo, criteria }
        });

    } catch (e: any) {
        return NextResponse.json({
            success: false,
            error: e.message,
            stack: e.stack
        }, { status: 500 });
    }
}
