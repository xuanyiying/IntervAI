"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationLog = void 0;
class NotificationLog {
    id;
    responseCode;
    responseContentType;
    responseBody;
    attemptedAt;
    constructor(notificationLogResponse) {
        this.id = notificationLogResponse.id;
        this.responseCode = notificationLogResponse.response_code;
        this.responseContentType = notificationLogResponse.response_content_type ?? null;
        this.responseBody = notificationLogResponse.response_body;
        this.attemptedAt = notificationLogResponse.attempted_at;
    }
}
exports.NotificationLog = NotificationLog;
