import { Event } from '../../../entities/events/event.js';
import { EventName } from '../../helpers/index.js';
import { ApiKeyNotification } from '../../entities/index.js';
import { type IEventsResponse } from '../../../types/index.js';
import { IApiKeyNotificationResponse } from '../../types/index.js';
export declare class ApiKeyRevokedEvent extends Event {
    readonly eventType = EventName.ApiKeyRevoked;
    readonly data: ApiKeyNotification;
    constructor(response: IEventsResponse<IApiKeyNotificationResponse>);
}
