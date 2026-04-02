import { AddressPreview } from '../transaction/index.js';
import { PricingPreviewDetails } from './pricing-preview-details.js';
export class PricingPreview {
    customerId;
    addressId;
    businessId;
    currencyCode;
    discountId;
    address;
    customerIpAddress;
    details;
    availablePaymentMethods;
    constructor(pricePreview) {
        this.customerId = pricePreview.customer_id ?? null;
        this.addressId = pricePreview.address_id ?? null;
        this.businessId = pricePreview.business_id ?? null;
        this.currencyCode = pricePreview.currency_code;
        this.discountId = pricePreview.discount_id ?? null;
        this.address = pricePreview.address ? new AddressPreview(pricePreview.address) : null;
        this.customerIpAddress = pricePreview.customer_ip_address ?? null;
        this.details = new PricingPreviewDetails(pricePreview.details);
        this.availablePaymentMethods = pricePreview.available_payment_methods ?? [];
    }
}
