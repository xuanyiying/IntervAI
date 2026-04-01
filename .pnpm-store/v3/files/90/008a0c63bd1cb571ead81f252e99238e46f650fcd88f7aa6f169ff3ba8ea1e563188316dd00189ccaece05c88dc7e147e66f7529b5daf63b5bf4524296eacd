import { type AdjustmentType } from '../../enums/index.js';
import { AdjustmentProration } from './adjustment-proration.js';
import { AdjustmentItemTotals } from './adjustment-item-totals.js';
import { type IAdjustmentItemResponse } from '../../types/index.js';
export declare class AdjustmentItem {
    readonly id: string;
    readonly itemId: string;
    readonly type: AdjustmentType;
    readonly amount: string | null;
    readonly proration: AdjustmentProration | null;
    readonly totals: AdjustmentItemTotals | null;
    constructor(adjustmentItem: IAdjustmentItemResponse);
}
