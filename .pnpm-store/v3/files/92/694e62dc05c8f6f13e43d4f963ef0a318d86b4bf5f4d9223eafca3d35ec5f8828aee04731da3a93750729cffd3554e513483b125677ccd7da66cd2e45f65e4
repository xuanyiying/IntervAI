import { Event } from '../../../entities/events/event.js';
import { EventName } from '../../helpers/index.js';
import { DiscountGroupNotification } from '../../entities/index.js';
export class DiscountGroupCreatedEvent extends Event {
    eventType = EventName.DiscountGroupCreated;
    data;
    constructor(response) {
        super(response);
        this.data = new DiscountGroupNotification(response.data);
    }
}
