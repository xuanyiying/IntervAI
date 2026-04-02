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
exports.DiscountsResource = void 0;
const index_js_1 = require("../../internal/base/index.js");
const index_js_2 = require("../../entities/index.js");
const DiscountPaths = {
    list: '/discounts',
    create: '/discounts',
    get: '/discounts/{discount_id}',
    update: '/discounts/{discount_id}',
};
__exportStar(require("./operations/index.js"), exports);
class DiscountsResource extends index_js_1.BaseResource {
    list(queryParams) {
        const queryParameters = new index_js_1.QueryParameters(queryParams);
        return new index_js_2.DiscountCollection(this.client, DiscountPaths.list + queryParameters.toQueryString());
    }
    async create(createDiscountParameters) {
        const response = await this.client.post(DiscountPaths.create, createDiscountParameters);
        const data = this.handleResponse(response);
        return new index_js_2.Discount(data);
    }
    async get(discountId, queryParams) {
        const queryParameters = new index_js_1.QueryParameters(queryParams);
        const urlWithPathParams = new index_js_1.PathParameters(DiscountPaths.get, {
            discount_id: discountId,
        }).deriveUrl();
        const response = await this.client.get(urlWithPathParams + queryParameters.toQueryString());
        const data = this.handleResponse(response);
        return new index_js_2.Discount(data);
    }
    async update(discountId, updateDiscount) {
        const urlWithPathParams = new index_js_1.PathParameters(DiscountPaths.update, {
            discount_id: discountId,
        }).deriveUrl();
        const response = await this.client.patch(urlWithPathParams, updateDiscount);
        const data = this.handleResponse(response);
        return new index_js_2.Discount(data);
    }
    async archive(discountId) {
        return await this.update(discountId, { status: 'archived' });
    }
}
exports.DiscountsResource = DiscountsResource;
