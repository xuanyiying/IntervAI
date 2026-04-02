import { TimePeriod } from './time-period.js';
export class BillingDetails {
    enableCheckout;
    purchaseOrderNumber;
    additionalInformation;
    paymentTerms;
    constructor(billingDetails) {
        this.enableCheckout = billingDetails.enable_checkout ?? null;
        this.purchaseOrderNumber = billingDetails.purchase_order_number ? billingDetails.purchase_order_number : null;
        this.additionalInformation = billingDetails.additional_information ? billingDetails.additional_information : null;
        this.paymentTerms = new TimePeriod(billingDetails.payment_terms);
    }
}
