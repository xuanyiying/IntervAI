import { Webhooks } from '../../notifications/index.js';
export class Notification {
    id;
    type;
    status;
    payload;
    occurredAt;
    deliveredAt;
    replayedAt;
    origin;
    lastAttemptAt;
    retryAt;
    timesAttempted;
    notificationSettingId;
    constructor(notificationResponse) {
        this.id = notificationResponse.id;
        this.type = notificationResponse.type;
        this.status = notificationResponse.status;
        this.payload = Webhooks.fromJson(notificationResponse.payload);
        this.occurredAt = notificationResponse.occurred_at;
        this.deliveredAt = notificationResponse.delivered_at ?? null;
        this.replayedAt = notificationResponse.replayed_at ?? null;
        this.origin = notificationResponse.origin;
        this.lastAttemptAt = notificationResponse.last_attempt_at ?? null;
        this.retryAt = notificationResponse.retry_at ?? null;
        this.timesAttempted = notificationResponse.times_attempted;
        this.notificationSettingId = notificationResponse.notification_setting_id;
    }
}
