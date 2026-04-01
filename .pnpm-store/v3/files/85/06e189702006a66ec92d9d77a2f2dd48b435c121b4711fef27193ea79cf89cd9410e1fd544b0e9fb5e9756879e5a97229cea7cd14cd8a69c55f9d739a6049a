import { TransactionAdjustmentItem } from './transaction-adjustment-item.js';
import { PayoutTotalsAdjustment, TotalAdjustments } from '../shared/index.js';
export class TransactionAdjustment {
    id;
    action;
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
        this.transactionId = adjustment.transaction_id;
        this.subscriptionId = adjustment.subscription_id ? adjustment.subscription_id : null;
        this.customerId = adjustment.customer_id;
        this.reason = adjustment.reason;
        this.creditAppliedToBalance = adjustment.credit_applied_to_balance;
        this.currencyCode = adjustment.currency_code;
        this.status = adjustment.status;
        this.items = adjustment.items.map((item) => new TransactionAdjustmentItem(item));
        this.totals = adjustment.totals ? new TotalAdjustments(adjustment.totals) : null;
        this.payoutTotals = adjustment.payout_totals ? new PayoutTotalsAdjustment(adjustment.payout_totals) : null;
        this.createdAt = adjustment.created_at;
        this.updatedAt = adjustment.updated_at;
    }
}
