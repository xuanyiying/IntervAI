import { Event } from '../../../entities/events/event.js';
import { EventName } from '../../helpers/index.js';
import { ApiKeyNotification } from '../../entities/index.js';
export class ApiKeyUpdatedEvent extends Event {
    eventType = EventName.ApiKeyUpdated;
    data;
    constructor(response) {
        super(response);
        this.data = new ApiKeyNotification(response.data);
    }
}
