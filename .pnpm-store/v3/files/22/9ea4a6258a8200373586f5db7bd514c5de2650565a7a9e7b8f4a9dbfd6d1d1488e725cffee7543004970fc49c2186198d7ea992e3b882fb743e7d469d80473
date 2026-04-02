import { Money } from '../shared/index.js';
import { SubscriptionPreviewSummaryResult } from './subscription-preview-summary-result.js';
export class SubscriptionPreviewUpdateSummary {
    credit;
    charge;
    result;
    constructor(previewUpdateSummary) {
        this.credit = new Money(previewUpdateSummary.credit);
        this.charge = new Money(previewUpdateSummary.charge);
        this.result = new SubscriptionPreviewSummaryResult(previewUpdateSummary.result);
    }
}
