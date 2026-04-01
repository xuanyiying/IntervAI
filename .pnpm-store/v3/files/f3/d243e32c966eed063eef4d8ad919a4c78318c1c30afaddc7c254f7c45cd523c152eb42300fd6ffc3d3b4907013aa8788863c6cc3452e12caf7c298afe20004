import { Price } from '../price/index.js';
import { Totals } from '../shared/index.js';
import { Product } from '../product/index.js';
import { PricingPreviewDiscounts } from './pricing-preview-discounts.js';
export class PricingPreviewLineItem {
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
        this.price = new Price(lineItem.price);
        this.quantity = lineItem.quantity;
        this.taxRate = lineItem.tax_rate;
        this.unitTotals = new Totals(lineItem.unit_totals);
        this.formattedUnitTotals = new Totals(lineItem.formatted_unit_totals);
        this.totals = new Totals(lineItem.totals);
        this.formattedTotals = new Totals(lineItem.formatted_totals);
        this.product = new Product(lineItem.product);
        this.discounts = lineItem.discounts.map((discount) => new PricingPreviewDiscounts(discount));
    }
}
