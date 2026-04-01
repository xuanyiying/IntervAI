import { ImportMetaNotification, MoneyNotification, TimePeriodNotification, UnitPriceOverrideNotification, } from '../shared/index.js';
import { PriceQuantityNotification } from '../price/index.js';
export class SubscriptionPriceNotification {
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
    customData;
    importMeta;
    constructor(price) {
        this.id = price.id;
        this.productId = price.product_id;
        this.description = price.description;
        this.type = price.type ?? null;
        this.name = price.name ? price.name : null;
        this.billingCycle = price.billing_cycle ? new TimePeriodNotification(price.billing_cycle) : null;
        this.trialPeriod = price.trial_period ? new TimePeriodNotification(price.trial_period) : null;
        this.taxMode = price.tax_mode;
        this.unitPrice = price.unit_price ? new MoneyNotification(price.unit_price) : null;
        this.unitPriceOverrides = price.unit_price_overrides
            ? price.unit_price_overrides.map((unit_price_override) => new UnitPriceOverrideNotification(unit_price_override))
            : [];
        this.quantity = price.quantity ? new PriceQuantityNotification(price.quantity) : null;
        this.status = price.status ?? null;
        this.customData = price.custom_data ? price.custom_data : null;
        this.importMeta = price.import_meta ? new ImportMetaNotification(price.import_meta) : null;
    }
}
