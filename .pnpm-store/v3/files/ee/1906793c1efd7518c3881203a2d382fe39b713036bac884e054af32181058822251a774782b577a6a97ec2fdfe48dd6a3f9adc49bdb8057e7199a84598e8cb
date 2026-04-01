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
exports.SubscriptionsResource = void 0;
const index_js_1 = require("../../internal/base/index.js");
const index_js_2 = require("../../entities/index.js");
const SubscriptionPaths = {
    get: '/subscriptions/{subscription_id}',
    update: '/subscriptions/{subscription_id}',
    updatePreview: '/subscriptions/{subscription_id}/preview',
    list: '/subscriptions',
    cancel: '/subscriptions/{subscription_id}/cancel',
    pause: '/subscriptions/{subscription_id}/pause',
    resume: '/subscriptions/{subscription_id}/resume',
    activate: '/subscriptions/{subscription_id}/activate',
    createOneTimeCharge: '/subscriptions/{subscription_id}/charge',
    previewOneTimeCharge: '/subscriptions/{subscription_id}/charge/preview',
    getTransactionToUpdatePaymentMethod: '/subscriptions/{subscription_id}/update-payment-method-transaction',
};
__exportStar(require("./operations/index.js"), exports);
class SubscriptionsResource extends index_js_1.BaseResource {
    async previewUpdate(subscriptionId, updateSubscription) {
        const urlWithPathParams = new index_js_1.PathParameters(SubscriptionPaths.updatePreview, {
            subscription_id: subscriptionId,
        }).deriveUrl();
        const response = await this.client.patch(urlWithPathParams, updateSubscription);
        const data = this.handleResponse(response);
        return new index_js_2.SubscriptionPreview(data);
    }
    async update(subscriptionId, updateSubscription) {
        const urlWithPathParams = new index_js_1.PathParameters(SubscriptionPaths.update, {
            subscription_id: subscriptionId,
        }).deriveUrl();
        const response = await this.client.patch(urlWithPathParams, updateSubscription);
        const data = this.handleResponse(response);
        return new index_js_2.Subscription(data);
    }
    list(queryParams) {
        const queryParameters = new index_js_1.QueryParameters(queryParams);
        return new index_js_2.SubscriptionCollection(this.client, SubscriptionPaths.list + queryParameters.toQueryString());
    }
    async get(subscriptionId, queryParams) {
        const queryParameters = new index_js_1.QueryParameters(queryParams);
        const urlWithPathParams = new index_js_1.PathParameters(SubscriptionPaths.get, {
            subscription_id: subscriptionId,
        }).deriveUrl();
        const response = await this.client.get(urlWithPathParams, queryParameters);
        const data = this.handleResponse(response);
        return new index_js_2.Subscription(data);
    }
    async activate(subscriptionId) {
        const urlWithPathParams = new index_js_1.PathParameters(SubscriptionPaths.activate, {
            subscription_id: subscriptionId,
        }).deriveUrl();
        const response = await this.client.post(urlWithPathParams, undefined);
        const data = this.handleResponse(response);
        return new index_js_2.Subscription(data);
    }
    async pause(subscriptionId, requestBody) {
        const urlWithPathParams = new index_js_1.PathParameters(SubscriptionPaths.pause, {
            subscription_id: subscriptionId,
        }).deriveUrl();
        const response = await this.client.post(urlWithPathParams, requestBody);
        const data = this.handleResponse(response);
        return new index_js_2.Subscription(data);
    }
    async resume(subscriptionId, requestBody) {
        const urlWithPathParams = new index_js_1.PathParameters(SubscriptionPaths.resume, {
            subscription_id: subscriptionId,
        }).deriveUrl();
        const response = await this.client.post(urlWithPathParams, requestBody);
        const data = this.handleResponse(response);
        return new index_js_2.Subscription(data);
    }
    async cancel(subscriptionId, requestBody) {
        const urlWithPathParams = new index_js_1.PathParameters(SubscriptionPaths.cancel, {
            subscription_id: subscriptionId,
        }).deriveUrl();
        const response = await this.client.post(urlWithPathParams, requestBody);
        const data = this.handleResponse(response);
        return new index_js_2.Subscription(data);
    }
    async createOneTimeCharge(subscriptionId, requestBody) {
        const urlWithPathParams = new index_js_1.PathParameters(SubscriptionPaths.createOneTimeCharge, {
            subscription_id: subscriptionId,
        }).deriveUrl();
        const response = await this.client.post(urlWithPathParams, requestBody);
        const data = this.handleResponse(response);
        return new index_js_2.Subscription(data);
    }
    async previewOneTimeCharge(subscriptionId, requestBody) {
        const urlWithPathParams = new index_js_1.PathParameters(SubscriptionPaths.previewOneTimeCharge, {
            subscription_id: subscriptionId,
        }).deriveUrl();
        const response = await this.client.post(urlWithPathParams, requestBody);
        const data = this.handleResponse(response);
        return new index_js_2.SubscriptionPreview(data);
    }
    async getPaymentMethodChangeTransaction(subscriptionId) {
        const urlWithPathParams = new index_js_1.PathParameters(SubscriptionPaths.getTransactionToUpdatePaymentMethod, {
            subscription_id: subscriptionId,
        }).deriveUrl();
        const response = await this.client.get(urlWithPathParams);
        const data = this.handleResponse(response);
        return new index_js_2.Transaction(data);
    }
}
exports.SubscriptionsResource = SubscriptionsResource;
