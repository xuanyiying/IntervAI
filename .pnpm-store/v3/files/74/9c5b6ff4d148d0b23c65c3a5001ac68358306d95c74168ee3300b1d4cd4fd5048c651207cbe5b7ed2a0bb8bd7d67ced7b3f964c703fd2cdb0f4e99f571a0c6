import { Event } from '../../../entities/events/event.js';
import { EventName } from '../../helpers/index.js';
import { DiscountNotification } from '../../entities/index.js';
export class DiscountImportedEvent extends Event {
    eventType = EventName.DiscountImported;
    data;
    constructor(response) {
        super(response);
        this.data = new DiscountNotification(response.data);
    }
}
