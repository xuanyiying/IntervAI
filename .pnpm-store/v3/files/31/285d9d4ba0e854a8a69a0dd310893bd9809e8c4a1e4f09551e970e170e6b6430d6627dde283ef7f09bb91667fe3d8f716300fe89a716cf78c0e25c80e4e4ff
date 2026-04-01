import { type AdjustmentActionType, type AdjustmentAction, type AdjustmentStatus, type CurrencyCode } from '../../enums/index.js';
import { AdjustmentItem } from './adjustment-item.js';
import { PayoutTotalsAdjustment, TotalAdjustments } from '../shared/index.js';
import { type IAdjustmentResponse } from '../../types/index.js';
export declare class Adjustment {
    readonly id: string;
    readonly action: AdjustmentAction;
    readonly type: AdjustmentActionType;
    readonly transactionId: string;
    readonly subscriptionId: string | null;
    readonly customerId: string;
    readonly reason: string;
    readonly creditAppliedToBalance: boolean;
    readonly currencyCode: CurrencyCode;
    readonly status: AdjustmentStatus;
    readonly items: AdjustmentItem[];
    readonly totals: TotalAdjustments;
    readonly payoutTotals: PayoutTotalsAdjustment | null;
    readonly createdAt: string;
    readonly updatedAt: string;
    constructor(adjustment: IAdjustmentResponse);
}
