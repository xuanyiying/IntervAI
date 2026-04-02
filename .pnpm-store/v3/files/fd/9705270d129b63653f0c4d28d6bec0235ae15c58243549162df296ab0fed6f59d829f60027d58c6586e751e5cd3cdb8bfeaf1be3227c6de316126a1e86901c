import { EventName } from '../../helpers/index.js';
import { Event } from '../../../entities/events/event.js';
import { AddressNotification } from '../../entities/index.js';
export class AddressCreatedEvent extends Event {
    eventType = EventName.AddressCreated;
    data;
    constructor(response) {
        super(response);
        this.data = new AddressNotification(response.data);
    }
}
