"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Adjustment = void 0;
const adjustment_item_js_1 = require("./adjustment-item.js");
const index_js_1 = require("../shared/index.js");
class Adjustment {
    id;
    action;
    type;
    transactionId;
    subscriptionId;
    customerId;
    reason;
    creditAppliedToBalance;
    currencyCode;
    status;
    items;
    totals;
    payoutTotals;
    createdAt;
    updatedAt;
    constructor(adjustment) {
        this.id = adjustment.id;
        this.action = adjustment.action;
        this.type = adjustment.type;
        this.transactionId = adjustment.transaction_id;
        this.subscriptionId = adjustment.subscription_id ? adjustment.subscription_id : null;
        this.customerId = adjustment.customer_id;
        this.reason = adjustment.reason;
        this.creditAppliedToBalance = adjustment.credit_applied_to_balance;
        this.currencyCode = adjustment.currency_code;
        this.status = adjustment.status;
        this.items = adjustment.items.map((item) => new adjustment_item_js_1.AdjustmentItem(item));
        this.totals = new index_js_1.TotalAdjustments(adjustment.totals);
        this.payoutTotals = adjustment.payout_totals ? new index_js_1.PayoutTotalsAdjustment(adjustment.payout_totals) : null;
        this.createdAt = adjustment.created_at;
        this.updatedAt = adjustment.updated_at;
    }
}
exports.Adjustment = Adjustment;
