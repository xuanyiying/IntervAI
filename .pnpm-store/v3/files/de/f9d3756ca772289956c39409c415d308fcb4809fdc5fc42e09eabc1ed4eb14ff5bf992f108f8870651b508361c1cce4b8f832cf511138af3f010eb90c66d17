export class Event {
    eventId;
    notificationId;
    eventType;
    occurredAt;
    data;
    constructor(eventData) {
        this.eventId = eventData.event_id;
        this.notificationId = eventData.notification_id ?? null;
        this.eventType = eventData.event_type;
        this.occurredAt = eventData.occurred_at;
        this.data = eventData.data;
    }
}
