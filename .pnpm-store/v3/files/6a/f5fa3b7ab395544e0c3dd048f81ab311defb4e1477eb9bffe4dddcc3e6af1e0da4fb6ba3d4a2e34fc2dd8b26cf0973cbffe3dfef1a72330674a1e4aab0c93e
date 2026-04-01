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
exports.ReportsResource = void 0;
const index_js_1 = require("../../internal/base/index.js");
const index_js_2 = require("../../entities/index.js");
const ReportPaths = {
    list: '/reports',
    create: '/reports',
    get: '/reports/{report_id}',
    getReportCsv: '/reports/{report_id}/download-url',
};
__exportStar(require("./operations/index.js"), exports);
class ReportsResource extends index_js_1.BaseResource {
    list(queryParams) {
        const queryParameters = new index_js_1.QueryParameters(queryParams);
        return new index_js_2.ReportCollection(this.client, ReportPaths.list + queryParameters.toQueryString());
    }
    async create(createReportParameters) {
        const response = await this.client.post(ReportPaths.create, createReportParameters);
        const data = this.handleResponse(response);
        return new index_js_2.Report(data);
    }
    async get(reportId) {
        const urlWithPathParams = new index_js_1.PathParameters(ReportPaths.get, {
            report_id: reportId,
        }).deriveUrl();
        const response = await this.client.get(urlWithPathParams);
        const data = this.handleResponse(response);
        return new index_js_2.Report(data);
    }
    async getReportCsv(reportId) {
        const urlWithPathParams = new index_js_1.PathParameters(ReportPaths.getReportCsv, {
            report_id: reportId,
        }).deriveUrl();
        const response = await this.client.get(urlWithPathParams);
        const data = this.handleResponse(response);
        return new index_js_2.ReportCsv(data);
    }
}
exports.ReportsResource = ReportsResource;
