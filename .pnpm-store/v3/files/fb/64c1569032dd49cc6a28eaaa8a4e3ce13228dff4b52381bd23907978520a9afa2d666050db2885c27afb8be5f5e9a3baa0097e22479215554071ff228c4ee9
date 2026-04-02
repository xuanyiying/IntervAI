import { Event } from '../../../entities/events/event.js';
import { EventName } from '../../helpers/index.js';
import { ClientTokenNotification } from '../../entities/index.js';
import { type IEventsResponse } from '../../../types/index.js';
import { IClientTokenNotificationResponse } from '../../types/index.js';
export declare class ClientTokenUpdatedEvent extends Event {
    readonly eventType = EventName.ClientTokenUpdated;
    readonly data: ClientTokenNotification;
    constructor(response: IEventsResponse<IClientTokenNotificationResponse>);
}
