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
exports.PricesResource = void 0;
const index_js_1 = require("../../internal/base/index.js");
const index_js_2 = require("../../entities/index.js");
const PricePaths = {
    list: '/prices',
    create: '/prices',
    get: '/prices/{price_id}',
    update: '/prices/{price_id}',
};
__exportStar(require("./operations/index.js"), exports);
class PricesResource extends index_js_1.BaseResource {
    list(queryParams) {
        const queryParameters = new index_js_1.QueryParameters(queryParams);
        return new index_js_2.PriceCollection(this.client, PricePaths.list + queryParameters.toQueryString());
    }
    async create(createPriceParameters) {
        const response = await this.client.post(PricePaths.create, createPriceParameters);
        const data = this.handleResponse(response);
        return new index_js_2.Price(data);
    }
    async get(priceId, queryParams) {
        const queryParameters = new index_js_1.QueryParameters(queryParams);
        const urlWithPathParams = new index_js_1.PathParameters(PricePaths.get, {
            price_id: priceId,
        }).deriveUrl();
        const response = await this.client.get(urlWithPathParams, queryParameters);
        const data = this.handleResponse(response);
        return new index_js_2.Price(data);
    }
    async update(priceId, updatePrice) {
        const urlWithPathParams = new index_js_1.PathParameters(PricePaths.update, {
            price_id: priceId,
        }).deriveUrl();
        const response = await this.client.patch(urlWithPathParams, updatePrice);
        const data = this.handleResponse(response);
        return new index_js_2.Price(data);
    }
    async archive(priceId) {
        return await this.update(priceId, { status: 'archived' });
    }
}
exports.PricesResource = PricesResource;
