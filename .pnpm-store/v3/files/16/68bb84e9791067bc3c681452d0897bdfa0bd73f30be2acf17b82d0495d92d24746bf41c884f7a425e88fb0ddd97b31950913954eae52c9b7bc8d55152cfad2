import { Address, AdjustmentTotals, BillingDetails, Business, Customer, Discount, TransactionAdjustment, TransactionCheckout, TransactionDetails, TransactionItem, TransactionPaymentAttempt, TransactionsTimePeriod, } from '../index.js';
export class Transaction {
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
    address;
    adjustments;
    adjustmentsTotals;
    business;
    customer;
    discount;
    availablePaymentMethods;
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
        this.billingDetails = transaction.billing_details ? new BillingDetails(transaction.billing_details) : null;
        this.billingPeriod = transaction.billing_period ? new TransactionsTimePeriod(transaction.billing_period) : null;
        this.items = transaction.items.map((item) => new TransactionItem(item));
        this.details = transaction.details ? new TransactionDetails(transaction.details) : null;
        this.payments = transaction.payments.map((payment) => new TransactionPaymentAttempt(payment));
        this.checkout = transaction.checkout ? new TransactionCheckout(transaction.checkout) : null;
        this.createdAt = transaction.created_at;
        this.updatedAt = transaction.updated_at;
        this.billedAt = transaction.billed_at ? transaction.billed_at : null;
        this.revisedAt = transaction.revised_at ? transaction.revised_at : null;
        this.address = transaction.address ? new Address(transaction.address) : null;
        this.adjustments = transaction.adjustments
            ? transaction.adjustments?.map((adjustment) => new TransactionAdjustment(adjustment))
            : null;
        this.adjustmentsTotals = transaction.adjustments_totals
            ? new AdjustmentTotals(transaction.adjustments_totals)
            : null;
        this.business = transaction.business ? new Business(transaction.business) : null;
        this.customer = transaction.customer ? new Customer(transaction.customer) : null;
        this.discount = transaction.discount ? new Discount(transaction.discount) : null;
        this.availablePaymentMethods = transaction.available_payment_methods ? transaction.available_payment_methods : null;
    }
}
