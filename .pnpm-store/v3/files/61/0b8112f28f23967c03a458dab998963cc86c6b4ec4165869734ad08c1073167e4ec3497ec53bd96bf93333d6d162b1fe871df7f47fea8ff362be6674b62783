import { Event } from '../../../entities/events/event.js';
import { EventName } from '../../helpers/index.js';
import { PayoutNotification } from '../../entities/index.js';
export class PayoutCreatedEvent extends Event {
    eventType = EventName.PayoutCreated;
    data;
    constructor(response) {
        super(response);
        this.data = new PayoutNotification(response.data);
    }
}
