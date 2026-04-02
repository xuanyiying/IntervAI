"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionItemPreview = void 0;
const index_js_1 = require("../price/index.js");
const proration_js_1 = require("./proration.js");
class TransactionItemPreview {
    price;
    quantity;
    includeInTotals;
    proration;
    constructor(transactionItem) {
        this.price = transactionItem.price ? new index_js_1.Price(transactionItem.price) : null;
        this.quantity = transactionItem.quantity;
        this.includeInTotals = transactionItem.include_in_totals ?? null;
        this.proration = transactionItem.proration ? new proration_js_1.Proration(transactionItem.proration) : null;
    }
}
exports.TransactionItemPreview = TransactionItemPreview;
