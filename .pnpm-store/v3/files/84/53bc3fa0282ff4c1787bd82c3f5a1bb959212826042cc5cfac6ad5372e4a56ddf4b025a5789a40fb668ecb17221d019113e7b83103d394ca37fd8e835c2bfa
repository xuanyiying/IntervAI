import { Logger } from 'winston';
import { LoggerService } from '@nestjs/common';
export declare class WinstonLogger implements LoggerService {
    private readonly logger;
    private context?;
    constructor(logger: Logger);
    setContext(context: string): void;
    log(message: any, context?: string): any;
    fatal(message: any, trace?: string, context?: string): any;
    error(message: any, trace?: string, context?: string): any;
    warn(message: any, context?: string): any;
    debug?(message: any, context?: string): any;
    verbose?(message: any, context?: string): any;
    getWinstonLogger(): Logger;
}
