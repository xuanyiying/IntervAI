import { Event } from '../../../entities/events/event.js';
import { EventName } from '../../helpers/index.js';
import { SubscriptionNotification } from '../../entities/index.js';
export class SubscriptionImportedEvent extends Event {
    eventType = EventName.SubscriptionImported;
    data;
    constructor(response) {
        super(response);
        this.data = new SubscriptionNotification(response.data);
    }
}
