import { Event } from '../../../entities/events/event.js';
import { EventName } from '../../helpers/index.js';
import { AdjustmentNotification } from '../../entities/index.js';
import { type IEventsResponse } from '../../../types/index.js';
import { type IAdjustmentNotificationResponse } from '../../types/index.js';
export declare class AdjustmentCreatedEvent extends Event {
    readonly eventType = EventName.AdjustmentCreated;
    readonly data: AdjustmentNotification;
    constructor(response: IEventsResponse<IAdjustmentNotificationResponse>);
}
