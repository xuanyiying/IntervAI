import { type ReportStatus, type ReportType } from '../../enums/index.js';
import { ReportFilters } from './report-filters.js';
import { type IReportResponse } from '../../types/index.js';
export declare class Report {
    readonly id: string;
    readonly status: ReportStatus;
    readonly rows: number | null;
    readonly type: ReportType;
    readonly filters: ReportFilters[];
    readonly expiresAt: string | null;
    readonly createdAt: string;
    constructor(reportResponse: IReportResponse);
}
