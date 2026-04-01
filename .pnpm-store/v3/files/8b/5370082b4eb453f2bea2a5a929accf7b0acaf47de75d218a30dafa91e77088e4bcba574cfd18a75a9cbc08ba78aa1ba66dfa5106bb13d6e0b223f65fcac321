"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BillingDetails = void 0;
const time_period_js_1 = require("./time-period.js");
class BillingDetails {
    enableCheckout;
    purchaseOrderNumber;
    additionalInformation;
    paymentTerms;
    constructor(billingDetails) {
        this.enableCheckout = billingDetails.enable_checkout ?? null;
        this.purchaseOrderNumber = billingDetails.purchase_order_number ? billingDetails.purchase_order_number : null;
        this.additionalInformation = billingDetails.additional_information ? billingDetails.additional_information : null;
        this.paymentTerms = new time_period_js_1.TimePeriod(billingDetails.payment_terms);
    }
}
exports.BillingDetails = BillingDetails;
