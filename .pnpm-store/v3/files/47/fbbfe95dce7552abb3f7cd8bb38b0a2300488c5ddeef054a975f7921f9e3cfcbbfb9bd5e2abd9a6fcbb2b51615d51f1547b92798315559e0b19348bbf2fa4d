import { Event } from '../../../entities/events/event.js';
import { EventName } from '../../helpers/index.js';
import { SubscriptionNotification } from '../../entities/index.js';
export class SubscriptionTrialingEvent extends Event {
    eventType = EventName.SubscriptionTrialing;
    data;
    constructor(response) {
        super(response);
        this.data = new SubscriptionNotification(response.data);
    }
}
