import { BaseResource, PathParameters, QueryParameters } from '../../internal/base/index.js';
import { Subscription, SubscriptionCollection, SubscriptionPreview, Transaction } from '../../entities/index.js';
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
export * from './operations/index.js';
export class SubscriptionsResource extends BaseResource {
    async previewUpdate(subscriptionId, updateSubscription) {
        const urlWithPathParams = new PathParameters(SubscriptionPaths.updatePreview, {
            subscription_id: subscriptionId,
        }).deriveUrl();
        const response = await this.client.patch(urlWithPathParams, updateSubscription);
        const data = this.handleResponse(response);
        return new SubscriptionPreview(data);
    }
    async update(subscriptionId, updateSubscription) {
        const urlWithPathParams = new PathParameters(SubscriptionPaths.update, {
            subscription_id: subscriptionId,
        }).deriveUrl();
        const response = await this.client.patch(urlWithPathParams, updateSubscription);
        const data = this.handleResponse(response);
        return new Subscription(data);
    }
    list(queryParams) {
        const queryParameters = new QueryParameters(queryParams);
        return new SubscriptionCollection(this.client, SubscriptionPaths.list + queryParameters.toQueryString());
    }
    async get(subscriptionId, queryParams) {
        const queryParameters = new QueryParameters(queryParams);
        const urlWithPathParams = new PathParameters(SubscriptionPaths.get, {
            subscription_id: subscriptionId,
        }).deriveUrl();
        const response = await this.client.get(urlWithPathParams, queryParameters);
        const data = this.handleResponse(response);
        return new Subscription(data);
    }
    async activate(subscriptionId) {
        const urlWithPathParams = new PathParameters(SubscriptionPaths.activate, {
            subscription_id: subscriptionId,
        }).deriveUrl();
        const response = await this.client.post(urlWithPathParams, undefined);
        const data = this.handleResponse(response);
        return new Subscription(data);
    }
    async pause(subscriptionId, requestBody) {
        const urlWithPathParams = new PathParameters(SubscriptionPaths.pause, {
            subscription_id: subscriptionId,
        }).deriveUrl();
        const response = await this.client.post(urlWithPathParams, requestBody);
        const data = this.handleResponse(response);
        return new Subscription(data);
    }
    async resume(subscriptionId, requestBody) {
        const urlWithPathParams = new PathParameters(SubscriptionPaths.resume, {
            subscription_id: subscriptionId,
        }).deriveUrl();
        const response = await this.client.post(urlWithPathParams, requestBody);
        const data = this.handleResponse(response);
        return new Subscription(data);
    }
    async cancel(subscriptionId, requestBody) {
        const urlWithPathParams = new PathParameters(SubscriptionPaths.cancel, {
            subscription_id: subscriptionId,
        }).deriveUrl();
        const response = await this.client.post(urlWithPathParams, requestBody);
        const data = this.handleResponse(response);
        return new Subscription(data);
    }
    async createOneTimeCharge(subscriptionId, requestBody) {
        const urlWithPathParams = new PathParameters(SubscriptionPaths.createOneTimeCharge, {
            subscription_id: subscriptionId,
        }).deriveUrl();
        const response = await this.client.post(urlWithPathParams, requestBody);
        const data = this.handleResponse(response);
        return new Subscription(data);
    }
    async previewOneTimeCharge(subscriptionId, requestBody) {
        const urlWithPathParams = new PathParameters(SubscriptionPaths.previewOneTimeCharge, {
            subscription_id: subscriptionId,
        }).deriveUrl();
        const response = await this.client.post(urlWithPathParams, requestBody);
        const data = this.handleResponse(response);
        return new SubscriptionPreview(data);
    }
    async getPaymentMethodChangeTransaction(subscriptionId) {
        const urlWithPathParams = new PathParameters(SubscriptionPaths.getTransactionToUpdatePaymentMethod, {
            subscription_id: subscriptionId,
        }).deriveUrl();
        const response = await this.client.get(urlWithPathParams);
        const data = this.handleResponse(response);
        return new Transaction(data);
    }
}
