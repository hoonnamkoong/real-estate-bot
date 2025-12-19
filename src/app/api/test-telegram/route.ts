import { NextResponse } from 'next/server';
import { telegram } from '@/lib/telegram';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const chatId = searchParams.get('chatId') || process.env.TELEGRAM_CHAT_ID;

        if (!chatId) {
            return NextResponse.json({ error: 'Chat ID not configured' }, { status: 400 });
        }

        // Use the singleton instance
        await telegram.sendMessage('🔔 [Test] Telegram Notification from Real Estate Bot is working!');

        return NextResponse.json({ success: true, message: 'Message sent', chatId });
    } catch (error) {
        console.error('Telegram Test Error:', error);
        return NextResponse.json({ error: 'Failed to send message', details: String(error) }, { status: 500 });
    }
}
