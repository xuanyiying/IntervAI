import { EventType } from '../event-types/index.js';
export class NotificationSettings {
    id;
    description;
    type;
    destination;
    active;
    apiVersion;
    includeSensitiveFields;
    trafficSource;
    subscribedEvents;
    endpointSecretKey;
    constructor(notificationSettings) {
        this.id = notificationSettings.id;
        this.description = notificationSettings.description;
        this.type = notificationSettings.type;
        this.destination = notificationSettings.destination;
        this.active = notificationSettings.active;
        this.apiVersion = notificationSettings.api_version;
        this.includeSensitiveFields = notificationSettings.include_sensitive_fields;
        this.trafficSource = notificationSettings.traffic_source;
        this.subscribedEvents = notificationSettings.subscribed_events.map((subscribed_event) => new EventType(subscribed_event));
        this.endpointSecretKey = notificationSettings.endpoint_secret_key;
    }
}
