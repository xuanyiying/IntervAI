import { Event } from '../../../entities/events/event.js';
import { EventName } from '../../helpers/index.js';
import { TransactionNotification } from '../../entities/index.js';
export class TransactionCreatedEvent extends Event {
    eventType = EventName.TransactionCreated;
    data;
    constructor(response) {
        super(response);
        this.data = new TransactionNotification(response.data);
    }
}
