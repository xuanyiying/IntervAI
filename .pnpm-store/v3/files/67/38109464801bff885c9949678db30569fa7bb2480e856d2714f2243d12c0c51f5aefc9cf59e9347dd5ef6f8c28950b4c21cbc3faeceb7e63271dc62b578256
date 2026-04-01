import { Price } from '../price/index.js';
import { Proration } from './proration.js';
export class TransactionItemPreview {
    price;
    quantity;
    includeInTotals;
    proration;
    constructor(transactionItem) {
        this.price = transactionItem.price ? new Price(transactionItem.price) : null;
        this.quantity = transactionItem.quantity;
        this.includeInTotals = transactionItem.include_in_totals ?? null;
        this.proration = transactionItem.proration ? new Proration(transactionItem.proration) : null;
    }
}
