"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseResource = void 0;
const response_js_1 = require("../types/response.js");
const generic_js_1 = require("../errors/generic.js");
class BaseResource {
    client;
    constructor(client) {
        this.client = client;
    }
    handleError(error) {
        if (error.error) {
            const retryAfterHeader = error[response_js_1.rawResponse]?.headers.get('Retry-After');
            const retryAfter = retryAfterHeader ? parseInt(retryAfterHeader, 10) : null;
            throw new generic_js_1.ApiError(error.error, retryAfter);
        }
    }
    handleResponse(response) {
        const entityResponse = response;
        const error = response;
        this.handleError(error);
        return entityResponse.data;
    }
}
exports.BaseResource = BaseResource;
