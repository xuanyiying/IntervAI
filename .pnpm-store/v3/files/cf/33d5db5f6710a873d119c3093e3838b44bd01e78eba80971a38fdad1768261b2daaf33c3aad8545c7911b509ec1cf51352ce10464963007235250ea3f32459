import { Price } from '../price/index.js';
import { TransactionProration } from './transaction-proration.js';
export class TransactionItem {
    price;
    quantity;
    proration;
    constructor(transactionItem) {
        this.price = transactionItem.price ? new Price(transactionItem.price) : null;
        this.quantity = transactionItem.quantity;
        this.proration = transactionItem.proration ? new TransactionProration(transactionItem.proration) : null;
    }
}
