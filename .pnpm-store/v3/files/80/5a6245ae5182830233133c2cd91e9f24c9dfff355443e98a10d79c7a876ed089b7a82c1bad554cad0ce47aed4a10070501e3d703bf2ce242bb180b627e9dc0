import { SubscriptionTimePeriod } from './subscription-time-period.js';
import { TransactionDetailsPreview } from './transaction-details-preview.js';
import { NextTransactionAdjustmentPreview } from './next-transaction-adjustment-preview.js';
export class NextTransaction {
    billingPeriod;
    details;
    adjustments;
    constructor(nextTransaction) {
        this.billingPeriod = new SubscriptionTimePeriod(nextTransaction.billing_period);
        this.details = new TransactionDetailsPreview(nextTransaction.details);
        this.adjustments = nextTransaction.adjustments.map((adjustment) => new NextTransactionAdjustmentPreview(adjustment));
    }
}
