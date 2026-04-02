import { Event } from '../../../entities/events/event.js';
import { EventName } from '../../helpers/index.js';
import { ReportNotification } from '../../entities/index.js';
import { type IEventsResponse } from '../../../types/index.js';
import { type IReportNotificationResponse } from '../../types/index.js';
export declare class ReportCreatedEvent extends Event {
    readonly eventType = EventName.ReportCreated;
    readonly data: ReportNotification;
    constructor(response: IEventsResponse<IReportNotificationResponse>);
}
