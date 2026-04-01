"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BusinessesResource = void 0;
const index_js_1 = require("../../internal/base/index.js");
const index_js_2 = require("../../entities/index.js");
const BusinessPaths = {
    list: '/customers/{customer_id}/businesses',
    create: '/customers/{customer_id}/businesses',
    get: '/customers/{customer_id}/businesses/{business_id}',
    update: '/customers/{customer_id}/businesses/{business_id}',
};
__exportStar(require("./operations/index.js"), exports);
class BusinessesResource extends index_js_1.BaseResource {
    list(customerId, queryParams) {
        const queryParameters = new index_js_1.QueryParameters(queryParams);
        const urlWithPathParams = new index_js_1.PathParameters(BusinessPaths.list, {
            customer_id: customerId,
        }).deriveUrl();
        return new index_js_2.BusinessCollection(this.client, urlWithPathParams + queryParameters.toQueryString());
    }
    async create(customerId, createBusinessParameters) {
        const urlWithPathParams = new index_js_1.PathParameters(BusinessPaths.create, {
            customer_id: customerId,
        }).deriveUrl();
        const response = await this.client.post(urlWithPathParams, createBusinessParameters);
        const data = this.handleResponse(response);
        return new index_js_2.Business(data);
    }
    async get(customerId, businessId) {
        const urlWithPathParams = new index_js_1.PathParameters(BusinessPaths.get, {
            customer_id: customerId,
            business_id: businessId,
        }).deriveUrl();
        const response = await this.client.get(urlWithPathParams);
        const data = this.handleResponse(response);
        return new index_js_2.Business(data);
    }
    async update(customerId, businessId, updateBusiness) {
        const urlWithPathParams = new index_js_1.PathParameters(BusinessPaths.update, {
            customer_id: customerId,
            business_id: businessId,
        }).deriveUrl();
        const response = await this.client.patch(urlWithPathParams, updateBusiness);
        const data = this.handleResponse(response);
        return new index_js_2.Business(data);
    }
    async archive(customerId, businessId) {
        return await this.update(customerId, businessId, { status: 'archived' });
    }
}
exports.BusinessesResource = BusinessesResource;
