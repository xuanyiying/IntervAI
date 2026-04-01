import { Event } from '../../../entities/events/event.js';
import { EventName } from '../../helpers/index.js';
import { TransactionNotification } from '../../entities/index.js';
export class TransactionRevisedEvent extends Event {
    eventType = EventName.TransactionRevised;
    data;
    constructor(response) {
        super(response);
        this.data = new TransactionNotification(response.data);
    }
}
