import { Event } from '../../../entities/events/event.js';
import { PaymentMethodDeletedNotification } from '../../entities/index.js';
import { EventName } from '../../helpers/index.js';
export class PaymentMethodDeletedEvent extends Event {
    eventType = EventName.PaymentMethodDeleted;
    data;
    constructor(response) {
        super(response);
        this.data = new PaymentMethodDeletedNotification(response.data);
    }
}
