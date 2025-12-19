export type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG' | 'NETWORK';

export interface LogEntry {
    timestamp: string;
    level: LogLevel;
    context: string;
    message: string;
    data?: any;
}

class DebugLogger {
    private logs: LogEntry[] = [];

    log(level: LogLevel, context: string, message: string, data?: any) {
        const entry: LogEntry = {
            timestamp: new Date().toISOString(),
            level,
            context,
            message,
            data,
        };

        // Console output for development
        if (process.env.NODE_ENV !== 'production') {
            const color = level === 'ERROR' ? '\x1b[31m' : level === 'WARN' ? '\x1b[33m' : '\x1b[36m';
            console.log(`${color}[${level}] [${context}] ${message}\x1b[0m`, data || '');
        }

        // Store in memory (limited to last 1000 logs)
        this.logs.push(entry);
        if (this.logs.length > 1000) this.logs.shift();
    }

    debug(context: string, message: string, data?: any) {
        this.log('DEBUG', context, message, data);
    }

    info(context: string, message: string, data?: any) {
        this.log('INFO', context, message, data);
    }

    warn(context: string, message: string, data?: any) {
        this.log('WARN', context, message, data);
    }

    error(context: string, message: string, data?: any) {
        this.log('ERROR', context, message, data);
    }

    network(url: string, method: string, status: number, body: any) {
        this.log('NETWORK', 'API', `${method} ${url} (${status})`, body);
    }

    getLogs() {
        return this.logs;
    }

    clear() {
        this.logs = [];
    }
}

export const logger = new DebugLogger();
