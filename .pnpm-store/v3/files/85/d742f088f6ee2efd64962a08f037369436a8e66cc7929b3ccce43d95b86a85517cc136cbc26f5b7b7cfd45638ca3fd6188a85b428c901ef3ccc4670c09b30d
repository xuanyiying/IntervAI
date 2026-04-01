import { Totals, UnitTotals } from '../shared/index.js';
import { Product } from '../product/index.js';
import { Proration } from '../transaction/proration.js';
export class TransactionLineItemPreview {
    priceId;
    quantity;
    taxRate;
    unitTotals;
    totals;
    product;
    proration;
    constructor(transactionLineItemPreview) {
        this.priceId = transactionLineItemPreview.price_id;
        this.quantity = transactionLineItemPreview.quantity;
        this.taxRate = transactionLineItemPreview.tax_rate;
        this.unitTotals = new UnitTotals(transactionLineItemPreview.unit_totals);
        this.totals = new Totals(transactionLineItemPreview.totals);
        this.product = new Product(transactionLineItemPreview.product);
        this.proration = transactionLineItemPreview.proration ? new Proration(transactionLineItemPreview.proration) : null;
    }
}
