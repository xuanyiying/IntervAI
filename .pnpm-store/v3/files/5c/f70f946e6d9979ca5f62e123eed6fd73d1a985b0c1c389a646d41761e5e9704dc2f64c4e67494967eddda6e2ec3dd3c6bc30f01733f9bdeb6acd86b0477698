import { Event } from '../../../entities/events/event.js';
import { EventName } from '../../helpers/index.js';
import { ApiKeyNotification } from '../../entities/index.js';
export class ApiKeyRevokedEvent extends Event {
    eventType = EventName.ApiKeyRevoked;
    data;
    constructor(response) {
        super(response);
        this.data = new ApiKeyNotification(response.data);
    }
}
