import { Event } from '../../../entities/events/event.js';
import { EventName } from '../../helpers/index.js';
import { AddressNotification } from '../../entities/index.js';
export class AddressUpdatedEvent extends Event {
    eventType = EventName.AddressUpdated;
    data;
    constructor(response) {
        super(response);
        this.data = new AddressNotification(response.data);
    }
}
