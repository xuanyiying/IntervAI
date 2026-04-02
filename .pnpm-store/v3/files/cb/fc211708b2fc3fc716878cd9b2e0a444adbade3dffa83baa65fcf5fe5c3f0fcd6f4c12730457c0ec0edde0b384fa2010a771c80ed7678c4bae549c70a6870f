import { SubscriptionCreationItem } from './subscription-creation-item.js';
export class SubscriptionCreationEntities {
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
        this.items = entities?.items?.map((item) => new SubscriptionCreationItem(item)) ?? null;
    }
}
