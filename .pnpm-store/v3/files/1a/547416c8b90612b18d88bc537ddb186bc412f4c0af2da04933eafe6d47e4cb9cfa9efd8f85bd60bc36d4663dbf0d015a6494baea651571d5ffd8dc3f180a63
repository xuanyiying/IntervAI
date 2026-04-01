import { Price } from '../price/index.js';
import { Totals } from '../shared/index.js';
import { Product } from '../product/index.js';
import { PricingPreviewDiscounts } from './pricing-preview-discounts.js';
import { type IPricingPreviewLineItemResponse } from '../../types/index.js';
export declare class PricingPreviewLineItem {
    readonly price: Price;
    readonly quantity: number;
    readonly taxRate: string;
    readonly unitTotals: Totals;
    readonly formattedUnitTotals: Totals;
    readonly totals: Totals;
    readonly formattedTotals: Totals;
    readonly product: Product;
    readonly discounts: PricingPreviewDiscounts[];
    constructor(lineItem: IPricingPreviewLineItemResponse);
}
