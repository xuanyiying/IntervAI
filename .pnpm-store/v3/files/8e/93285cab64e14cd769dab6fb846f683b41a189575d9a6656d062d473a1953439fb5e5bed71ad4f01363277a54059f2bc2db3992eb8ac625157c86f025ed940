"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PayoutTotalsAdjustmentNotification = void 0;
const chargeback_fee_notification_js_1 = require("./chargeback-fee-notification.js");
class PayoutTotalsAdjustmentNotification {
    subtotal;
    tax;
    total;
    fee;
    chargebackFee;
    earnings;
    currencyCode;
    retainedFee;
    constructor(payoutTotalsAdjustment) {
        this.subtotal = payoutTotalsAdjustment.subtotal;
        this.tax = payoutTotalsAdjustment.tax;
        this.total = payoutTotalsAdjustment.total;
        this.fee = payoutTotalsAdjustment.fee;
        this.chargebackFee = payoutTotalsAdjustment.chargeback_fee
            ? new chargeback_fee_notification_js_1.ChargebackFeeNotification(payoutTotalsAdjustment.chargeback_fee)
            : null;
        this.earnings = payoutTotalsAdjustment.earnings;
        this.currencyCode = payoutTotalsAdjustment.currency_code;
        this.retainedFee = payoutTotalsAdjustment.retained_fee;
    }
}
exports.PayoutTotalsAdjustmentNotification = PayoutTotalsAdjustmentNotification;
