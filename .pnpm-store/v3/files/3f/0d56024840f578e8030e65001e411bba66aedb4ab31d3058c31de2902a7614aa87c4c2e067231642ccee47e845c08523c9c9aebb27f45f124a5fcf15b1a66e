import { TaxRatesUsed, TransactionPayoutTotals, TransactionPayoutTotalsAdjusted, TransactionTotals, TransactionTotalsAdjusted } from '../shared/index.js';
import { TransactionLineItem } from './transaction-line-item.js';
import { type ITransactionDetailsResponse } from '../../types/index.js';
export declare class TransactionDetails {
    readonly taxRatesUsed: TaxRatesUsed[];
    readonly totals: TransactionTotals | null;
    readonly adjustedTotals: TransactionTotalsAdjusted | null;
    readonly payoutTotals: TransactionPayoutTotals | null;
    readonly adjustedPayoutTotals: TransactionPayoutTotalsAdjusted | null;
    readonly lineItems: TransactionLineItem[];
    constructor(transactionDetails: ITransactionDetailsResponse);
}
