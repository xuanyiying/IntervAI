"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionPayoutTotalsAdjusted = void 0;
const chargeback_fee_js_1 = require("./chargeback-fee.js");
class TransactionPayoutTotalsAdjusted {
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
            ? new chargeback_fee_js_1.ChargebackFee(transactionPayoutTotalsAdjusted.chargeback_fee)
            : null;
        this.earnings = transactionPayoutTotalsAdjusted.earnings;
        this.currencyCode = transactionPayoutTotalsAdjusted.currency_code;
        this.exchangeRate = transactionPayoutTotalsAdjusted.exchange_rate;
        this.retainedFee = transactionPayoutTotalsAdjusted.retained_fee;
    }
}
exports.TransactionPayoutTotalsAdjusted = TransactionPayoutTotalsAdjusted;
