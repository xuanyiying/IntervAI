import { AddressPreview } from './address-preview.js';
import { TransactionItemPreview } from './transaction-item-preview.js';
import { TransactionDetailsPreview } from '../subscription/index.js';
export class TransactionPreview {
    customerId;
    addressId;
    businessId;
    currencyCode;
    discountId;
    customerIpAddress;
    address;
    ignoreTrials;
    items;
    details;
    availablePaymentMethods;
    constructor(transactionPreview) {
        this.customerId = transactionPreview.customer_id ? transactionPreview.customer_id : null;
        this.addressId = transactionPreview.address_id ? transactionPreview.address_id : null;
        this.businessId = transactionPreview.business_id ? transactionPreview.business_id : null;
        this.currencyCode = transactionPreview.currency_code;
        this.discountId = transactionPreview.discount_id ? transactionPreview.discount_id : null;
        this.customerIpAddress = transactionPreview.customer_ip_address ? transactionPreview.customer_ip_address : null;
        this.address = transactionPreview.address ? new AddressPreview(transactionPreview.address) : null;
        this.ignoreTrials = transactionPreview.ignore_trials ? transactionPreview.ignore_trials : null;
        this.items = transactionPreview.items.map((item) => new TransactionItemPreview(item));
        this.details = new TransactionDetailsPreview(transactionPreview.details);
        this.availablePaymentMethods = transactionPreview.available_payment_method ?? null;
    }
}
