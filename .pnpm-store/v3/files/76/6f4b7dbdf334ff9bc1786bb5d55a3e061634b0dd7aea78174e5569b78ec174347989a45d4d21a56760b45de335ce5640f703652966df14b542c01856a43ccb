import { AdjustmentProration } from './adjustment-proration.js';
import { AdjustmentItemTotals } from './adjustment-item-totals.js';
export class AdjustmentItem {
    id;
    itemId;
    type;
    amount;
    proration;
    totals;
    constructor(adjustmentItem) {
        this.id = adjustmentItem.id;
        this.itemId = adjustmentItem.item_id;
        this.type = adjustmentItem.type;
        this.amount = adjustmentItem.amount ? adjustmentItem.amount : null;
        this.proration = adjustmentItem.proration ? new AdjustmentProration(adjustmentItem.proration) : null;
        this.totals = adjustmentItem.totals ? new AdjustmentItemTotals(adjustmentItem.totals) : null;
    }
}
