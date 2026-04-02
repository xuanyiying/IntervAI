"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionItem = void 0;
const subscription_time_period_js_1 = require("./subscription-time-period.js");
const index_js_1 = require("../price/index.js");
const index_js_2 = require("../product/index.js");
class SubscriptionItem {
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
        this.trialDates = subscriptionItem.trial_dates ? new subscription_time_period_js_1.SubscriptionTimePeriod(subscriptionItem.trial_dates) : null;
        this.price = new index_js_1.Price(subscriptionItem.price);
        this.product = new index_js_2.Product(subscriptionItem.product);
    }
}
exports.SubscriptionItem = SubscriptionItem;
