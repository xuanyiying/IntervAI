"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationSettings = void 0;
const index_js_1 = require("../event-types/index.js");
class NotificationSettings {
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
        this.subscribedEvents = notificationSettings.subscribed_events.map((subscribed_event) => new index_js_1.EventType(subscribed_event));
        this.endpointSecretKey = notificationSettings.endpoint_secret_key;
    }
}
exports.NotificationSettings = NotificationSettings;
