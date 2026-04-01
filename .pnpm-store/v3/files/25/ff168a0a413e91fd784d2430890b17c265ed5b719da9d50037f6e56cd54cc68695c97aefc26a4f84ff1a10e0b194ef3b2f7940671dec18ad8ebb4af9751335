import { Event } from '../../../entities/events/event.js';
import { EventName } from '../../helpers/index.js';
import { ProductNotification } from '../../entities/index.js';
export class ProductUpdatedEvent extends Event {
    eventType = EventName.ProductUpdated;
    data;
    constructor(response) {
        super(response);
        this.data = new ProductNotification(response.data);
    }
}
