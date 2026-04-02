import { type Client } from '../api/client.js';
import { type Response, type ErrorResponse } from '../types/response.js';
export declare class BaseResource {
    protected readonly client: Client;
    constructor(client: Client);
    protected handleError(error: ErrorResponse): void;
    protected handleResponse<T>(response: Response<T> | ErrorResponse): T;
}
