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
exports.PaymentMethodsResource = void 0;
const index_js_1 = require("../../entities/index.js");
const index_js_2 = require("../../internal/base/index.js");
__exportStar(require("./operations/index.js"), exports);
const PaymentMethodPaths = {
    list: '/customers/{customer_id}/payment-methods',
    get: '/customers/{customer_id}/payment-methods/{payment_method_id}',
    delete: '/customers/{customer_id}/payment-methods/{payment_method_id}',
};
class PaymentMethodsResource extends index_js_2.BaseResource {
    list(customerId, queryParams) {
        const queryParameters = new index_js_2.QueryParameters(queryParams);
        const urlWithPathParams = new index_js_2.PathParameters(PaymentMethodPaths.list, {
            customer_id: customerId,
        }).deriveUrl();
        return new index_js_1.PaymentMethodCollection(this.client, urlWithPathParams + queryParameters.toQueryString());
    }
    async get(customerId, paymentMethodId) {
        const urlWithPathParams = new index_js_2.PathParameters(PaymentMethodPaths.get, {
            customer_id: customerId,
            payment_method_id: paymentMethodId,
        }).deriveUrl();
        const response = await this.client.get(urlWithPathParams);
        const data = this.handleResponse(response);
        return new index_js_1.PaymentMethod(data);
    }
    async delete(customerId, paymentMethodId) {
        const urlWithPathParams = new index_js_2.PathParameters(PaymentMethodPaths.delete, {
            customer_id: customerId,
            payment_method_id: paymentMethodId,
        }).deriveUrl();
        const response = await this.client.delete(urlWithPathParams);
        if (response) {
            this.handleResponse(response);
        }
    }
}
exports.PaymentMethodsResource = PaymentMethodsResource;
