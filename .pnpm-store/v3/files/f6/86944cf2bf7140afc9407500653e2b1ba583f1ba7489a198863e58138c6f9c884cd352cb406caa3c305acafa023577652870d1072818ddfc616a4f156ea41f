import { AdjustmentTimePeriodNotification } from './adjustment-time-period-notification.js';
export class AdjustmentProrationNotification {
    rate;
    billingPeriod;
    constructor(adjustmentsProration) {
        this.rate = adjustmentsProration.rate;
        this.billingPeriod = adjustmentsProration.billing_period
            ? new AdjustmentTimePeriodNotification(adjustmentsProration.billing_period)
            : null;
    }
}
