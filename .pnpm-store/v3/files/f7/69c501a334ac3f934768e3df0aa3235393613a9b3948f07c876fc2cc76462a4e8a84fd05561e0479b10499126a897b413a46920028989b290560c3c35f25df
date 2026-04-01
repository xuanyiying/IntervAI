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
exports.NotificationSettingsResource = void 0;
const index_js_1 = require("../../internal/base/index.js");
const index_js_2 = require("../../entities/index.js");
const NotificationSettingsPaths = {
    list: '/notification-settings',
    create: '/notification-settings',
    get: '/notification-settings/{notification_setting_id}',
    update: '/notification-settings/{notification_setting_id}',
    delete: '/notification-settings/{notification_setting_id}',
};
__exportStar(require("./operations/index.js"), exports);
class NotificationSettingsResource extends index_js_1.BaseResource {
    async list(queryParams) {
        const queryParameters = new index_js_1.QueryParameters(queryParams);
        const response = await this.client.get(NotificationSettingsPaths.list + queryParameters.toQueryString());
        const data = this.handleResponse(response);
        return data.map((notificationSetting) => new index_js_2.NotificationSettings(notificationSetting));
    }
    async create(createNotificationSettings) {
        const response = await this.client.post(NotificationSettingsPaths.create, createNotificationSettings);
        const data = this.handleResponse(response);
        return new index_js_2.NotificationSettings(data);
    }
    async get(notificationId) {
        const urlWithPathParams = new index_js_1.PathParameters(NotificationSettingsPaths.get, {
            notification_setting_id: notificationId,
        }).deriveUrl();
        const response = await this.client.get(urlWithPathParams);
        const data = this.handleResponse(response);
        return new index_js_2.NotificationSettings(data);
    }
    async update(notificationId, updateNotificationSettings) {
        const urlWithPathParams = new index_js_1.PathParameters(NotificationSettingsPaths.update, {
            notification_setting_id: notificationId,
        }).deriveUrl();
        const response = await this.client.patch(urlWithPathParams, updateNotificationSettings);
        const data = this.handleResponse(response);
        return new index_js_2.NotificationSettings(data);
    }
    async delete(notificationId) {
        const urlWithPathParams = new index_js_1.PathParameters(NotificationSettingsPaths.update, {
            notification_setting_id: notificationId,
        }).deriveUrl();
        const response = await this.client.delete(urlWithPathParams);
        if (response) {
            this.handleResponse(response);
        }
    }
}
exports.NotificationSettingsResource = NotificationSettingsResource;
