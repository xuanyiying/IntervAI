"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NextTransactionAdjustmentItem = void 0;
const index_js_1 = require("../adjustment/index.js");
class NextTransactionAdjustmentItem {
    itemId;
    type;
    amount;
    proration;
    totals;
    constructor(adjustmentItem) {
        this.itemId = adjustmentItem.item_id;
        this.type = adjustmentItem.type;
        this.amount = adjustmentItem.amount ? adjustmentItem.amount : null;
        this.proration = adjustmentItem.proration ? new index_js_1.AdjustmentProration(adjustmentItem.proration) : null;
        this.totals = adjustmentItem.totals ? new index_js_1.AdjustmentItemTotals(adjustmentItem.totals) : null;
    }
}
exports.NextTransactionAdjustmentItem = NextTransactionAdjustmentItem;
