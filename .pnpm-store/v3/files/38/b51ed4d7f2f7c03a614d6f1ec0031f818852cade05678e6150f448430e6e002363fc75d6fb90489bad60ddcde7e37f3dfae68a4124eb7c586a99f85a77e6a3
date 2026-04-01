import { BaseResource } from '../../internal/base/index.js';
import { type CreateAdjustmentRequestBody, type GetAdjustmentCreditNoteQueryParameters, type ListAdjustmentQueryParameters } from './operations/index.js';
import { Adjustment, AdjustmentCollection, AdjustmentCreditNotePDF } from '../../entities/index.js';
export * from './operations/index.js';
export declare class AdjustmentsResource extends BaseResource {
    list(queryParams?: ListAdjustmentQueryParameters): AdjustmentCollection;
    create(createAdjustmentParameters: CreateAdjustmentRequestBody): Promise<Adjustment>;
    getCreditNotePDF(adjustmentId: string, queryParams?: GetAdjustmentCreditNoteQueryParameters): Promise<AdjustmentCreditNotePDF>;
}
