import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const maxDuration = 45;

export async function GET() {
    try {
        const job = await prisma.searchJob.findFirst({
            where: { status: 'PENDING' },
            orderBy: { createdAt: 'asc' } // oldest first
        });

        if (!job) {
            return NextResponse.json({ success: true, job: null });
        }

        // Mark as processing so another agent doesn't take it
        await prisma.searchJob.update({
            where: { id: job.id },
            data: { status: 'PROCESSING' }
        });

        return NextResponse.json({ success: true, job });
    } catch (error: any) {
        console.error('Error fetching pending job:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
