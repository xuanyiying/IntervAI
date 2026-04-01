"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdjustmentTotals = void 0;
const adjustment_totals_breakdown_js_1 = require("./adjustment-totals-breakdown.js");
class AdjustmentTotals {
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
        this.breakdown = adjustmentTotals.breakdown ? new adjustment_totals_breakdown_js_1.AdjustmentTotalsBreakdown(adjustmentTotals.breakdown) : null;
        this.currencyCode = adjustmentTotals.currency_code;
    }
}
exports.AdjustmentTotals = AdjustmentTotals;
