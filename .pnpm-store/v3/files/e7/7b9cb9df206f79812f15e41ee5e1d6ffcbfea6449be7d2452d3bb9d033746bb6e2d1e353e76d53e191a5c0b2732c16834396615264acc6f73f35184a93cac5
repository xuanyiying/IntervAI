"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionProrationNotification = void 0;
const transactions_time_period_notification_js_1 = require("./transactions-time-period-notification.js");
class TransactionProrationNotification {
    rate;
    billingPeriod;
    constructor(transactionProration) {
        this.rate = transactionProration.rate;
        this.billingPeriod = transactionProration.billing_period
            ? new transactions_time_period_notification_js_1.TransactionsTimePeriodNotification(transactionProration.billing_period)
            : null;
    }
}
exports.TransactionProrationNotification = TransactionProrationNotification;
