"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionProration = void 0;
const transactions_time_period_js_1 = require("./transactions-time-period.js");
class TransactionProration {
    rate;
    billingPeriod;
    constructor(transactionProration) {
        this.rate = transactionProration.rate;
        this.billingPeriod = transactionProration.billing_period
            ? new transactions_time_period_js_1.TransactionsTimePeriod(transactionProration.billing_period)
            : null;
    }
}
exports.TransactionProration = TransactionProration;
