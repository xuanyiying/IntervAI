import { type Client } from '../api/client.js';
import { type ErrorResponse, type ResponsePaginated } from '../types/response.js';
export declare abstract class Collection<T, C> implements AsyncIterable<C> {
    private readonly client;
    hasMore: boolean;
    estimatedTotal: number;
    private nextLink;
    private data;
    constructor(client: Client, initialUri: string);
    next(): Promise<C[]>;
    protected handlePaginatedResponse<T>(response: ResponsePaginated<T> | ErrorResponse): ResponsePaginated<T>;
    abstract fromJson(data: any): C;
    [Symbol.asyncIterator](): AsyncIterator<C>;
}
