"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionItemNotification = void 0;
const subscription_time_period_notification_js_1 = require("./subscription-time-period-notification.js");
const subscription_price_notification_js_1 = require("./subscription-price-notification.js");
const index_js_1 = require("../product/index.js");
class SubscriptionItemNotification {
    status;
    quantity;
    recurring;
    createdAt;
    updatedAt;
    previouslyBilledAt;
    nextBilledAt;
    trialDates;
    price;
    product;
    constructor(subscriptionItem) {
        this.status = subscriptionItem.status;
        this.quantity = subscriptionItem.quantity;
        this.recurring = subscriptionItem.recurring;
        this.createdAt = subscriptionItem.created_at;
        this.updatedAt = subscriptionItem.updated_at;
        this.previouslyBilledAt = subscriptionItem.previously_billed_at ? subscriptionItem.previously_billed_at : null;
        this.nextBilledAt = subscriptionItem.next_billed_at ? subscriptionItem.next_billed_at : null;
        this.trialDates = subscriptionItem.trial_dates
            ? new subscription_time_period_notification_js_1.SubscriptionTimePeriodNotification(subscriptionItem.trial_dates)
            : null;
        this.price = subscriptionItem.price ? new subscription_price_notification_js_1.SubscriptionPriceNotification(subscriptionItem.price) : null;
        this.product = subscriptionItem.product ? new index_js_1.ProductNotification(subscriptionItem.product) : null;
    }
}
exports.SubscriptionItemNotification = SubscriptionItemNotification;
