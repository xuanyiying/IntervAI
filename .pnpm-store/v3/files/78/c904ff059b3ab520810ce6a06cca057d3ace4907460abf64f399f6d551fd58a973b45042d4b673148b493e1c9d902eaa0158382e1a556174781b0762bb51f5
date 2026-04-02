import { Event } from '../../../entities/events/event.js';
import { PaymentMethodNotification } from '../../entities/index.js';
import { EventName } from '../../helpers/index.js';
import { type IEventsResponse } from '../../../types/index.js';
import { type IPaymentMethodNotificationResponse } from '../../types/index.js';
export declare class PaymentMethodSavedEvent extends Event {
    readonly eventType = EventName.PaymentMethodSaved;
    readonly data: PaymentMethodNotification;
    constructor(response: IEventsResponse<IPaymentMethodNotificationResponse>);
}
