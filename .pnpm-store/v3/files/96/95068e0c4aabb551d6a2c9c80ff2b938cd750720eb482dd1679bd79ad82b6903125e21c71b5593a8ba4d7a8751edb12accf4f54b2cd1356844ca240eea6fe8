"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportNotification = void 0;
const report_filters_notification_js_1 = require("./report-filters-notification.js");
class ReportNotification {
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
        this.filters = reportResponse.filters?.map((filter) => new report_filters_notification_js_1.ReportFiltersNotification(filter));
        this.expiresAt = reportResponse.expires_at ?? null;
        this.createdAt = reportResponse.created_at;
    }
}
exports.ReportNotification = ReportNotification;
