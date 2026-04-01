import { Event } from '../../../entities/events/event.js';
import { PaymentMethodDeletedNotification } from '../../entities/index.js';
import { EventName } from '../../helpers/index.js';
import { type IEventsResponse } from '../../../types/index.js';
import { type IPaymentMethodDeletedNotificationResponse } from '../../types/index.js';
export declare class PaymentMethodDeletedEvent extends Event {
    readonly eventType = EventName.PaymentMethodDeleted;
    readonly data: PaymentMethodDeletedNotification;
    constructor(response: IEventsResponse<IPaymentMethodDeletedNotificationResponse>);
}
