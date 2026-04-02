"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdjustmentProration = void 0;
const adjustment_time_period_js_1 = require("./adjustment-time-period.js");
class AdjustmentProration {
    rate;
    billingPeriod;
    constructor(adjustmentsProration) {
        this.rate = adjustmentsProration.rate;
        this.billingPeriod = adjustmentsProration.billing_period
            ? new adjustment_time_period_js_1.AdjustmentTimePeriod(adjustmentsProration.billing_period)
            : null;
    }
}
exports.AdjustmentProration = AdjustmentProration;
