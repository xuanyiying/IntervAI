import { LogLevel } from '../api/index.js';
type LogInputProps = Array<string | undefined | null>;
export declare class Logger {
    static logLevel: LogLevel;
    private static shouldLog;
    static log(...args: LogInputProps): void;
    static warn(...args: LogInputProps): void;
    static error(...args: LogInputProps): void;
    static logRequest(method: string, url: string | undefined, headers: Record<string, string>): void;
    static logResponse(method: string, url: string | undefined, headers: Record<string, string>, promise: Response): void;
}
export {};
