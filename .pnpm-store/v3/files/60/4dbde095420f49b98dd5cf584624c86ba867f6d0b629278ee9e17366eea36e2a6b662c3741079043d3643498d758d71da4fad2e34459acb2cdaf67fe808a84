import { rawResponse } from '../types/response.js';
import { ApiError } from '../errors/generic.js';
export class BaseResource {
    client;
    constructor(client) {
        this.client = client;
    }
    handleError(error) {
        if (error.error) {
            const retryAfterHeader = error[rawResponse]?.headers.get('Retry-After');
            const retryAfter = retryAfterHeader ? parseInt(retryAfterHeader, 10) : null;
            throw new ApiError(error.error, retryAfter);
        }
    }
    handleResponse(response) {
        const entityResponse = response;
        const error = response;
        this.handleError(error);
        return entityResponse.data;
    }
}
