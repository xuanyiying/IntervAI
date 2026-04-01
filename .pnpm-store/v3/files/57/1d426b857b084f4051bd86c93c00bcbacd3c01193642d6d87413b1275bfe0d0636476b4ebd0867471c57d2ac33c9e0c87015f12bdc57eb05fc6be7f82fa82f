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
exports.DiscountGroupsResource = void 0;
const index_js_1 = require("../../entities/index.js");
const index_js_2 = require("../../internal/base/index.js");
const DiscountGroupPaths = {
    list: '/discount-groups',
    create: '/discount-groups',
    get: '/discount-groups/{discount_group_id}',
    update: '/discount-groups/{discount_group_id}',
};
__exportStar(require("./operations/index.js"), exports);
class DiscountGroupsResource extends index_js_2.BaseResource {
    list(queryParams) {
        const queryParameters = new index_js_2.QueryParameters(queryParams);
        return new index_js_1.DiscountGroupCollection(this.client, DiscountGroupPaths.list + queryParameters.toQueryString());
    }
    async create(createDiscountGroupRequestBody) {
        const response = await this.client.post(DiscountGroupPaths.create, createDiscountGroupRequestBody);
        const data = this.handleResponse(response);
        return new index_js_1.DiscountGroup(data);
    }
    async get(discountGroupId) {
        const urlWithPathParams = new index_js_2.PathParameters(DiscountGroupPaths.get, {
            discount_group_id: discountGroupId,
        }).deriveUrl();
        const response = await this.client.get(urlWithPathParams);
        const data = this.handleResponse(response);
        return new index_js_1.DiscountGroup(data);
    }
    async update(discountGroupId, updateDiscountGroup) {
        const urlWithPathParams = new index_js_2.PathParameters(DiscountGroupPaths.update, {
            discount_group_id: discountGroupId,
        }).deriveUrl();
        const response = await this.client.patch(urlWithPathParams, updateDiscountGroup);
        const data = this.handleResponse(response);
        return new index_js_1.DiscountGroup(data);
    }
    async archive(discountGroupId) {
        return await this.update(discountGroupId, { status: 'archived' });
    }
}
exports.DiscountGroupsResource = DiscountGroupsResource;
