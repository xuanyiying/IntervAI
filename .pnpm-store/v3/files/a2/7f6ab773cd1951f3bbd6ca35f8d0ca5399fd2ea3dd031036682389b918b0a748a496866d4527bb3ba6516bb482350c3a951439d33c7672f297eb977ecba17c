import { ImportMeta, Money, TimePeriod, UnitPriceOverride } from '../shared/index.js';
import { PriceQuantity } from './price-quantity.js';
import { Product } from '../product/index.js';
export class Price {
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
    product;
    constructor(price) {
        this.id = price.id;
        this.productId = price.product_id;
        this.description = price.description;
        this.type = price.type;
        this.name = price.name ? price.name : null;
        this.billingCycle = price.billing_cycle ? new TimePeriod(price.billing_cycle) : null;
        this.trialPeriod = price.trial_period ? new TimePeriod(price.trial_period) : null;
        this.taxMode = price.tax_mode;
        this.unitPrice = new Money(price.unit_price);
        this.unitPriceOverrides =
            price.unit_price_overrides?.map((unit_price_override) => new UnitPriceOverride(unit_price_override)) ?? [];
        this.quantity = new PriceQuantity(price.quantity);
        this.status = price.status;
        this.createdAt = price.created_at;
        this.updatedAt = price.updated_at;
        this.customData = price.custom_data ? price.custom_data : null;
        this.importMeta = price.import_meta ? new ImportMeta(price.import_meta) : null;
        this.product = price.product ? new Product(price.product) : null;
    }
}
