import { BillingDetailsNotification, TransactionCheckoutNotification, TransactionPaymentAttemptNotification, } from '../shared/index.js';
import { TransactionsTimePeriodNotification } from './transactions-time-period-notification.js';
import { TransactionItemNotification } from './transaction-item-notification.js';
import { TransactionDetailsNotification } from './transaction-details-notification.js';
export class TransactionNotification {
    id;
    status;
    customerId;
    addressId;
    businessId;
    customData;
    currencyCode;
    origin;
    subscriptionId;
    invoiceId;
    invoiceNumber;
    collectionMode;
    discountId;
    billingDetails;
    billingPeriod;
    items;
    details;
    payments;
    checkout;
    createdAt;
    updatedAt;
    billedAt;
    revisedAt;
    constructor(transaction) {
        this.id = transaction.id;
        this.status = transaction.status;
        this.customerId = transaction.customer_id ? transaction.customer_id : null;
        this.addressId = transaction.address_id ? transaction.address_id : null;
        this.businessId = transaction.business_id ? transaction.business_id : null;
        this.customData = transaction.custom_data ? transaction.custom_data : null;
        this.currencyCode = transaction.currency_code;
        this.origin = transaction.origin;
        this.subscriptionId = transaction.subscription_id ? transaction.subscription_id : null;
        this.invoiceId = transaction.invoice_id ? transaction.invoice_id : null;
        this.invoiceNumber = transaction.invoice_number ? transaction.invoice_number : null;
        this.collectionMode = transaction.collection_mode;
        this.discountId = transaction.discount_id ? transaction.discount_id : null;
        this.billingDetails = transaction.billing_details
            ? new BillingDetailsNotification(transaction.billing_details)
            : null;
        this.billingPeriod = transaction.billing_period
            ? new TransactionsTimePeriodNotification(transaction.billing_period)
            : null;
        this.items = transaction.items.map((item) => new TransactionItemNotification(item));
        this.details = transaction.details ? new TransactionDetailsNotification(transaction.details) : null;
        this.payments = transaction.payments.map((payment) => new TransactionPaymentAttemptNotification(payment));
        this.checkout = transaction.checkout ? new TransactionCheckoutNotification(transaction.checkout) : null;
        this.createdAt = transaction.created_at;
        this.updatedAt = transaction.updated_at;
        this.billedAt = transaction.billed_at ? transaction.billed_at : null;
        this.revisedAt = transaction.revised_at ? transaction.revised_at : null;
    }
}
