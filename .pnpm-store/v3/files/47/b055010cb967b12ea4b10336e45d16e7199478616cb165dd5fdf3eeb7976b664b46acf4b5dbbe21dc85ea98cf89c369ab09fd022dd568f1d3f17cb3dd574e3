import { Event } from '../../../entities/events/event.js';
import { EventName } from '../../helpers/index.js';
import { BusinessNotification } from '../../entities/index.js';
export class BusinessCreatedEvent extends Event {
    eventType = EventName.BusinessCreated;
    data;
    constructor(response) {
        super(response);
        this.data = new BusinessNotification(response.data);
    }
}
