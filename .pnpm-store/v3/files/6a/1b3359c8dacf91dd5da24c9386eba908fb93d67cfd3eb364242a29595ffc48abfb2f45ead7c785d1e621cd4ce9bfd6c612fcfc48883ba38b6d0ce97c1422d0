import { Event } from '../../../entities/events/event.js';
import { EventName } from '../../helpers/index.js';
import { SubscriptionNotification } from '../../entities/index.js';
import { type IEventsResponse } from '../../../types/index.js';
import { type ISubscriptionNotificationResponse } from '../../types/index.js';
export declare class SubscriptionUpdatedEvent extends Event {
    readonly eventType = EventName.SubscriptionUpdated;
    readonly data: SubscriptionNotification;
    constructor(response: IEventsResponse<ISubscriptionNotificationResponse>);
}
