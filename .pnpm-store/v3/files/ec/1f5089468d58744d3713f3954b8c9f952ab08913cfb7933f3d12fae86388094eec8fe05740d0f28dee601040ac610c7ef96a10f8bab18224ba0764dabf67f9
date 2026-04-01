import { Event } from '../../../entities/events/event.js';
import { EventName } from '../../helpers/index.js';
import { AdjustmentNotification } from '../../entities/index.js';
export class AdjustmentCreatedEvent extends Event {
    eventType = EventName.AdjustmentCreated;
    data;
    constructor(response) {
        super(response);
        this.data = new AdjustmentNotification(response.data);
    }
}
