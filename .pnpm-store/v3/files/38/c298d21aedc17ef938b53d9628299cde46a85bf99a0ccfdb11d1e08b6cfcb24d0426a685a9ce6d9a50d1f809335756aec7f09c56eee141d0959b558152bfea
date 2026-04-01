"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionItemNotification = void 0;
const index_js_1 = require("../price/index.js");
const transaction_proration_notification_js_1 = require("./transaction-proration-notification.js");
class TransactionItemNotification {
    price;
    quantity;
    proration;
    constructor(transactionItem) {
        this.price = transactionItem.price ? new index_js_1.PriceNotification(transactionItem.price) : null;
        this.quantity = transactionItem.quantity;
        this.proration = transactionItem.proration ? new transaction_proration_notification_js_1.TransactionProrationNotification(transactionItem.proration) : null;
    }
}
exports.TransactionItemNotification = TransactionItemNotification;
