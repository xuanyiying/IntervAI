import { Event } from '../../../entities/events/event.js';
import { EventName } from '../../helpers/index.js';
import { ClientTokenNotification } from '../../entities/index.js';
export class ClientTokenUpdatedEvent extends Event {
    eventType = EventName.ClientTokenUpdated;
    data;
    constructor(response) {
        super(response);
        this.data = new ClientTokenNotification(response.data);
    }
}
