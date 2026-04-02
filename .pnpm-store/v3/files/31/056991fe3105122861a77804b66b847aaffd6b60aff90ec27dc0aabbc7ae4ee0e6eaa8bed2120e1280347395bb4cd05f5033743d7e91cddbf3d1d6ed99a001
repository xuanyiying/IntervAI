"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionAdjustmentItem = void 0;
const transaction_proration_js_1 = require("./transaction-proration.js");
const index_js_1 = require("../adjustment/index.js");
class TransactionAdjustmentItem {
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
            ? new transaction_proration_js_1.TransactionProration(transactionAdjustmentItem.proration)
            : null;
        this.totals = transactionAdjustmentItem.totals ? new index_js_1.AdjustmentItemTotals(transactionAdjustmentItem.totals) : null;
    }
}
exports.TransactionAdjustmentItem = TransactionAdjustmentItem;
