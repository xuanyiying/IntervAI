import { Event } from '../../../entities/events/event.js';
import { EventName } from '../../helpers/index.js';
import { SubscriptionNotification } from '../../entities/index.js';
export class SubscriptionResumedEvent extends Event {
    eventType = EventName.SubscriptionResumed;
    data;
    constructor(response) {
        super(response);
        this.data = new SubscriptionNotification(response.data);
    }
}
