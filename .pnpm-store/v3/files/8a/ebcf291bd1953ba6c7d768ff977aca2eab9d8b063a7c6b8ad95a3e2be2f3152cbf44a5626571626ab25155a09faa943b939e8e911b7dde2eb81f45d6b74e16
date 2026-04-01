import { Event } from '../../../entities/events/event.js';
import { EventName } from '../../helpers/index.js';
import { ProductNotification } from '../../entities/index.js';
export class ProductCreatedEvent extends Event {
    eventType = EventName.ProductCreated;
    data;
    constructor(response) {
        super(response);
        this.data = new ProductNotification(response.data);
    }
}
