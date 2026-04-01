import { ImportMetaNotification, MoneyNotification, TimePeriodNotification, UnitPriceOverrideNotification, } from '../shared/index.js';
import { PriceQuantityNotification } from './price-quantity-notification.js';
export class PriceNotification {
    id;
    productId;
    description;
    name;
    type;
    billingCycle;
    trialPeriod;
    taxMode;
    unitPrice;
    unitPriceOverrides;
    quantity;
    status;
    createdAt;
    updatedAt;
    customData;
    importMeta;
    constructor(price) {
        this.id = price.id;
        this.productId = price.product_id;
        this.description = price.description;
        this.type = price.type ? price.type : null;
        this.name = price.name ? price.name : null;
        this.billingCycle = price.billing_cycle ? new TimePeriodNotification(price.billing_cycle) : null;
        this.trialPeriod = price.trial_period ? new TimePeriodNotification(price.trial_period) : null;
        this.taxMode = price.tax_mode;
        this.unitPrice = new MoneyNotification(price.unit_price);
        this.unitPriceOverrides =
            price.unit_price_overrides?.map((unit_price_override) => new UnitPriceOverrideNotification(unit_price_override)) ?? [];
        this.quantity = new PriceQuantityNotification(price.quantity);
        this.status = price.status;
        this.createdAt = price.created_at ?? null;
        this.updatedAt = price.updated_at ?? null;
        this.customData = price.custom_data ? price.custom_data : null;
        this.importMeta = price.import_meta ? new ImportMetaNotification(price.import_meta) : null;
    }
}
