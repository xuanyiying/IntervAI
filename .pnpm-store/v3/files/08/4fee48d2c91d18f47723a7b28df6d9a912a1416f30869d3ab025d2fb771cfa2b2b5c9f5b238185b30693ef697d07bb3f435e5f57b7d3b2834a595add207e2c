import { NextTransactionAdjustmentItem } from './next-transaction-adjustment-item.js';
import { TotalAdjustments } from '../shared/index.js';
export class NextTransactionAdjustmentPreview {
    transactionId;
    items;
    totals;
    constructor(adjustmentPreview) {
        this.transactionId = adjustmentPreview.transaction_id;
        this.items = adjustmentPreview.items.map((item) => new NextTransactionAdjustmentItem(item));
        this.totals = adjustmentPreview.totals ? new TotalAdjustments(adjustmentPreview.totals) : null;
    }
}
