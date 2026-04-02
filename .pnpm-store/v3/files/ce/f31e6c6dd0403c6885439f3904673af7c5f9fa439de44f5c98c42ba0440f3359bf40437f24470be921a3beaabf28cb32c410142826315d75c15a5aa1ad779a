import { AdjustmentOriginalAmount } from './adjustment-original-amount.js';
export class ChargebackFee {
    amount;
    original;
    constructor(chargebackFee) {
        this.amount = chargebackFee.amount;
        this.original = chargebackFee.original ? new AdjustmentOriginalAmount(chargebackFee.original) : null;
    }
}
