import { Event } from '../../../entities/events/event.js';
import { EventName } from '../../helpers/index.js';
import { SubscriptionNotification } from '../../entities/index.js';
export class SubscriptionUpdatedEvent extends Event {
    eventType = EventName.SubscriptionUpdated;
    data;
    constructor(response) {
        super(response);
        this.data = new SubscriptionNotification(response.data);
    }
}
