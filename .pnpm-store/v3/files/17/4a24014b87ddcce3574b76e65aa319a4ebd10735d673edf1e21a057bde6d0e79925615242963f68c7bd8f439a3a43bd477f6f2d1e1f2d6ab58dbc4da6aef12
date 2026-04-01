"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PriceNotification = void 0;
const index_js_1 = require("../shared/index.js");
const price_quantity_notification_js_1 = require("./price-quantity-notification.js");
class PriceNotification {
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
        this.billingCycle = price.billing_cycle ? new index_js_1.TimePeriodNotification(price.billing_cycle) : null;
        this.trialPeriod = price.trial_period ? new index_js_1.TimePeriodNotification(price.trial_period) : null;
        this.taxMode = price.tax_mode;
        this.unitPrice = new index_js_1.MoneyNotification(price.unit_price);
        this.unitPriceOverrides =
            price.unit_price_overrides?.map((unit_price_override) => new index_js_1.UnitPriceOverrideNotification(unit_price_override)) ?? [];
        this.quantity = new price_quantity_notification_js_1.PriceQuantityNotification(price.quantity);
        this.status = price.status;
        this.createdAt = price.created_at ?? null;
        this.updatedAt = price.updated_at ?? null;
        this.customData = price.custom_data ? price.custom_data : null;
        this.importMeta = price.import_meta ? new index_js_1.ImportMetaNotification(price.import_meta) : null;
    }
}
exports.PriceNotification = PriceNotification;
