import { BaseResource } from '../../internal/base/index.js';
import { type CreateReportRequestBody, type ListReportQueryParameters } from './operations/index.js';
import { Report, ReportCollection, ReportCsv } from '../../entities/index.js';
export * from './operations/index.js';
export declare class ReportsResource extends BaseResource {
    list(queryParams?: ListReportQueryParameters): ReportCollection;
    create(createReportParameters: CreateReportRequestBody): Promise<Report>;
    get(reportId: string): Promise<Report>;
    getReportCsv(reportId: string): Promise<ReportCsv>;
}
