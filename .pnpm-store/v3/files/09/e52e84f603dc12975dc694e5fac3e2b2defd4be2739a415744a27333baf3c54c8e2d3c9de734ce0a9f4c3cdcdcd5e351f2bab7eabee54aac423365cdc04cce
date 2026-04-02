import { AdjustmentTotalsBreakdown } from './adjustment-totals-breakdown.js';
export class AdjustmentTotals {
    subtotal;
    tax;
    total;
    fee;
    earnings;
    breakdown;
    currencyCode;
    constructor(adjustmentTotals) {
        this.subtotal = adjustmentTotals.subtotal;
        this.tax = adjustmentTotals.tax;
        this.total = adjustmentTotals.total;
        this.fee = adjustmentTotals.fee;
        this.earnings = adjustmentTotals.earnings;
        this.breakdown = adjustmentTotals.breakdown ? new AdjustmentTotalsBreakdown(adjustmentTotals.breakdown) : null;
        this.currencyCode = adjustmentTotals.currency_code;
    }
}
