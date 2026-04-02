"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PricingPreview = void 0;
const index_js_1 = require("../transaction/index.js");
const pricing_preview_details_js_1 = require("./pricing-preview-details.js");
class PricingPreview {
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
        this.address = pricePreview.address ? new index_js_1.AddressPreview(pricePreview.address) : null;
        this.customerIpAddress = pricePreview.customer_ip_address ?? null;
        this.details = new pricing_preview_details_js_1.PricingPreviewDetails(pricePreview.details);
        this.availablePaymentMethods = pricePreview.available_payment_methods ?? [];
    }
}
exports.PricingPreview = PricingPreview;
