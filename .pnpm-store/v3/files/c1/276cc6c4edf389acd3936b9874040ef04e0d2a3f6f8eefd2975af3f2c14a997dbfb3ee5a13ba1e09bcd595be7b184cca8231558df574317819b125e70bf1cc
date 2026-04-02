"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdjustmentsResource = void 0;
const index_js_1 = require("../../internal/base/index.js");
const index_js_2 = require("../../entities/index.js");
const AdjustmentPaths = {
    list: '/adjustments',
    create: '/adjustments',
    getCreditNotePDF: '/adjustments/{adjustment_id}/credit-note',
};
__exportStar(require("./operations/index.js"), exports);
class AdjustmentsResource extends index_js_1.BaseResource {
    list(queryParams) {
        const queryParameters = new index_js_1.QueryParameters(queryParams);
        return new index_js_2.AdjustmentCollection(this.client, AdjustmentPaths.list + queryParameters.toQueryString());
    }
    async create(createAdjustmentParameters) {
        const response = await this.client.post(AdjustmentPaths.create, createAdjustmentParameters);
        const data = this.handleResponse(response);
        return new index_js_2.Adjustment(data);
    }
    async getCreditNotePDF(adjustmentId, queryParams) {
        const urlWithPathParams = new index_js_1.PathParameters(AdjustmentPaths.getCreditNotePDF, {
            adjustment_id: adjustmentId,
        }).deriveUrl();
        const queryParameters = new index_js_1.QueryParameters(queryParams);
        const response = await this.client.get(urlWithPathParams + queryParameters.toQueryString());
        const data = this.handleResponse(response);
        return new index_js_2.AdjustmentCreditNotePDF(data);
    }
}
exports.AdjustmentsResource = AdjustmentsResource;
