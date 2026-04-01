"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionPreviewUpdateSummary = void 0;
const index_js_1 = require("../shared/index.js");
const subscription_preview_summary_result_js_1 = require("./subscription-preview-summary-result.js");
class SubscriptionPreviewUpdateSummary {
    credit;
    charge;
    result;
    constructor(previewUpdateSummary) {
        this.credit = new index_js_1.Money(previewUpdateSummary.credit);
        this.charge = new index_js_1.Money(previewUpdateSummary.charge);
        this.result = new subscription_preview_summary_result_js_1.SubscriptionPreviewSummaryResult(previewUpdateSummary.result);
    }
}
exports.SubscriptionPreviewUpdateSummary = SubscriptionPreviewUpdateSummary;
