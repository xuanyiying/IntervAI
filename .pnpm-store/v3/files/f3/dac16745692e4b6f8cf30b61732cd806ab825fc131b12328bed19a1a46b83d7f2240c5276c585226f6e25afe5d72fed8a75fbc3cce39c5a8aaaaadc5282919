import { type AdjustmentAction, type AdjustmentType, type AdjustmentTaxMode } from '../../../enums/index.js';
export interface CreateAdjustmentLineItem {
    amount: string | null;
    itemId: string;
    type: AdjustmentType;
}
interface CreatePartialAdjustmentRequestBody {
    action: AdjustmentAction;
    items: CreateAdjustmentLineItem[];
    reason: string;
    transactionId: string;
    taxMode?: AdjustmentTaxMode;
    type?: 'partial';
}
interface CreateFullAdjustmentRequestBody {
    action: AdjustmentAction;
    reason: string;
    transactionId: string;
    taxMode?: AdjustmentTaxMode;
    type?: 'full';
}
export type CreateAdjustmentRequestBody = CreatePartialAdjustmentRequestBody | CreateFullAdjustmentRequestBody;
export {};
