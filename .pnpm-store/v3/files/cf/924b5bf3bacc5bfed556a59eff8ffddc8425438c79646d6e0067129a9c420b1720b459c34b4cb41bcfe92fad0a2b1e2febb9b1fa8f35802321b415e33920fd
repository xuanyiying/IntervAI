import { TransactionProration } from './transaction-proration.js';
import { AdjustmentItemTotals } from '../adjustment/index.js';
export class TransactionAdjustmentItem {
    id;
    itemId;
    type;
    amount;
    proration;
    totals;
    constructor(transactionAdjustmentItem) {
        this.id = transactionAdjustmentItem.id ? transactionAdjustmentItem.id : null;
        this.itemId = transactionAdjustmentItem.item_id;
        this.type = transactionAdjustmentItem.type;
        this.amount = transactionAdjustmentItem.amount ? transactionAdjustmentItem.amount : null;
        this.proration = transactionAdjustmentItem.proration
            ? new TransactionProration(transactionAdjustmentItem.proration)
            : null;
        this.totals = transactionAdjustmentItem.totals ? new AdjustmentItemTotals(transactionAdjustmentItem.totals) : null;
    }
}
