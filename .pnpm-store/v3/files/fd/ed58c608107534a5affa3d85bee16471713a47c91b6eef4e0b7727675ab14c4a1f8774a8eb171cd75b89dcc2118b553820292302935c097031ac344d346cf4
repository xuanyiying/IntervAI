import { TaxRatesUsedNotification, TransactionPayoutTotalsAdjustedNotification, TransactionPayoutTotalsNotification, TransactionTotalsAdjustedNotification, TransactionTotalsNotification } from '../shared/index.js';
import { TransactionLineItemNotification } from './transaction-line-item-notification.js';
import { type ITransactionDetailsNotificationResponse } from '../../types/index.js';
export declare class TransactionDetailsNotification {
    readonly taxRatesUsed: TaxRatesUsedNotification[];
    readonly totals: TransactionTotalsNotification | null;
    readonly adjustedTotals: TransactionTotalsAdjustedNotification | null;
    readonly payoutTotals: TransactionPayoutTotalsNotification | null;
    readonly adjustedPayoutTotals: TransactionPayoutTotalsAdjustedNotification | null;
    readonly lineItems: TransactionLineItemNotification[];
    constructor(transactionDetails: ITransactionDetailsNotificationResponse);
}
