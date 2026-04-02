"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = void 0;
const index_js_1 = require("../api/index.js");
class Logger {
    static logLevel;
    static shouldLog(level) {
        switch (Logger.logLevel) {
            case index_js_1.LogLevel.verbose:
                return level !== index_js_1.LogLevel.none;
            case index_js_1.LogLevel.warn:
                return level === index_js_1.LogLevel.warn || level === index_js_1.LogLevel.error;
            case index_js_1.LogLevel.error:
                return level === index_js_1.LogLevel.error;
            default:
                return false;
        }
    }
    static log(...args) {
        if (Logger.shouldLog(index_js_1.LogLevel.verbose)) {
            console.log('[Paddle] [LOG]', ...args);
        }
    }
    static warn(...args) {
        if (Logger.shouldLog(index_js_1.LogLevel.warn)) {
            console.warn('[Paddle] [WARN]', ...args);
        }
    }
    static error(...args) {
        if (Logger.shouldLog(index_js_1.LogLevel.error)) {
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
exports.Logger = Logger;
