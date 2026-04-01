"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionPreview = void 0;
const subscription_discount_js_1 = require("./subscription-discount.js");
const index_js_1 = require("../shared/index.js");
const subscription_time_period_js_1 = require("./subscription-time-period.js");
const subscription_scheduled_change_js_1 = require("./subscription-scheduled-change.js");
const subscription_management_js_1 = require("./subscription-management.js");
const subscription_item_js_1 = require("./subscription-item.js");
const index_js_2 = require("../index.js");
class SubscriptionPreview {
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
    immediateTransaction;
    nextTransaction;
    recurringTransactionDetails;
    updateSummary;
    importMeta;
    constructor(subscriptionPreview) {
        this.status = subscriptionPreview.status;
        this.customerId = subscriptionPreview.customer_id;
        this.addressId = subscriptionPreview.address_id;
        this.businessId = subscriptionPreview.business_id ? subscriptionPreview.business_id : null;
        this.currencyCode = subscriptionPreview.currency_code;
        this.createdAt = subscriptionPreview.created_at;
        this.updatedAt = subscriptionPreview.updated_at;
        this.startedAt = subscriptionPreview.started_at ? subscriptionPreview.started_at : null;
        this.firstBilledAt = subscriptionPreview.first_billed_at ? subscriptionPreview.first_billed_at : null;
        this.nextBilledAt = subscriptionPreview.next_billed_at ? subscriptionPreview.next_billed_at : null;
        this.pausedAt = subscriptionPreview.paused_at ? subscriptionPreview.paused_at : null;
        this.canceledAt = subscriptionPreview.canceled_at ? subscriptionPreview.canceled_at : null;
        this.discount = subscriptionPreview.discount ? new subscription_discount_js_1.SubscriptionDiscount(subscriptionPreview.discount) : null;
        this.collectionMode = subscriptionPreview.collection_mode;
        this.billingDetails = subscriptionPreview.billing_details
            ? new index_js_1.BillingDetails(subscriptionPreview.billing_details)
            : null;
        this.currentBillingPeriod = subscriptionPreview.current_billing_period
            ? new subscription_time_period_js_1.SubscriptionTimePeriod(subscriptionPreview.current_billing_period)
            : null;
        this.billingCycle = subscriptionPreview.billing_cycle ? new index_js_1.TimePeriod(subscriptionPreview.billing_cycle) : null;
        this.scheduledChange = subscriptionPreview.scheduled_change
            ? new subscription_scheduled_change_js_1.SubscriptionScheduledChange(subscriptionPreview.scheduled_change)
            : null;
        this.managementUrls = subscriptionPreview.management_urls
            ? new subscription_management_js_1.SubscriptionManagement(subscriptionPreview.management_urls)
            : null;
        this.items = subscriptionPreview.items.map((item) => new subscription_item_js_1.SubscriptionItem(item));
        this.customData = subscriptionPreview.custom_data ? subscriptionPreview.custom_data : null;
        this.immediateTransaction = subscriptionPreview.immediate_transaction
            ? new index_js_2.NextTransaction(subscriptionPreview.immediate_transaction)
            : null;
        this.nextTransaction = subscriptionPreview.next_transaction
            ? new index_js_2.NextTransaction(subscriptionPreview.next_transaction)
            : null;
        this.recurringTransactionDetails = subscriptionPreview.recurring_transaction_details
            ? new index_js_2.TransactionDetailsPreview(subscriptionPreview.recurring_transaction_details)
            : null;
        this.updateSummary = subscriptionPreview.update_summary
            ? new index_js_2.SubscriptionPreviewUpdateSummary(subscriptionPreview.update_summary)
            : null;
        this.importMeta = subscriptionPreview.import_meta ? new index_js_1.ImportMeta(subscriptionPreview.import_meta) : null;
    }
}
exports.SubscriptionPreview = SubscriptionPreview;
