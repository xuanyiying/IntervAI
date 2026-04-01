"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChargebackFeeNotification = void 0;
const adjustment_original_amount_notification_js_1 = require("./adjustment-original-amount-notification.js");
class ChargebackFeeNotification {
    amount;
    original;
    constructor(chargebackFee) {
        this.amount = chargebackFee.amount;
        this.original = chargebackFee.original ? new adjustment_original_amount_notification_js_1.AdjustmentOriginalAmountNotification(chargebackFee.original) : null;
    }
}
exports.ChargebackFeeNotification = ChargebackFeeNotification;
