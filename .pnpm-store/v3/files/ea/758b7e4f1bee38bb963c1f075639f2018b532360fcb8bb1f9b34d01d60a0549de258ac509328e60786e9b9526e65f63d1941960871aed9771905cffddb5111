import { type EventEntity, type IEventName } from '../../notifications/index.js';
import { type NotificationStatus, type Origin } from '../../enums/index.js';
import { type INotificationResponse } from '../../types/index.js';
export declare class Notification {
    readonly id: string;
    readonly type: IEventName;
    readonly status: NotificationStatus;
    readonly payload: EventEntity;
    readonly occurredAt: string;
    readonly deliveredAt: null | string;
    readonly replayedAt: null | string;
    readonly origin: Origin;
    readonly lastAttemptAt: null | string;
    readonly retryAt: null | string;
    readonly timesAttempted: number;
    readonly notificationSettingId: string;
    constructor(notificationResponse: INotificationResponse);
}
