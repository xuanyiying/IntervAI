import { EventName } from '../../helpers/index.js';
import { Event } from '../../../entities/events/event.js';
import { AddressNotification } from '../../entities/index.js';
import { type IEventsResponse } from '../../../types/index.js';
import { type IAddressNotificationResponse } from '../../types/index.js';
export declare class AddressCreatedEvent extends Event {
    readonly eventType = EventName.AddressCreated;
    readonly data: AddressNotification;
    constructor(response: IEventsResponse<IAddressNotificationResponse>);
}
