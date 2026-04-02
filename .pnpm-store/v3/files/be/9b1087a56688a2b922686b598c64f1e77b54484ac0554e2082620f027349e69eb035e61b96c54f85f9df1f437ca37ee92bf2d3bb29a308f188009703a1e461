import { TimePeriodNotification } from './time-period-notification.js';
export class BillingDetailsNotification {
    enableCheckout;
    purchaseOrderNumber;
    additionalInformation;
    paymentTerms;
    constructor(billingDetails) {
        this.enableCheckout = billingDetails.enable_checkout ?? null;
        this.purchaseOrderNumber = billingDetails.purchase_order_number ? billingDetails.purchase_order_number : null;
        this.additionalInformation = billingDetails.additional_information ? billingDetails.additional_information : null;
        this.paymentTerms = new TimePeriodNotification(billingDetails.payment_terms);
    }
}
