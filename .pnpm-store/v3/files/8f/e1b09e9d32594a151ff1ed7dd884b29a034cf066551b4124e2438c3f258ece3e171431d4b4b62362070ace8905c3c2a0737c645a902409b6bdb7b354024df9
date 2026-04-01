"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Proration = void 0;
const transactions_time_period_js_1 = require("./transactions-time-period.js");
class Proration {
    rate;
    billingPeriod;
    constructor(prorationResponse) {
        this.rate = prorationResponse.rate;
        this.billingPeriod = new transactions_time_period_js_1.TransactionsTimePeriod(prorationResponse.billing_period);
    }
}
exports.Proration = Proration;
