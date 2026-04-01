import { Event } from '../../../entities/events/event.js';
import { EventName } from '../../helpers/index.js';
import { SubscriptionCreatedNotification } from '../../entities/index.js';
import { type IEventsResponse } from '../../../types/index.js';
import { type ISubscriptionCreatedNotificationResponse } from '../../types/index.js';
export declare class SubscriptionCreatedEvent extends Event {
    readonly eventType = EventName.SubscriptionCreated;
    readonly data: SubscriptionCreatedNotification;
    constructor(response: IEventsResponse<ISubscriptionCreatedNotificationResponse>);
}
