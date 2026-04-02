import { type AdjustmentActionType, type AdjustmentAction, type AdjustmentStatus, type CurrencyCode } from '../../../enums/index.js';
import { AdjustmentItemNotification } from './adjustment-item-notification.js';
import { PayoutTotalsAdjustmentNotification, TotalAdjustmentsNotification } from '../shared/index.js';
import { type IAdjustmentNotificationResponse } from '../../types/index.js';
export declare class AdjustmentNotification {
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
    readonly items: AdjustmentItemNotification[];
    readonly totals: TotalAdjustmentsNotification;
    readonly payoutTotals: PayoutTotalsAdjustmentNotification | null;
    readonly createdAt: string;
    readonly updatedAt: string;
    constructor(adjustment: IAdjustmentNotificationResponse);
}
