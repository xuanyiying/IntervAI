import { Event } from '../../../entities/events/event.js';
import { EventName } from '../../helpers/index.js';
import { ClientTokenNotification } from '../../entities/index.js';
export class ClientTokenCreatedEvent extends Event {
    eventType = EventName.ClientTokenCreated;
    data;
    constructor(response) {
        super(response);
        this.data = new ClientTokenNotification(response.data);
    }
}
