import { SubscriptionDiscount } from './subscription-discount.js';
import { BillingDetails, ImportMeta, TimePeriod } from '../shared/index.js';
import { SubscriptionTimePeriod } from './subscription-time-period.js';
import { SubscriptionScheduledChange } from './subscription-scheduled-change.js';
import { SubscriptionManagement } from './subscription-management.js';
import { SubscriptionItem } from './subscription-item.js';
import { NextTransaction, TransactionDetailsPreview } from '../index.js';
export class Subscription {
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
        this.discount = subscription.discount ? new SubscriptionDiscount(subscription.discount) : null;
        this.collectionMode = subscription.collection_mode;
        this.billingDetails = subscription.billing_details ? new BillingDetails(subscription.billing_details) : null;
        this.currentBillingPeriod = subscription.current_billing_period
            ? new SubscriptionTimePeriod(subscription.current_billing_period)
            : null;
        this.billingCycle = new TimePeriod(subscription.billing_cycle);
        this.scheduledChange = subscription.scheduled_change
            ? new SubscriptionScheduledChange(subscription.scheduled_change)
            : null;
        this.managementUrls = subscription.management_urls
            ? new SubscriptionManagement(subscription.management_urls)
            : null;
        this.items = subscription.items.map((item) => new SubscriptionItem(item));
        this.customData = subscription.custom_data ? subscription.custom_data : null;
        this.importMeta = subscription.import_meta ? new ImportMeta(subscription.import_meta) : null;
        this.nextTransaction = subscription.next_transaction ? new NextTransaction(subscription.next_transaction) : null;
        this.recurringTransactionDetails = subscription.recurring_transaction_details
            ? new TransactionDetailsPreview(subscription.recurring_transaction_details)
            : null;
    }
}
