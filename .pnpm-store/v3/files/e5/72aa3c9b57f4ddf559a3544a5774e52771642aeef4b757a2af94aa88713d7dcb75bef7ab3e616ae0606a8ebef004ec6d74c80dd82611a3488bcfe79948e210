import { type AdjustmentType } from '../../../enums/index.js';
import { AdjustmentProrationNotification } from './adjustment-proration-notification.js';
import { AdjustmentItemTotalsNotification } from './adjustment-item-totals-notification.js';
import { type IAdjustmentItemNotificationResponse } from '../../types/index.js';
export declare class AdjustmentItemNotification {
    readonly id: string;
    readonly itemId: string;
    readonly type: AdjustmentType;
    readonly amount: string | null;
    readonly proration: AdjustmentProrationNotification | null;
    readonly totals: AdjustmentItemTotalsNotification | null;
    constructor(adjustmentItem: IAdjustmentItemNotificationResponse);
}
