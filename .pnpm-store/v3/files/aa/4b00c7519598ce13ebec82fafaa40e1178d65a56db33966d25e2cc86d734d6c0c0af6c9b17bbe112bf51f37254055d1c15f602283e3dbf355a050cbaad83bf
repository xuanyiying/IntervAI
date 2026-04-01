import { type ErrorDetail, type ErrorField } from '../types/response.js';
export declare class ApiError extends Error {
    readonly type: string;
    readonly code: string;
    readonly detail: string;
    readonly documentationUrl: string;
    readonly errors: ErrorField[] | null;
    readonly retryAfter: number | null;
    constructor(errorDetail: ErrorDetail, retryAfter: number | null);
}
