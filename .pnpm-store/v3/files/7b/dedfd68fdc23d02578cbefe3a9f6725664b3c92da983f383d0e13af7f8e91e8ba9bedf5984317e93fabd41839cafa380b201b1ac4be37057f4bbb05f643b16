import { type ReportStatus, type ReportType } from '../../../enums/index.js';
import { ReportFiltersNotification } from './report-filters-notification.js';
import { type IReportNotificationResponse } from '../../types/index.js';
export declare class ReportNotification {
    readonly id: string;
    readonly status: ReportStatus;
    readonly rows: number | null;
    readonly type: ReportType;
    readonly filters: ReportFiltersNotification[];
    readonly expiresAt: string | null;
    readonly createdAt: string;
    constructor(reportResponse: IReportNotificationResponse);
}
