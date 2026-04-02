import { Event } from '../../../entities/events/event.js';
import { EventName } from '../../helpers/index.js';
import { DiscountNotification } from '../../entities/index.js';
import { type IEventsResponse } from '../../../types/index.js';
import { type IDiscountNotificationResponse } from '../../types/index.js';
export declare class DiscountCreatedEvent extends Event {
    readonly eventType = EventName.DiscountCreated;
    readonly data: DiscountNotification;
    constructor(response: IEventsResponse<IDiscountNotificationResponse>);
}
