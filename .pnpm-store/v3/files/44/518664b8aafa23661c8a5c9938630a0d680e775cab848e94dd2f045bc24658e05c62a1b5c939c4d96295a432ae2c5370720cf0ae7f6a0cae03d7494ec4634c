import { BaseResource } from '../../internal/base/index.js';
import { PricingPreview } from '../../entities/pricing-preview/index.js';
const PricingPreviewPaths = {
    preview: '/pricing-preview',
};
export * from './operations/index.js';
export class PricingPreviewResource extends BaseResource {
    async preview(pricePreviewParameter) {
        const response = await this.client.post(PricingPreviewPaths.preview, pricePreviewParameter);
        const data = this.handleResponse(response);
        return new PricingPreview(data);
    }
}
