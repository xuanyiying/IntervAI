"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionPreview = void 0;
const address_preview_js_1 = require("./address-preview.js");
const transaction_item_preview_js_1 = require("./transaction-item-preview.js");
const index_js_1 = require("../subscription/index.js");
class TransactionPreview {
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
        this.address = transactionPreview.address ? new address_preview_js_1.AddressPreview(transactionPreview.address) : null;
        this.ignoreTrials = transactionPreview.ignore_trials ? transactionPreview.ignore_trials : null;
        this.items = transactionPreview.items.map((item) => new transaction_item_preview_js_1.TransactionItemPreview(item));
        this.details = new index_js_1.TransactionDetailsPreview(transactionPreview.details);
        this.availablePaymentMethods = transactionPreview.available_payment_method ?? null;
    }
}
exports.TransactionPreview = TransactionPreview;
