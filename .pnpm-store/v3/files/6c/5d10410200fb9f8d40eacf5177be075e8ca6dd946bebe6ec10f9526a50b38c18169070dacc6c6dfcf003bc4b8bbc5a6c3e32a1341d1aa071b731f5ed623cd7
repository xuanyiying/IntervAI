import { SubscriptionDiscount } from './subscription-discount.js';
import { BillingDetails, ImportMeta, TimePeriod } from '../shared/index.js';
import { SubscriptionTimePeriod } from './subscription-time-period.js';
import { SubscriptionScheduledChange } from './subscription-scheduled-change.js';
import { SubscriptionManagement } from './subscription-management.js';
import { SubscriptionItem } from './subscription-item.js';
import { NextTransaction, SubscriptionPreviewUpdateSummary, TransactionDetailsPreview, } from '../index.js';
export class SubscriptionPreview {
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
        this.discount = subscriptionPreview.discount ? new SubscriptionDiscount(subscriptionPreview.discount) : null;
        this.collectionMode = subscriptionPreview.collection_mode;
        this.billingDetails = subscriptionPreview.billing_details
            ? new BillingDetails(subscriptionPreview.billing_details)
            : null;
        this.currentBillingPeriod = subscriptionPreview.current_billing_period
            ? new SubscriptionTimePeriod(subscriptionPreview.current_billing_period)
            : null;
        this.billingCycle = subscriptionPreview.billing_cycle ? new TimePeriod(subscriptionPreview.billing_cycle) : null;
        this.scheduledChange = subscriptionPreview.scheduled_change
            ? new SubscriptionScheduledChange(subscriptionPreview.scheduled_change)
            : null;
        this.managementUrls = subscriptionPreview.management_urls
            ? new SubscriptionManagement(subscriptionPreview.management_urls)
            : null;
        this.items = subscriptionPreview.items.map((item) => new SubscriptionItem(item));
        this.customData = subscriptionPreview.custom_data ? subscriptionPreview.custom_data : null;
        this.immediateTransaction = subscriptionPreview.immediate_transaction
            ? new NextTransaction(subscriptionPreview.immediate_transaction)
            : null;
        this.nextTransaction = subscriptionPreview.next_transaction
            ? new NextTransaction(subscriptionPreview.next_transaction)
            : null;
        this.recurringTransactionDetails = subscriptionPreview.recurring_transaction_details
            ? new TransactionDetailsPreview(subscriptionPreview.recurring_transaction_details)
            : null;
        this.updateSummary = subscriptionPreview.update_summary
            ? new SubscriptionPreviewUpdateSummary(subscriptionPreview.update_summary)
            : null;
        this.importMeta = subscriptionPreview.import_meta ? new ImportMeta(subscriptionPreview.import_meta) : null;
    }
}
