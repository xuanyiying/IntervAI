import { ChargebackFeeNotification } from './chargeback-fee-notification.js';
import { type PayoutCurrencyCode } from '../../../enums/index.js';
import { type IPayoutTotalsAdjustmentNotificationResponse } from '../../types/index.js';
export declare class PayoutTotalsAdjustmentNotification {
    readonly subtotal: string;
    readonly tax: string;
    readonly total: string;
    readonly fee: string;
    readonly chargebackFee: ChargebackFeeNotification | null;
    readonly earnings: string;
    readonly currencyCode: PayoutCurrencyCode;
    readonly retainedFee: string;
    constructor(payoutTotalsAdjustment: IPayoutTotalsAdjustmentNotificationResponse);
}
