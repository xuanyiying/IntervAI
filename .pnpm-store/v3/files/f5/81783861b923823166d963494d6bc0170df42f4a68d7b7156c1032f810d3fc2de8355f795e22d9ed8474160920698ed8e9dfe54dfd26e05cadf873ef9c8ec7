"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChargebackFee = void 0;
const adjustment_original_amount_js_1 = require("./adjustment-original-amount.js");
class ChargebackFee {
    amount;
    original;
    constructor(chargebackFee) {
        this.amount = chargebackFee.amount;
        this.original = chargebackFee.original ? new adjustment_original_amount_js_1.AdjustmentOriginalAmount(chargebackFee.original) : null;
    }
}
exports.ChargebackFee = ChargebackFee;
