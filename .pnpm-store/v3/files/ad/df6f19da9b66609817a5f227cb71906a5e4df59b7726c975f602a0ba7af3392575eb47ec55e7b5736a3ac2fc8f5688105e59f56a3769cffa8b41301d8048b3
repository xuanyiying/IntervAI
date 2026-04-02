import { Event } from '../../../entities/events/event.js';
import { EventName } from '../../helpers/index.js';
import { BusinessNotification } from '../../entities/index.js';
import { type IEventsResponse } from '../../../types/index.js';
import { type IBusinessNotificationResponse } from '../../types/index.js';
export declare class BusinessCreatedEvent extends Event {
    readonly eventType = EventName.BusinessCreated;
    readonly data: BusinessNotification;
    constructor(response: IEventsResponse<IBusinessNotificationResponse>);
}
