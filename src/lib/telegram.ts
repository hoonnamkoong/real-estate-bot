import { logger } from '@/lib/logger';

export class TelegramManager {
    private token: string;
    private chatId: string;

    constructor() {
        this.token = process.env.TELEGRAM_BOT_TOKEN || '';
        this.chatId = process.env.TELEGRAM_CHAT_ID || '';

        if (!this.token || !this.chatId) {
            logger.warn('TelegramManager', 'Missing Credentials');
        }
    }

    async sendMessage(text: string, parseMode: 'HTML' | 'Markdown' = 'HTML') {
        if (!this.token || !this.chatId) {
            logger.info('TelegramManager', 'Skipping Send (No Credentials)', { text });
            return false;
        }

        const url = `https://api.telegram.org/bot${this.token}/sendMessage`;
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: this.chatId,
                    text,
                    parse_mode: parseMode,
                }),
            });

            const data = await response.json();
            if (!data.ok) {
                logger.error('TelegramManager', 'Send Failed', data);
                return false;
            }

            logger.info('TelegramManager', 'Message Sent', { textLength: text.length });
            return true;
        } catch (error) {
            logger.error('TelegramManager', 'Network Error', error);
            return false;
        }
    }
}

export const telegram = new TelegramManager();
