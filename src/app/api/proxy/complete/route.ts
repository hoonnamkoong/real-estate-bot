import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const maxDuration = 45;

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { jobId, result, status } = body;

        if (!jobId) {
            return NextResponse.json({ success: false, error: 'jobId is required' }, { status: 400 });
        }

        const job = await prisma.searchJob.update({
            where: { id: jobId },
            data: {
                status: status || 'COMPLETED',
                result: result || []
            }
        });

        return NextResponse.json({ success: true, job });
    } catch (error: any) {
        console.error('Error completing job:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
