import { Event } from '../../../entities/events/event.js';
import { EventName } from '../../helpers/index.js';
import { PayoutNotification } from '../../entities/index.js';
export class PayoutPaidEvent extends Event {
    eventType = EventName.PayoutPaid;
    data;
    constructor(response) {
        super(response);
        this.data = new PayoutNotification(response.data);
    }
}
