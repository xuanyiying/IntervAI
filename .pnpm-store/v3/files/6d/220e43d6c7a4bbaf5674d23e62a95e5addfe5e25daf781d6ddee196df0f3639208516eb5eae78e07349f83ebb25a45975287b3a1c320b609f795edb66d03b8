import { Event } from '../../../entities/events/event.js';
import { EventName } from '../../helpers/index.js';
import { PayoutNotification } from '../../entities/index.js';
import { type IEventsResponse } from '../../../types/index.js';
import { type IPayoutNotificationResponse } from '../../types/index.js';
export declare class PayoutCreatedEvent extends Event {
    readonly eventType = EventName.PayoutCreated;
    readonly data: PayoutNotification;
    constructor(response: IEventsResponse<IPayoutNotificationResponse>);
}
