import { Event } from '../../../entities/events/event.js';
import { EventName } from '../../helpers/index.js';
import { ProductNotification } from '../../entities/index.js';
import { type IEventsResponse } from '../../../types/index.js';
import { type IProductNotificationResponse } from '../../types/index.js';
export declare class ProductCreatedEvent extends Event {
    readonly eventType = EventName.ProductCreated;
    readonly data: ProductNotification;
    constructor(response: IEventsResponse<IProductNotificationResponse>);
}
