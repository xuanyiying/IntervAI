import { Event } from '../../../entities/events/event.js';
import { EventName } from '../../helpers/index.js';
import { ApiKeyNotification } from '../../entities/index.js';
export class ApiKeyExpiringEvent extends Event {
    eventType = EventName.ApiKeyExpiring;
    data;
    constructor(response) {
        super(response);
        this.data = new ApiKeyNotification(response.data);
    }
}
