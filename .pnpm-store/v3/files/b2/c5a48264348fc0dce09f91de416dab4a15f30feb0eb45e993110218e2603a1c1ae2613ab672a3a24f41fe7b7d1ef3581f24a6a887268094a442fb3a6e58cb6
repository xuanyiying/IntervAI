import { Event } from '../../../entities/events/event.js';
import { EventName } from '../../helpers/index.js';
import { PriceNotification } from '../../entities/index.js';
export class PriceUpdatedEvent extends Event {
    eventType = EventName.PriceUpdated;
    data;
    constructor(response) {
        super(response);
        this.data = new PriceNotification(response.data);
    }
}
