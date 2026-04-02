"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdjustmentProrationNotification = void 0;
const adjustment_time_period_notification_js_1 = require("./adjustment-time-period-notification.js");
class AdjustmentProrationNotification {
    rate;
    billingPeriod;
    constructor(adjustmentsProration) {
        this.rate = adjustmentsProration.rate;
        this.billingPeriod = adjustmentsProration.billing_period
            ? new adjustment_time_period_notification_js_1.AdjustmentTimePeriodNotification(adjustmentsProration.billing_period)
            : null;
    }
}
exports.AdjustmentProrationNotification = AdjustmentProrationNotification;
