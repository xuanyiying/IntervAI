import { PricingPreviewLineItem } from './pricing-preview-line-item.js';
export class PricingPreviewDetails {
    lineItems;
    constructor(details) {
        this.lineItems = details.line_items.map((line_item) => new PricingPreviewLineItem(line_item));
    }
}
