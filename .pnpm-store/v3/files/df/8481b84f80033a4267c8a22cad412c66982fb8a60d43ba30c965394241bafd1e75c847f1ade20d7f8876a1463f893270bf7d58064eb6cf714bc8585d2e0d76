"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NextTransactionAdjustmentPreview = void 0;
const next_transaction_adjustment_item_js_1 = require("./next-transaction-adjustment-item.js");
const index_js_1 = require("../shared/index.js");
class NextTransactionAdjustmentPreview {
    transactionId;
    items;
    totals;
    constructor(adjustmentPreview) {
        this.transactionId = adjustmentPreview.transaction_id;
        this.items = adjustmentPreview.items.map((item) => new next_transaction_adjustment_item_js_1.NextTransactionAdjustmentItem(item));
        this.totals = adjustmentPreview.totals ? new index_js_1.TotalAdjustments(adjustmentPreview.totals) : null;
    }
}
exports.NextTransactionAdjustmentPreview = NextTransactionAdjustmentPreview;
