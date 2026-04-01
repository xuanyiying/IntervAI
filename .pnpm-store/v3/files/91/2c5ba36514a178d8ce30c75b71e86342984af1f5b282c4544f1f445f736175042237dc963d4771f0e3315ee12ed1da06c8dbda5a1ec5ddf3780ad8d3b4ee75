import { BaseResource } from '../../internal/base/index.js';
import { type CancelSubscription, type CreateSubscriptionCharge, type GetSubscriptionQueryParameters, type ListSubscriptionQueryParameters, type PauseSubscription, type ResumeSubscription, type UpdateSubscriptionRequestBody } from './operations/index.js';
import { Subscription, SubscriptionCollection, SubscriptionPreview, Transaction } from '../../entities/index.js';
export * from './operations/index.js';
export declare class SubscriptionsResource extends BaseResource {
    previewUpdate(subscriptionId: string, updateSubscription: UpdateSubscriptionRequestBody): Promise<SubscriptionPreview>;
    update(subscriptionId: string, updateSubscription: UpdateSubscriptionRequestBody): Promise<Subscription>;
    list(queryParams?: ListSubscriptionQueryParameters): SubscriptionCollection;
    get(subscriptionId: string, queryParams?: GetSubscriptionQueryParameters): Promise<Subscription>;
    activate(subscriptionId: string): Promise<Subscription>;
    pause(subscriptionId: string, requestBody: PauseSubscription): Promise<Subscription>;
    resume(subscriptionId: string, requestBody: ResumeSubscription): Promise<Subscription>;
    cancel(subscriptionId: string, requestBody?: CancelSubscription): Promise<Subscription>;
    createOneTimeCharge(subscriptionId: string, requestBody: CreateSubscriptionCharge): Promise<Subscription>;
    previewOneTimeCharge(subscriptionId: string, requestBody: CreateSubscriptionCharge): Promise<SubscriptionPreview>;
    getPaymentMethodChangeTransaction(subscriptionId: string): Promise<Transaction>;
}
