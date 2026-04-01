"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BillingDetailsNotification = void 0;
const time_period_notification_js_1 = require("./time-period-notification.js");
class BillingDetailsNotification {
    enableCheckout;
    purchaseOrderNumber;
    additionalInformation;
    paymentTerms;
    constructor(billingDetails) {
        this.enableCheckout = billingDetails.enable_checkout ?? null;
        this.purchaseOrderNumber = billingDetails.purchase_order_number ? billingDetails.purchase_order_number : null;
        this.additionalInformation = billingDetails.additional_information ? billingDetails.additional_information : null;
        this.paymentTerms = new time_period_notification_js_1.TimePeriodNotification(billingDetails.payment_terms);
    }
}
exports.BillingDetailsNotification = BillingDetailsNotification;
