import { Event } from '../../../entities/events/event.js';
import { EventName } from '../../helpers/index.js';
import { PriceNotification } from '../../entities/index.js';
import { type IEventsResponse } from '../../../types/index.js';
import { type IPriceNotificationResponse } from '../../types/index.js';
export declare class PriceCreatedEvent extends Event {
    readonly eventType = EventName.PriceCreated;
    readonly data: PriceNotification;
    constructor(response: IEventsResponse<IPriceNotificationResponse>);
}
