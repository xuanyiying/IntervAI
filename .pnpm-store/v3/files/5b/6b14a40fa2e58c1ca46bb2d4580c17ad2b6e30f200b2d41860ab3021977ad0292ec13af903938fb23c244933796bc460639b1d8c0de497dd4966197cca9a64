"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Collection = void 0;
const response_js_1 = require("../types/response.js");
const generic_js_1 = require("../errors/generic.js");
class Collection {
    client;
    hasMore = true;
    estimatedTotal = 0;
    nextLink;
    data = [];
    constructor(client, initialUri) {
        this.client = client;
        this.nextLink = initialUri;
    }
    async next() {
        const response = await this.client.get(this.nextLink);
        const handledResponse = this.handlePaginatedResponse(response);
        this.hasMore = handledResponse.meta.pagination.has_more ?? false;
        this.nextLink = handledResponse.meta.pagination.next;
        this.estimatedTotal = handledResponse.meta.pagination.estimated_total ?? 0;
        this.data = handledResponse.data.map((data) => this.fromJson(data));
        return this.data.length > 0 ? this.data : [];
    }
    handlePaginatedResponse(response) {
        const entityResponse = response;
        const error = response;
        if (error.error) {
            const retryAfterHeader = error[response_js_1.rawResponse]?.headers.get('Retry-After');
            const retryAfter = retryAfterHeader ? parseInt(retryAfterHeader, 10) : null;
            throw new generic_js_1.ApiError(error.error, retryAfter);
        }
        return entityResponse;
    }
    async *[Symbol.asyncIterator]() {
        while (this.hasMore) {
            await this.next();
            for (let index = 0; index < this.data.length; index++) {
                if (this.data[index]) {
                    yield this.data[index];
                }
            }
        }
    }
}
exports.Collection = Collection;
