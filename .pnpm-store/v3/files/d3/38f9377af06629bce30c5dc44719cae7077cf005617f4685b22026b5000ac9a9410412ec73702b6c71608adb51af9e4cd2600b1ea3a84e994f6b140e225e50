import { ChargebackFeeNotification } from './chargeback-fee-notification.js';
import { type PayoutCurrencyCode } from '../../../enums/index.js';
import { type ITransactionPayoutTotalsAdjustedNotificationResponse } from '../../types/index.js';
export declare class TransactionPayoutTotalsAdjustedNotification {
    readonly subtotal: string;
    readonly tax: string;
    readonly total: string;
    readonly fee: string;
    readonly chargebackFee: ChargebackFeeNotification | null;
    readonly earnings: string;
    readonly currencyCode: PayoutCurrencyCode;
    readonly exchangeRate: string;
    readonly retainedFee: string;
    constructor(transactionPayoutTotalsAdjusted: ITransactionPayoutTotalsAdjustedNotificationResponse);
}
