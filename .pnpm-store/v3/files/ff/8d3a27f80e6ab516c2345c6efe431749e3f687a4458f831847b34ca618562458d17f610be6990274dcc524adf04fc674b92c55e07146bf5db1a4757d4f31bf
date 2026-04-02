import { Event } from '../../../entities/events/event.js';
import { EventName } from '../../helpers/index.js';
import { CustomerNotification } from '../../entities/index.js';
import { type IEventsResponse } from '../../../types/index.js';
import { type ICustomerNotificationResponse } from '../../types/index.js';
export declare class CustomerCreatedEvent extends Event {
    readonly eventType = EventName.CustomerCreated;
    readonly data: CustomerNotification;
    constructor(response: IEventsResponse<ICustomerNotificationResponse>);
}
