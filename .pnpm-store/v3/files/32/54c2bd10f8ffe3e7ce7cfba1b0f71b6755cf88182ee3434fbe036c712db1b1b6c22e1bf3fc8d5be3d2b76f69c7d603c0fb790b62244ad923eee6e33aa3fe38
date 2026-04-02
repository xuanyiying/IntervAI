"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NextTransaction = void 0;
const subscription_time_period_js_1 = require("./subscription-time-period.js");
const transaction_details_preview_js_1 = require("./transaction-details-preview.js");
const next_transaction_adjustment_preview_js_1 = require("./next-transaction-adjustment-preview.js");
class NextTransaction {
    billingPeriod;
    details;
    adjustments;
    constructor(nextTransaction) {
        this.billingPeriod = new subscription_time_period_js_1.SubscriptionTimePeriod(nextTransaction.billing_period);
        this.details = new transaction_details_preview_js_1.TransactionDetailsPreview(nextTransaction.details);
        this.adjustments = nextTransaction.adjustments.map((adjustment) => new next_transaction_adjustment_preview_js_1.NextTransactionAdjustmentPreview(adjustment));
    }
}
exports.NextTransaction = NextTransaction;
