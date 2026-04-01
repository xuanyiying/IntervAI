import { type AdjustmentType } from '../../enums/index.js';
import { TransactionProration } from './transaction-proration.js';
import { AdjustmentItemTotals } from '../adjustment/index.js';
import { type ITransactionAdjustmentItemResponse } from '../../types/index.js';
export declare class TransactionAdjustmentItem {
    readonly id: string | null;
    readonly itemId: string;
    readonly type: AdjustmentType;
    readonly amount: string | null;
    readonly proration: TransactionProration | null;
    readonly totals: AdjustmentItemTotals | null;
    constructor(transactionAdjustmentItem: ITransactionAdjustmentItemResponse);
}
