import { Event } from '../../../entities/events/event.js';
import { EventName } from '../../helpers/index.js';
import { AdjustmentNotification } from '../../entities/index.js';
import { type IEventsResponse } from '../../../types/index.js';
import { type IAdjustmentNotificationResponse } from '../../types/index.js';
export declare class AdjustmentUpdatedEvent extends Event {
    readonly eventType = EventName.AdjustmentUpdated;
    readonly data: AdjustmentNotification;
    constructor(response: IEventsResponse<IAdjustmentNotificationResponse>);
}
