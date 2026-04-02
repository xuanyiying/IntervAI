import { AdjustmentProrationNotification } from './adjustment-proration-notification.js';
import { AdjustmentItemTotalsNotification } from './adjustment-item-totals-notification.js';
export class AdjustmentItemNotification {
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
        this.proration = adjustmentItem.proration ? new AdjustmentProrationNotification(adjustmentItem.proration) : null;
        this.totals = adjustmentItem.totals ? new AdjustmentItemTotalsNotification(adjustmentItem.totals) : null;
    }
}
