"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PricingPreviewLineItem = void 0;
const index_js_1 = require("../price/index.js");
const index_js_2 = require("../shared/index.js");
const index_js_3 = require("../product/index.js");
const pricing_preview_discounts_js_1 = require("./pricing-preview-discounts.js");
class PricingPreviewLineItem {
    price;
    quantity;
    taxRate;
    unitTotals;
    formattedUnitTotals;
    totals;
    formattedTotals;
    product;
    discounts;
    constructor(lineItem) {
        this.price = new index_js_1.Price(lineItem.price);
        this.quantity = lineItem.quantity;
        this.taxRate = lineItem.tax_rate;
        this.unitTotals = new index_js_2.Totals(lineItem.unit_totals);
        this.formattedUnitTotals = new index_js_2.Totals(lineItem.formatted_unit_totals);
        this.totals = new index_js_2.Totals(lineItem.totals);
        this.formattedTotals = new index_js_2.Totals(lineItem.formatted_totals);
        this.product = new index_js_3.Product(lineItem.product);
        this.discounts = lineItem.discounts.map((discount) => new pricing_preview_discounts_js_1.PricingPreviewDiscounts(discount));
    }
}
exports.PricingPreviewLineItem = PricingPreviewLineItem;
