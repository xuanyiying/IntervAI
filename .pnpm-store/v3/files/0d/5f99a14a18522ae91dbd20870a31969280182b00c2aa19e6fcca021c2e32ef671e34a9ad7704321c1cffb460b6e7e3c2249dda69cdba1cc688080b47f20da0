import { Event } from '../../../entities/events/event.js';
import { EventName } from '../../helpers/index.js';
import { PriceNotification } from '../../entities/index.js';
export class PriceCreatedEvent extends Event {
    eventType = EventName.PriceCreated;
    data;
    constructor(response) {
        super(response);
        this.data = new PriceNotification(response.data);
    }
}
