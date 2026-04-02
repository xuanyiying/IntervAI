import { Event } from '../../../entities/events/event.js';
import { EventName } from '../../helpers/index.js';
import { DiscountGroupNotification } from '../../entities/index.js';
export class DiscountGroupUpdatedEvent extends Event {
    eventType = EventName.DiscountGroupUpdated;
    data;
    constructor(response) {
        super(response);
        this.data = new DiscountGroupNotification(response.data);
    }
}
