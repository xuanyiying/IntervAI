import { TransactionProrationNotification } from './transaction-proration-notification.js';
import { TotalsNotification, UnitTotalsNotification } from '../shared/index.js';
import { ProductNotification } from '../product/index.js';
export class TransactionLineItemNotification {
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
        this.proration = transactionLineItem.proration
            ? new TransactionProrationNotification(transactionLineItem.proration)
            : null;
        this.taxRate = transactionLineItem.tax_rate;
        this.unitTotals = transactionLineItem.unit_totals
            ? new UnitTotalsNotification(transactionLineItem.unit_totals)
            : null;
        this.totals = transactionLineItem.totals ? new TotalsNotification(transactionLineItem.totals) : null;
        this.product = transactionLineItem.product ? new ProductNotification(transactionLineItem.product) : null;
    }
}
