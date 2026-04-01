import { PriceNotification } from '../price/index.js';
import { TransactionProrationNotification } from './transaction-proration-notification.js';
export class TransactionItemNotification {
    price;
    quantity;
    proration;
    constructor(transactionItem) {
        this.price = transactionItem.price ? new PriceNotification(transactionItem.price) : null;
        this.quantity = transactionItem.quantity;
        this.proration = transactionItem.proration ? new TransactionProrationNotification(transactionItem.proration) : null;
    }
}
