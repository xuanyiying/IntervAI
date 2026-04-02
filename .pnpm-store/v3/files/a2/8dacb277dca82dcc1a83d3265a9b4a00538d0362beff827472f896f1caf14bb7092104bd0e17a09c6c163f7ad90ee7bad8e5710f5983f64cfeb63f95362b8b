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
exports.ProductsResource = void 0;
const index_js_1 = require("../../internal/base/index.js");
const index_js_2 = require("../../entities/index.js");
const ProductPaths = {
    list: '/products',
    create: '/products',
    get: '/products/{product_id}',
    update: '/products/{product_id}',
};
__exportStar(require("./operations/index.js"), exports);
class ProductsResource extends index_js_1.BaseResource {
    list(queryParams) {
        const queryParameters = new index_js_1.QueryParameters(queryParams);
        return new index_js_2.ProductCollection(this.client, ProductPaths.list + queryParameters.toQueryString());
    }
    async create(createProductParameters) {
        const response = await this.client.post(ProductPaths.create, createProductParameters);
        const data = this.handleResponse(response);
        return new index_js_2.Product(data);
    }
    async get(productId, queryParams) {
        const queryParameters = new index_js_1.QueryParameters(queryParams);
        const urlWithPathParams = new index_js_1.PathParameters(ProductPaths.get, {
            product_id: productId,
        }).deriveUrl();
        const response = await this.client.get(urlWithPathParams, queryParameters);
        const data = this.handleResponse(response);
        return new index_js_2.Product(data);
    }
    async update(productId, updateProduct) {
        const urlWithPathParams = new index_js_1.PathParameters(ProductPaths.update, {
            product_id: productId,
        }).deriveUrl();
        const response = await this.client.patch(urlWithPathParams, updateProduct);
        const data = this.handleResponse(response);
        return new index_js_2.Product(data);
    }
    async archive(productId) {
        return await this.update(productId, { status: 'archived' });
    }
}
exports.ProductsResource = ProductsResource;
