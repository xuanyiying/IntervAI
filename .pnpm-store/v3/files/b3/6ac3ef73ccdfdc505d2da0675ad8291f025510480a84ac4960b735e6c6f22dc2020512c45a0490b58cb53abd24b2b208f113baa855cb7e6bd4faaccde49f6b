import { BaseResource, PathParameters, QueryParameters } from '../../internal/base/index.js';
import { Report, ReportCollection, ReportCsv } from '../../entities/index.js';
const ReportPaths = {
    list: '/reports',
    create: '/reports',
    get: '/reports/{report_id}',
    getReportCsv: '/reports/{report_id}/download-url',
};
export * from './operations/index.js';
export class ReportsResource extends BaseResource {
    list(queryParams) {
        const queryParameters = new QueryParameters(queryParams);
        return new ReportCollection(this.client, ReportPaths.list + queryParameters.toQueryString());
    }
    async create(createReportParameters) {
        const response = await this.client.post(ReportPaths.create, createReportParameters);
        const data = this.handleResponse(response);
        return new Report(data);
    }
    async get(reportId) {
        const urlWithPathParams = new PathParameters(ReportPaths.get, {
            report_id: reportId,
        }).deriveUrl();
        const response = await this.client.get(urlWithPathParams);
        const data = this.handleResponse(response);
        return new Report(data);
    }
    async getReportCsv(reportId) {
        const urlWithPathParams = new PathParameters(ReportPaths.getReportCsv, {
            report_id: reportId,
        }).deriveUrl();
        const response = await this.client.get(urlWithPathParams);
        const data = this.handleResponse(response);
        return new ReportCsv(data);
    }
}
