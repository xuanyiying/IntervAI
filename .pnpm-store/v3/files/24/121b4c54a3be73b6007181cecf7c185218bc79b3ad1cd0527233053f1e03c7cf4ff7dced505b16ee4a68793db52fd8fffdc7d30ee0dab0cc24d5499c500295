import { Event } from '../../../entities/events/event.js';
import { EventName } from '../../helpers/index.js';
import { DiscountNotification } from '../../entities/index.js';
export class DiscountUpdatedEvent extends Event {
    eventType = EventName.DiscountUpdated;
    data;
    constructor(response) {
        super(response);
        this.data = new DiscountNotification(response.data);
    }
}
