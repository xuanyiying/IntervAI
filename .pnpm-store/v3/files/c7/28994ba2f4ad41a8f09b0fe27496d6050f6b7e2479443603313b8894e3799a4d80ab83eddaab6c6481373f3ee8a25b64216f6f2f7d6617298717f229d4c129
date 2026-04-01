"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionCreationEntities = void 0;
const subscription_creation_item_js_1 = require("./subscription-creation-item.js");
class SubscriptionCreationEntities {
    customerId;
    addressId;
    businessId;
    paymentMethodId;
    discountId;
    transactionId;
    items;
    constructor(entities) {
        this.customerId = entities?.customer_id ?? null;
        this.addressId = entities?.address_id ?? null;
        this.businessId = entities?.business_id ?? null;
        this.paymentMethodId = entities?.payment_method_id ?? null;
        this.discountId = entities?.discount_id ?? null;
        this.transactionId = entities?.transaction_id ?? null;
        this.items = entities?.items?.map((item) => new subscription_creation_item_js_1.SubscriptionCreationItem(item)) ?? null;
    }
}
exports.SubscriptionCreationEntities = SubscriptionCreationEntities;
