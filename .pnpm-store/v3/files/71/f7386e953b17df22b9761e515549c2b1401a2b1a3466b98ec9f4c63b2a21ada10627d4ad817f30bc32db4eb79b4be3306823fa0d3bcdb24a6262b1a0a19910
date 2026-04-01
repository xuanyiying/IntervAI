import { BaseResource, PathParameters, QueryParameters } from '../../internal/base/index.js';
import { Adjustment, AdjustmentCollection, AdjustmentCreditNotePDF } from '../../entities/index.js';
const AdjustmentPaths = {
    list: '/adjustments',
    create: '/adjustments',
    getCreditNotePDF: '/adjustments/{adjustment_id}/credit-note',
};
export * from './operations/index.js';
export class AdjustmentsResource extends BaseResource {
    list(queryParams) {
        const queryParameters = new QueryParameters(queryParams);
        return new AdjustmentCollection(this.client, AdjustmentPaths.list + queryParameters.toQueryString());
    }
    async create(createAdjustmentParameters) {
        const response = await this.client.post(AdjustmentPaths.create, createAdjustmentParameters);
        const data = this.handleResponse(response);
        return new Adjustment(data);
    }
    async getCreditNotePDF(adjustmentId, queryParams) {
        const urlWithPathParams = new PathParameters(AdjustmentPaths.getCreditNotePDF, {
            adjustment_id: adjustmentId,
        }).deriveUrl();
        const queryParameters = new QueryParameters(queryParams);
        const response = await this.client.get(urlWithPathParams + queryParameters.toQueryString());
        const data = this.handleResponse(response);
        return new AdjustmentCreditNotePDF(data);
    }
}
