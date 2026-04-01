import { Event } from '../../../entities/events/event.js';
import { EventName } from '../../helpers/index.js';
import { TransactionNotification } from '../../entities/index.js';
import { type IEventsResponse } from '../../../types/index.js';
import { type ITransactionNotificationResponse } from '../../types/index.js';
export declare class TransactionPaidEvent extends Event {
    readonly eventType = EventName.TransactionPaid;
    readonly data: TransactionNotification;
    constructor(response: IEventsResponse<ITransactionNotificationResponse>);
}
