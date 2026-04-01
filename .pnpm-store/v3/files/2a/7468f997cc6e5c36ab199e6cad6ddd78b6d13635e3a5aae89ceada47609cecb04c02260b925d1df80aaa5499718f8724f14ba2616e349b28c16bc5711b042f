import { Event } from '../../../entities/events/event.js';
import { EventName } from '../../helpers/index.js';
import { TransactionNotification } from '../../entities/index.js';
export class TransactionPaidEvent extends Event {
    eventType = EventName.TransactionPaid;
    data;
    constructor(response) {
        super(response);
        this.data = new TransactionNotification(response.data);
    }
}
