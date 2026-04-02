"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Price = void 0;
const index_js_1 = require("../shared/index.js");
const price_quantity_js_1 = require("./price-quantity.js");
const index_js_2 = require("../product/index.js");
class Price {
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
        this.billingCycle = price.billing_cycle ? new index_js_1.TimePeriod(price.billing_cycle) : null;
        this.trialPeriod = price.trial_period ? new index_js_1.TimePeriod(price.trial_period) : null;
        this.taxMode = price.tax_mode;
        this.unitPrice = new index_js_1.Money(price.unit_price);
        this.unitPriceOverrides =
            price.unit_price_overrides?.map((unit_price_override) => new index_js_1.UnitPriceOverride(unit_price_override)) ?? [];
        this.quantity = new price_quantity_js_1.PriceQuantity(price.quantity);
        this.status = price.status;
        this.createdAt = price.created_at;
        this.updatedAt = price.updated_at;
        this.customData = price.custom_data ? price.custom_data : null;
        this.importMeta = price.import_meta ? new index_js_1.ImportMeta(price.import_meta) : null;
        this.product = price.product ? new index_js_2.Product(price.product) : null;
    }
}
exports.Price = Price;
