import { Event } from '../../../entities/events/event.js';
import { EventName } from '../../helpers/index.js';
import { DiscountNotification } from '../../entities/index.js';
export class DiscountCreatedEvent extends Event {
    eventType = EventName.DiscountCreated;
    data;
    constructor(response) {
        super(response);
        this.data = new DiscountNotification(response.data);
    }
}
