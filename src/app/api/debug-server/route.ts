import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // Exact logic from naverLand.ts
        const cortarNo = '1171000000'; // Songpa
        const lat = 37.514544;
        const lon = 127.105918;
        const boxSize = 0.08; // 8km

        const btm = lat - boxSize;
        const top = lat + boxSize;
        const lft = lon - boxSize;
        const rgt = lon + boxSize;

        const params = new URLSearchParams();
        params.append('cortarNo', cortarNo);
        params.append('rletTpCd', 'APT:ABYG:JGC');
        params.append('tradTpCd', 'A1');
        params.append('z', '16');
        params.append('lat', String(lat));
        params.append('lon', String(lon));
        params.append('btm', String(btm.toFixed(7)));
        params.append('lft', String(lft.toFixed(7)));
        params.append('top', String(top.toFixed(7)));
        params.append('rgt', String(rgt.toFixed(7)));
        params.append('page', '1');
        params.append('prc', '0:200000');
        params.append('spcMin', '120');
        params.append('rom', '4');

        const apiUrl = `https://m.land.naver.com/cluster/ajax/articleList?${params.toString()}`;

        const headers = {
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
            'Referer': 'https://m.land.naver.com/'
        };

        const response = await fetch(apiUrl, { headers });
        const text = await response.text();

        let json;
        try {
            json = JSON.parse(text);
        } catch {
            json = null;
        }

        return NextResponse.json({
            status: response.status,
            apiUrl,
            rawTextLen: text.length,
            isJson: !!json,
            jsonBodySample: json?.body?.[0] || 'No items',
            totalItems: json?.body?.length || 0,
            fullResponse: json || text
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 });
    }
}
