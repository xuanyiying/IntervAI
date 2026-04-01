import { ReportFilters } from './report-filters.js';
export class Report {
    id;
    status;
    rows;
    type;
    filters;
    expiresAt;
    createdAt;
    constructor(reportResponse) {
        this.id = reportResponse.id;
        this.status = reportResponse.status;
        this.rows = reportResponse.rows ?? null;
        this.type = reportResponse.type;
        this.filters = reportResponse.filters?.map((filter) => new ReportFilters(filter));
        this.expiresAt = reportResponse.expires_at ?? null;
        this.createdAt = reportResponse.created_at;
    }
}
