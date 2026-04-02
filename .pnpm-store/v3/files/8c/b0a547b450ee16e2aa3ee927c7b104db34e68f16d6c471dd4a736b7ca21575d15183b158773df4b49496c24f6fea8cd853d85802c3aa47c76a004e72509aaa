import { ChargebackFeeNotification } from './chargeback-fee-notification.js';
export class PayoutTotalsAdjustmentNotification {
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
            ? new ChargebackFeeNotification(payoutTotalsAdjustment.chargeback_fee)
            : null;
        this.earnings = payoutTotalsAdjustment.earnings;
        this.currencyCode = payoutTotalsAdjustment.currency_code;
        this.retainedFee = payoutTotalsAdjustment.retained_fee;
    }
}
