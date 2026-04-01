"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdjustmentItem = void 0;
const adjustment_proration_js_1 = require("./adjustment-proration.js");
const adjustment_item_totals_js_1 = require("./adjustment-item-totals.js");
class AdjustmentItem {
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
        this.proration = adjustmentItem.proration ? new adjustment_proration_js_1.AdjustmentProration(adjustmentItem.proration) : null;
        this.totals = adjustmentItem.totals ? new adjustment_item_totals_js_1.AdjustmentItemTotals(adjustmentItem.totals) : null;
    }
}
exports.AdjustmentItem = AdjustmentItem;
