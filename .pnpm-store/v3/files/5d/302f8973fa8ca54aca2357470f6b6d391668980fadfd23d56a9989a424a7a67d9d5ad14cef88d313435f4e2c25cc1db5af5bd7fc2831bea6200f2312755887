import { AdjustmentItemTotals, AdjustmentProration } from '../adjustment/index.js';
export class NextTransactionAdjustmentItem {
    itemId;
    type;
    amount;
    proration;
    totals;
    constructor(adjustmentItem) {
        this.itemId = adjustmentItem.item_id;
        this.type = adjustmentItem.type;
        this.amount = adjustmentItem.amount ? adjustmentItem.amount : null;
        this.proration = adjustmentItem.proration ? new AdjustmentProration(adjustmentItem.proration) : null;
        this.totals = adjustmentItem.totals ? new AdjustmentItemTotals(adjustmentItem.totals) : null;
    }
}
