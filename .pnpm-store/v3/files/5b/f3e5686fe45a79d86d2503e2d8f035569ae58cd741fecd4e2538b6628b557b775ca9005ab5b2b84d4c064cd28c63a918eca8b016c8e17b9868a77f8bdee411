import { Event } from '../../../entities/events/event.js';
import { EventName } from '../../helpers/index.js';
import { DiscountGroupNotification } from '../../entities/index.js';
import { type IEventsResponse } from '../../../types/index.js';
import { IDiscountGroupNotificationResponse } from '../../types/index.js';
export declare class DiscountGroupCreatedEvent extends Event {
    readonly eventType = EventName.DiscountGroupCreated;
    readonly data: DiscountGroupNotification;
    constructor(response: IEventsResponse<IDiscountGroupNotificationResponse>);
}
