"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionNotification = void 0;
const subscription_discount_notification_js_1 = require("./subscription-discount-notification.js");
const index_js_1 = require("../shared/index.js");
const subscription_time_period_notification_js_1 = require("./subscription-time-period-notification.js");
const subscription_scheduled_change_notification_js_1 = require("./subscription-scheduled-change-notification.js");
const subscription_item_notification_js_1 = require("./subscription-item-notification.js");
class SubscriptionNotification {
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
    items;
    customData;
    importMeta;
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
        this.discount = subscription.discount ? new subscription_discount_notification_js_1.SubscriptionDiscountNotification(subscription.discount) : null;
        this.collectionMode = subscription.collection_mode;
        this.billingDetails = subscription.billing_details
            ? new index_js_1.BillingDetailsNotification(subscription.billing_details)
            : null;
        this.currentBillingPeriod = subscription.current_billing_period
            ? new subscription_time_period_notification_js_1.SubscriptionTimePeriodNotification(subscription.current_billing_period)
            : null;
        this.billingCycle = new index_js_1.TimePeriodNotification(subscription.billing_cycle);
        this.scheduledChange = subscription.scheduled_change
            ? new subscription_scheduled_change_notification_js_1.SubscriptionScheduledChangeNotification(subscription.scheduled_change)
            : null;
        this.items = subscription.items.map((item) => new subscription_item_notification_js_1.SubscriptionItemNotification(item));
        this.customData = subscription.custom_data ? subscription.custom_data : null;
        this.importMeta = subscription.import_meta ? new index_js_1.ImportMetaNotification(subscription.import_meta) : null;
    }
}
exports.SubscriptionNotification = SubscriptionNotification;
