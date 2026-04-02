import { AdjustmentOriginalAmountNotification } from './adjustment-original-amount-notification.js';
export class ChargebackFeeNotification {
    amount;
    original;
    constructor(chargebackFee) {
        this.amount = chargebackFee.amount;
        this.original = chargebackFee.original ? new AdjustmentOriginalAmountNotification(chargebackFee.original) : null;
    }
}
