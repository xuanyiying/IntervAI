import { Event } from '../../../entities/events/event.js';
import { EventName } from '../../helpers/index.js';
import { CustomerNotification } from '../../entities/index.js';
export class CustomerCreatedEvent extends Event {
    eventType = EventName.CustomerCreated;
    data;
    constructor(response) {
        super(response);
        this.data = new CustomerNotification(response.data);
    }
}
