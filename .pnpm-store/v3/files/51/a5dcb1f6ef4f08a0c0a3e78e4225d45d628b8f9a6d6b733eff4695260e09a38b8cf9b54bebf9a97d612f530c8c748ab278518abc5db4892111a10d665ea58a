import { BaseResource, PathParameters, QueryParameters } from '../../internal/base/index.js';
import { NotificationSettings } from '../../entities/index.js';
const NotificationSettingsPaths = {
    list: '/notification-settings',
    create: '/notification-settings',
    get: '/notification-settings/{notification_setting_id}',
    update: '/notification-settings/{notification_setting_id}',
    delete: '/notification-settings/{notification_setting_id}',
};
export * from './operations/index.js';
export class NotificationSettingsResource extends BaseResource {
    async list(queryParams) {
        const queryParameters = new QueryParameters(queryParams);
        const response = await this.client.get(NotificationSettingsPaths.list + queryParameters.toQueryString());
        const data = this.handleResponse(response);
        return data.map((notificationSetting) => new NotificationSettings(notificationSetting));
    }
    async create(createNotificationSettings) {
        const response = await this.client.post(NotificationSettingsPaths.create, createNotificationSettings);
        const data = this.handleResponse(response);
        return new NotificationSettings(data);
    }
    async get(notificationId) {
        const urlWithPathParams = new PathParameters(NotificationSettingsPaths.get, {
            notification_setting_id: notificationId,
        }).deriveUrl();
        const response = await this.client.get(urlWithPathParams);
        const data = this.handleResponse(response);
        return new NotificationSettings(data);
    }
    async update(notificationId, updateNotificationSettings) {
        const urlWithPathParams = new PathParameters(NotificationSettingsPaths.update, {
            notification_setting_id: notificationId,
        }).deriveUrl();
        const response = await this.client.patch(urlWithPathParams, updateNotificationSettings);
        const data = this.handleResponse(response);
        return new NotificationSettings(data);
    }
    async delete(notificationId) {
        const urlWithPathParams = new PathParameters(NotificationSettingsPaths.update, {
            notification_setting_id: notificationId,
        }).deriveUrl();
        const response = await this.client.delete(urlWithPathParams);
        if (response) {
            this.handleResponse(response);
        }
    }
}
