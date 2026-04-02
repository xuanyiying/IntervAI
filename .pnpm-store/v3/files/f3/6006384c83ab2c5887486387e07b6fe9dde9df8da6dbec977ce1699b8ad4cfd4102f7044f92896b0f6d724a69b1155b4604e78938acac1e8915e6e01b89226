import { LogLevel } from '../api/index.js';
export class Logger {
    static logLevel;
    static shouldLog(level) {
        switch (Logger.logLevel) {
            case LogLevel.verbose:
                return level !== LogLevel.none;
            case LogLevel.warn:
                return level === LogLevel.warn || level === LogLevel.error;
            case LogLevel.error:
                return level === LogLevel.error;
            default:
                return false;
        }
    }
    static log(...args) {
        if (Logger.shouldLog(LogLevel.verbose)) {
            console.log('[Paddle] [LOG]', ...args);
        }
    }
    static warn(...args) {
        if (Logger.shouldLog(LogLevel.warn)) {
            console.warn('[Paddle] [WARN]', ...args);
        }
    }
    static error(...args) {
        if (Logger.shouldLog(LogLevel.error)) {
            console.error('[Paddle] [ERROR]', ...args);
        }
    }
    static logRequest(method, url, headers) {
        Logger.log('[Request]', method, url, 'Transaction ID:', headers['X-Transaction-ID']);
    }
    static logResponse(method, url, headers, promise) {
        Logger.log('[Response]', method, url, promise.status.toString(), 'Transaction ID:', headers['X-Transaction-ID'], 'Request ID:', promise.headers.get('Request-Id'));
    }
}
