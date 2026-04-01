import { TransactionsTimePeriod } from './transactions-time-period.js';
export class Proration {
    rate;
    billingPeriod;
    constructor(prorationResponse) {
        this.rate = prorationResponse.rate;
        this.billingPeriod = new TransactionsTimePeriod(prorationResponse.billing_period);
    }
}
