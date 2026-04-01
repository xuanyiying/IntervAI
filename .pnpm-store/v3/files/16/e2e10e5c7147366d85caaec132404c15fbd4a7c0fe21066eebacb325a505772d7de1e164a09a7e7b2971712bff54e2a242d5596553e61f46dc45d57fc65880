import { TransactionsTimePeriodNotification } from './transactions-time-period-notification.js';
export class TransactionProrationNotification {
    rate;
    billingPeriod;
    constructor(transactionProration) {
        this.rate = transactionProration.rate;
        this.billingPeriod = transactionProration.billing_period
            ? new TransactionsTimePeriodNotification(transactionProration.billing_period)
            : null;
    }
}
