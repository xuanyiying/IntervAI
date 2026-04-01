import { TransactionsTimePeriod } from './transactions-time-period.js';
export class TransactionProration {
    rate;
    billingPeriod;
    constructor(transactionProration) {
        this.rate = transactionProration.rate;
        this.billingPeriod = transactionProration.billing_period
            ? new TransactionsTimePeriod(transactionProration.billing_period)
            : null;
    }
}
