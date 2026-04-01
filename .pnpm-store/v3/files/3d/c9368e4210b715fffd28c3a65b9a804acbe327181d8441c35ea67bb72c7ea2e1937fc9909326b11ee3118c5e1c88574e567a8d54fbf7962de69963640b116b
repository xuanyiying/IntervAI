import { AdjustmentTimePeriod } from './adjustment-time-period.js';
export class AdjustmentProration {
    rate;
    billingPeriod;
    constructor(adjustmentsProration) {
        this.rate = adjustmentsProration.rate;
        this.billingPeriod = adjustmentsProration.billing_period
            ? new AdjustmentTimePeriod(adjustmentsProration.billing_period)
            : null;
    }
}
