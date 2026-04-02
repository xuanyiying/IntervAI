"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionPayoutTotalsAdjustedNotification = void 0;
const chargeback_fee_notification_js_1 = require("./chargeback-fee-notification.js");
class TransactionPayoutTotalsAdjustedNotification {
    subtotal;
    tax;
    total;
    fee;
    chargebackFee;
    earnings;
    currencyCode;
    exchangeRate;
    retainedFee;
    constructor(transactionPayoutTotalsAdjusted) {
        this.subtotal = transactionPayoutTotalsAdjusted.subtotal;
        this.tax = transactionPayoutTotalsAdjusted.tax;
        this.total = transactionPayoutTotalsAdjusted.total;
        this.fee = transactionPayoutTotalsAdjusted.fee;
        this.chargebackFee = transactionPayoutTotalsAdjusted.chargeback_fee
            ? new chargeback_fee_notification_js_1.ChargebackFeeNotification(transactionPayoutTotalsAdjusted.chargeback_fee)
            : null;
        this.earnings = transactionPayoutTotalsAdjusted.earnings;
        this.currencyCode = transactionPayoutTotalsAdjusted.currency_code;
        this.exchangeRate = transactionPayoutTotalsAdjusted.exchange_rate;
        this.retainedFee = transactionPayoutTotalsAdjusted.retained_fee;
    }
}
exports.TransactionPayoutTotalsAdjustedNotification = TransactionPayoutTotalsAdjustedNotification;
