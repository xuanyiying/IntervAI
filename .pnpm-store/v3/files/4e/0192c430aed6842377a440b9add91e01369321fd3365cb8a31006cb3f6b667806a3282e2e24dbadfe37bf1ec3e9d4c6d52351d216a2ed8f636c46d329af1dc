"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerPortalSessionsResource = void 0;
const index_js_1 = require("../../entities/index.js");
const index_js_2 = require("../../internal/base/index.js");
const CustomerPortalSessionPaths = {
    create: '/customers/{customer_id}/portal-sessions',
};
class CustomerPortalSessionsResource extends index_js_2.BaseResource {
    async create(customerId, subscriptionIds) {
        const urlWithPathParams = new index_js_2.PathParameters(CustomerPortalSessionPaths.create, {
            customer_id: customerId,
        }).deriveUrl();
        const response = await this.client.post(urlWithPathParams, {
            subscriptionIds,
        });
        const data = this.handleResponse(response);
        return new index_js_1.CustomerPortalSession(data);
    }
}
exports.CustomerPortalSessionsResource = CustomerPortalSessionsResource;
