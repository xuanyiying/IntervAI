"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionItem = void 0;
const index_js_1 = require("../price/index.js");
const transaction_proration_js_1 = require("./transaction-proration.js");
class TransactionItem {
    price;
    quantity;
    proration;
    constructor(transactionItem) {
        this.price = transactionItem.price ? new index_js_1.Price(transactionItem.price) : null;
        this.quantity = transactionItem.quantity;
        this.proration = transactionItem.proration ? new transaction_proration_js_1.TransactionProration(transactionItem.proration) : null;
    }
}
exports.TransactionItem = TransactionItem;
