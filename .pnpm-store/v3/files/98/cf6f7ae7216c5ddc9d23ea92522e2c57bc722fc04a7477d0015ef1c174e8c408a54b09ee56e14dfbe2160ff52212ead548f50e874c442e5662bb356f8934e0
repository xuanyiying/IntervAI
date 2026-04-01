import { type AdjustmentAction, type AdjustmentStatus, type CurrencyCode } from '../../enums/index.js';
import { TransactionAdjustmentItem } from './transaction-adjustment-item.js';
import { PayoutTotalsAdjustment, TotalAdjustments } from '../shared/index.js';
import { type ITransactionAdjustmentResponse } from '../../types/index.js';
export declare class TransactionAdjustment {
    readonly id: string;
    readonly action: AdjustmentAction;
    readonly transactionId: string;
    readonly subscriptionId: string | null;
    readonly customerId: string;
    readonly reason: string;
    readonly creditAppliedToBalance: boolean;
    readonly currencyCode: CurrencyCode;
    readonly status: AdjustmentStatus;
    readonly items: TransactionAdjustmentItem[];
    readonly totals: TotalAdjustments | null;
    readonly payoutTotals: PayoutTotalsAdjustment | null;
    readonly createdAt: string;
    readonly updatedAt: string;
    constructor(adjustment: ITransactionAdjustmentResponse);
}
