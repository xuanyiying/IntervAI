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
exports.CustomersResource = void 0;
const index_js_1 = require("../../internal/base/index.js");
const index_js_2 = require("../../entities/index.js");
const CustomerPaths = {
    list: '/customers',
    create: '/customers',
    get: '/customers/{customer_id}',
    update: '/customers/{customer_id}',
    getCustomerBalance: '/customers/{customer_id}/credit-balances',
    generate: '/customers/{customer_id}/auth-token',
};
__exportStar(require("./operations/index.js"), exports);
class CustomersResource extends index_js_1.BaseResource {
    list(queryParams) {
        const queryParameters = new index_js_1.QueryParameters(queryParams);
        return new index_js_2.CustomerCollection(this.client, CustomerPaths.list + queryParameters.toQueryString());
    }
    async create(createCustomerParameters) {
        const response = await this.client.post(CustomerPaths.create, createCustomerParameters);
        const data = this.handleResponse(response);
        return new index_js_2.Customer(data);
    }
    async get(customerId) {
        const urlWithPathParams = new index_js_1.PathParameters(CustomerPaths.get, {
            customer_id: customerId,
        }).deriveUrl();
        const response = await this.client.get(urlWithPathParams);
        const data = this.handleResponse(response);
        return new index_js_2.Customer(data);
    }
    async update(customerId, updateCustomer) {
        const urlWithPathParams = new index_js_1.PathParameters(CustomerPaths.update, {
            customer_id: customerId,
        }).deriveUrl();
        const response = await this.client.patch(urlWithPathParams, updateCustomer);
        const data = this.handleResponse(response);
        return new index_js_2.Customer(data);
    }
    async getCreditBalance(customerId, queryParams) {
        const urlWithPathParams = new index_js_1.PathParameters(CustomerPaths.getCustomerBalance, {
            customer_id: customerId,
        }).deriveUrl();
        const queryParameters = new index_js_1.QueryParameters(queryParams);
        const response = await this.client.get(urlWithPathParams, queryParameters);
        const data = this.handleResponse(response);
        return data.map((balance) => new index_js_2.CreditBalance(balance));
    }
    async archive(customerId) {
        return await this.update(customerId, { status: 'archived' });
    }
    async generateAuthToken(customerId) {
        const urlWithPathParams = new index_js_1.PathParameters(CustomerPaths.generate, {
            customer_id: customerId,
        }).deriveUrl();
        const response = await this.client.post(urlWithPathParams, undefined);
        const data = this.handleResponse(response);
        return new index_js_2.AuthToken(data);
    }
}
exports.CustomersResource = CustomersResource;
