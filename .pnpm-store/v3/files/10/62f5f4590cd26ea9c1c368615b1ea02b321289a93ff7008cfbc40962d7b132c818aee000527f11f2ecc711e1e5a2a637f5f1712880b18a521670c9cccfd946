"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Webhooks = void 0;
const webhooks_validator_js_1 = require("./webhooks-validator.js");
const types_js_1 = require("./types.js");
const index_js_1 = require("../events/index.js");
const logger_js_1 = require("../../internal/base/logger.js");
class Webhooks {
    async unmarshal(requestBody, secretKey, signature) {
        const isSignatureValid = await new webhooks_validator_js_1.WebhooksValidator().isValidSignature(requestBody, secretKey, signature);
        if (isSignatureValid) {
            const parsedRequest = JSON.parse(requestBody);
            return Webhooks.fromJson(parsedRequest);
        }
        else {
            throw new Error('[Paddle] Webhook signature verification failed');
        }
    }
    async isSignatureValid(requestBody, secretKey, signature) {
        return await new webhooks_validator_js_1.WebhooksValidator().isValidSignature(requestBody, secretKey, signature);
    }
    static fromJson(data) {
        switch (data.event_type) {
            case types_js_1.EventName.AddressCreated:
                return new index_js_1.AddressCreatedEvent(data);
            case types_js_1.EventName.AddressUpdated:
                return new index_js_1.AddressUpdatedEvent(data);
            case types_js_1.EventName.AddressImported:
                return new index_js_1.AddressImportedEvent(data);
            case types_js_1.EventName.AdjustmentCreated:
                return new index_js_1.AdjustmentCreatedEvent(data);
            case types_js_1.EventName.AdjustmentUpdated:
                return new index_js_1.AdjustmentUpdatedEvent(data);
            case types_js_1.EventName.ApiKeyCreated:
                return new index_js_1.ApiKeyCreatedEvent(data);
            case types_js_1.EventName.ApiKeyExpired:
                return new index_js_1.ApiKeyExpiredEvent(data);
            case types_js_1.EventName.ApiKeyExpiring:
                return new index_js_1.ApiKeyExpiringEvent(data);
            case types_js_1.EventName.ApiKeyRevoked:
                return new index_js_1.ApiKeyRevokedEvent(data);
            case types_js_1.EventName.ApiKeyUpdated:
                return new index_js_1.ApiKeyUpdatedEvent(data);
            case types_js_1.EventName.BusinessCreated:
                return new index_js_1.BusinessCreatedEvent(data);
            case types_js_1.EventName.BusinessUpdated:
                return new index_js_1.BusinessUpdatedEvent(data);
            case types_js_1.EventName.BusinessImported:
                return new index_js_1.BusinessImportedEvent(data);
            case types_js_1.EventName.ClientTokenCreated:
                return new index_js_1.ClientTokenCreatedEvent(data);
            case types_js_1.EventName.ClientTokenUpdated:
                return new index_js_1.ClientTokenUpdatedEvent(data);
            case types_js_1.EventName.ClientTokenRevoked:
                return new index_js_1.ClientTokenRevokedEvent(data);
            case types_js_1.EventName.CustomerCreated:
                return new index_js_1.CustomerCreatedEvent(data);
            case types_js_1.EventName.CustomerUpdated:
                return new index_js_1.CustomerUpdatedEvent(data);
            case types_js_1.EventName.CustomerImported:
                return new index_js_1.CustomerImportedEvent(data);
            case types_js_1.EventName.DiscountCreated:
                return new index_js_1.DiscountCreatedEvent(data);
            case types_js_1.EventName.DiscountImported:
                return new index_js_1.DiscountImportedEvent(data);
            case types_js_1.EventName.DiscountUpdated:
                return new index_js_1.DiscountUpdatedEvent(data);
            case types_js_1.EventName.DiscountGroupCreated:
                return new index_js_1.DiscountGroupCreatedEvent(data);
            case types_js_1.EventName.DiscountGroupUpdated:
                return new index_js_1.DiscountGroupUpdatedEvent(data);
            case types_js_1.EventName.PaymentMethodDeleted:
                return new index_js_1.PaymentMethodDeletedEvent(data);
            case types_js_1.EventName.PaymentMethodSaved:
                return new index_js_1.PaymentMethodSavedEvent(data);
            case types_js_1.EventName.PayoutCreated:
                return new index_js_1.PayoutCreatedEvent(data);
            case types_js_1.EventName.PayoutPaid:
                return new index_js_1.PayoutPaidEvent(data);
            case types_js_1.EventName.PriceCreated:
                return new index_js_1.PriceCreatedEvent(data);
            case types_js_1.EventName.PriceUpdated:
                return new index_js_1.PriceUpdatedEvent(data);
            case types_js_1.EventName.PriceImported:
                return new index_js_1.PriceImportedEvent(data);
            case types_js_1.EventName.ProductCreated:
                return new index_js_1.ProductCreatedEvent(data);
            case types_js_1.EventName.ProductUpdated:
                return new index_js_1.ProductUpdatedEvent(data);
            case types_js_1.EventName.ProductImported:
                return new index_js_1.ProductImportedEvent(data);
            case types_js_1.EventName.SubscriptionActivated:
                return new index_js_1.SubscriptionActivatedEvent(data);
            case types_js_1.EventName.SubscriptionCanceled:
                return new index_js_1.SubscriptionCanceledEvent(data);
            case types_js_1.EventName.SubscriptionCreated:
                return new index_js_1.SubscriptionCreatedEvent(data);
            case types_js_1.EventName.SubscriptionImported:
                return new index_js_1.SubscriptionImportedEvent(data);
            case types_js_1.EventName.SubscriptionPastDue:
                return new index_js_1.SubscriptionPastDueEvent(data);
            case types_js_1.EventName.SubscriptionPaused:
                return new index_js_1.SubscriptionPausedEvent(data);
            case types_js_1.EventName.SubscriptionResumed:
                return new index_js_1.SubscriptionResumedEvent(data);
            case types_js_1.EventName.SubscriptionTrialing:
                return new index_js_1.SubscriptionTrialingEvent(data);
            case types_js_1.EventName.SubscriptionUpdated:
                return new index_js_1.SubscriptionUpdatedEvent(data);
            case types_js_1.EventName.TransactionBilled:
                return new index_js_1.TransactionBilledEvent(data);
            case types_js_1.EventName.TransactionCanceled:
                return new index_js_1.TransactionCanceledEvent(data);
            case types_js_1.EventName.TransactionCompleted:
                return new index_js_1.TransactionCompletedEvent(data);
            case types_js_1.EventName.TransactionCreated:
                return new index_js_1.TransactionCreatedEvent(data);
            case types_js_1.EventName.TransactionPaid:
                return new index_js_1.TransactionPaidEvent(data);
            case types_js_1.EventName.TransactionPastDue:
                return new index_js_1.TransactionPastDueEvent(data);
            case types_js_1.EventName.TransactionPaymentFailed:
                return new index_js_1.TransactionPaymentFailedEvent(data);
            case types_js_1.EventName.TransactionReady:
                return new index_js_1.TransactionReadyEvent(data);
            case types_js_1.EventName.TransactionUpdated:
                return new index_js_1.TransactionUpdatedEvent(data);
            case types_js_1.EventName.TransactionRevised:
                return new index_js_1.TransactionRevisedEvent(data);
            case types_js_1.EventName.ReportCreated:
                return new index_js_1.ReportCreatedEvent(data);
            case types_js_1.EventName.ReportUpdated:
                return new index_js_1.ReportUpdatedEvent(data);
            default:
                logger_js_1.Logger.log(`Unhandled event: ${data.event_type}`);
                return new index_js_1.GenericEvent(data);
        }
    }
}
exports.Webhooks = Webhooks;
