import { Event } from '../../../entities/events/event.js';
import { EventName } from '../../helpers/index.js';
import { SubscriptionCreatedNotification } from '../../entities/index.js';
export class SubscriptionCreatedEvent extends Event {
    eventType = EventName.SubscriptionCreated;
    data;
    constructor(response) {
        super(response);
        this.data = new SubscriptionCreatedNotification(response.data);
    }
}
