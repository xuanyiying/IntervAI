import { ChargebackFee } from './chargeback-fee.js';
import { type PayoutCurrencyCode } from '../../enums/index.js';
import { type IPayoutTotalsAdjustmentResponse } from '../../types/index.js';
export declare class PayoutTotalsAdjustment {
    readonly subtotal: string;
    readonly tax: string;
    readonly total: string;
    readonly fee: string;
    readonly chargebackFee: ChargebackFee | null;
    readonly earnings: string;
    readonly currencyCode: PayoutCurrencyCode;
    readonly retainedFee: string;
    constructor(payoutTotalsAdjustment: IPayoutTotalsAdjustmentResponse);
}
