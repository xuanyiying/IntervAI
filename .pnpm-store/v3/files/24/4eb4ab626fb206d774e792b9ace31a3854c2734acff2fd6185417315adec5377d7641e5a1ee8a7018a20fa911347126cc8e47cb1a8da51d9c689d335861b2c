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
exports.PricingPreviewResource = void 0;
const index_js_1 = require("../../internal/base/index.js");
const index_js_2 = require("../../entities/pricing-preview/index.js");
const PricingPreviewPaths = {
    preview: '/pricing-preview',
};
__exportStar(require("./operations/index.js"), exports);
class PricingPreviewResource extends index_js_1.BaseResource {
    async preview(pricePreviewParameter) {
        const response = await this.client.post(PricingPreviewPaths.preview, pricePreviewParameter);
        const data = this.handleResponse(response);
        return new index_js_2.PricingPreview(data);
    }
}
exports.PricingPreviewResource = PricingPreviewResource;
