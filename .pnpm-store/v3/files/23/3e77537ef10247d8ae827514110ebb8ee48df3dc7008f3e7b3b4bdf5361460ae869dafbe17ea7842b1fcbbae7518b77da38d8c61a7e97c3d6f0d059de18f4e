"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Subscription = void 0;
const subscription_discount_js_1 = require("./subscription-discount.js");
const index_js_1 = require("../shared/index.js");
const subscription_time_period_js_1 = require("./subscription-time-period.js");
const subscription_scheduled_change_js_1 = require("./subscription-scheduled-change.js");
const subscription_management_js_1 = require("./subscription-management.js");
const subscription_item_js_1 = require("./subscription-item.js");
const index_js_2 = require("../index.js");
class Subscription {
    id;
    status;
    customerId;
    addressId;
    businessId;
    currencyCode;
    createdAt;
    updatedAt;
    startedAt;
    firstBilledAt;
    nextBilledAt;
    pausedAt;
    canceledAt;
    discount;
    collectionMode;
    billingDetails;
    currentBillingPeriod;
    billingCycle;
    scheduledChange;
    managementUrls;
    items;
    customData;
    importMeta;
    nextTransaction;
    recurringTransactionDetails;
    constructor(subscription) {
        this.id = subscription.id;
        this.status = subscription.status;
        this.customerId = subscription.customer_id;
        this.addressId = subscription.address_id;
        this.businessId = subscription.business_id ? subscription.business_id : null;
        this.currencyCode = subscription.currency_code;
        this.createdAt = subscription.created_at;
        this.updatedAt = subscription.updated_at;
        this.startedAt = subscription.started_at ? subscription.started_at : null;
        this.firstBilledAt = subscription.first_billed_at ? subscription.first_billed_at : null;
        this.nextBilledAt = subscription.next_billed_at ? subscription.next_billed_at : null;
        this.pausedAt = subscription.paused_at ? subscription.paused_at : null;
        this.canceledAt = subscription.canceled_at ? subscription.canceled_at : null;
        this.discount = subscription.discount ? new subscription_discount_js_1.SubscriptionDiscount(subscription.discount) : null;
        this.collectionMode = subscription.collection_mode;
        this.billingDetails = subscription.billing_details ? new index_js_1.BillingDetails(subscription.billing_details) : null;
        this.currentBillingPeriod = subscription.current_billing_period
            ? new subscription_time_period_js_1.SubscriptionTimePeriod(subscription.current_billing_period)
            : null;
        this.billingCycle = new index_js_1.TimePeriod(subscription.billing_cycle);
        this.scheduledChange = subscription.scheduled_change
            ? new subscription_scheduled_change_js_1.SubscriptionScheduledChange(subscription.scheduled_change)
            : null;
        this.managementUrls = subscription.management_urls
            ? new subscription_management_js_1.SubscriptionManagement(subscription.management_urls)
            : null;
        this.items = subscription.items.map((item) => new subscription_item_js_1.SubscriptionItem(item));
        this.customData = subscription.custom_data ? subscription.custom_data : null;
        this.importMeta = subscription.import_meta ? new index_js_1.ImportMeta(subscription.import_meta) : null;
        this.nextTransaction = subscription.next_transaction ? new index_js_2.NextTransaction(subscription.next_transaction) : null;
        this.recurringTransactionDetails = subscription.recurring_transaction_details
            ? new index_js_2.TransactionDetailsPreview(subscription.recurring_transaction_details)
            : null;
    }
}
exports.Subscription = Subscription;
