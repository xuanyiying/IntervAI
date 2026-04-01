import { Event } from '../../../entities/events/event.js';
import { EventName } from '../../helpers/index.js';
import { ClientTokenNotification } from '../../entities/index.js';
export class ClientTokenRevokedEvent extends Event {
    eventType = EventName.ClientTokenRevoked;
    data;
    constructor(response) {
        super(response);
        this.data = new ClientTokenNotification(response.data);
    }
}
