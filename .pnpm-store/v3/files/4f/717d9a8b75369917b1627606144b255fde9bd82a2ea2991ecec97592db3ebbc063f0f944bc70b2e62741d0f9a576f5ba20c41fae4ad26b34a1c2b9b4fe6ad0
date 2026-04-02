import { TransactionProration } from './transaction-proration.js';
import { Totals, UnitTotals } from '../shared/index.js';
import { Product } from '../product/index.js';
export class TransactionLineItem {
    id;
    priceId;
    quantity;
    proration;
    taxRate;
    unitTotals;
    totals;
    product;
    constructor(transactionLineItem) {
        this.id = transactionLineItem.id;
        this.priceId = transactionLineItem.price_id;
        this.quantity = transactionLineItem.quantity;
        this.proration = transactionLineItem.proration ? new TransactionProration(transactionLineItem.proration) : null;
        this.taxRate = transactionLineItem.tax_rate;
        this.unitTotals = transactionLineItem.unit_totals ? new UnitTotals(transactionLineItem.unit_totals) : null;
        this.totals = transactionLineItem.totals ? new Totals(transactionLineItem.totals) : null;
        this.product = transactionLineItem.product ? new Product(transactionLineItem.product) : null;
    }
}
