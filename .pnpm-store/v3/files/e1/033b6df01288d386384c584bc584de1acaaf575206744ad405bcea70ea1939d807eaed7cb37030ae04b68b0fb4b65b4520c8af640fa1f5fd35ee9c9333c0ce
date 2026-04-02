"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsResource = void 0;
const index_js_1 = require("../../internal/base/index.js");
const index_js_2 = require("../../entities/index.js");
const NotificationPaths = {
    list: '/notifications',
    get: '/notifications/{notification_id}',
    getLogs: '/notifications/{notification_id}/logs',
    replay: '/notifications/{notification_id}/replay',
};
__exportStar(require("./operations/index.js"), exports);
class NotificationsResource extends index_js_1.BaseResource {
    list(queryParams) {
        const queryParameters = new index_js_1.QueryParameters(queryParams);
        return new index_js_2.NotificationCollection(this.client, NotificationPaths.list + queryParameters.toQueryString());
    }
    async get(notificationId) {
        const urlWithPathParams = new index_js_1.PathParameters(NotificationPaths.get, {
            notification_id: notificationId,
        }).deriveUrl();
        const response = await this.client.get(urlWithPathParams);
        const data = this.handleResponse(response);
        return new index_js_2.Notification(data);
    }
    async replay(notificationId) {
        const urlWithPathParams = new index_js_1.PathParameters(NotificationPaths.replay, {
            notification_id: notificationId,
        }).deriveUrl();
        const response = await this.client.post(urlWithPathParams, undefined);
        const data = this.handleResponse(response);
        return new index_js_2.ReplayNotification(data);
    }
    getLogs(notificationId, queryParams) {
        const queryParameters = new index_js_1.QueryParameters(queryParams);
        const urlWithPathParams = new index_js_1.PathParameters(NotificationPaths.getLogs, {
            notification_id: notificationId,
        }).deriveUrl();
        return new index_js_2.NotificationLogCollection(this.client, urlWithPathParams + queryParameters.toQueryString());
    }
}
exports.NotificationsResource = NotificationsResource;
