import { Event } from '../../../entities/events/event.js';
import { PaymentMethodNotification } from '../../entities/index.js';
import { EventName } from '../../helpers/index.js';
export class PaymentMethodSavedEvent extends Event {
    eventType = EventName.PaymentMethodSaved;
    data;
    constructor(response) {
        super(response);
        this.data = new PaymentMethodNotification(response.data);
    }
}
