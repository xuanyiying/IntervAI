import { Event } from '../../../entities/events/event.js';
import { EventName } from '../../helpers/index.js';
import { SubscriptionNotification } from '../../entities/index.js';
export class SubscriptionPastDueEvent extends Event {
    eventType = EventName.SubscriptionPastDue;
    data;
    constructor(response) {
        super(response);
        this.data = new SubscriptionNotification(response.data);
    }
}
