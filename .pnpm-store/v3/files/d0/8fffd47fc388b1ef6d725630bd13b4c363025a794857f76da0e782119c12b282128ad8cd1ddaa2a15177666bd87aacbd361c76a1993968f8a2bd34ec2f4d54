import { BaseResource, PathParameters, QueryParameters } from '../../internal/base/index.js';
import { Notification, NotificationCollection, NotificationLogCollection, ReplayNotification, } from '../../entities/index.js';
const NotificationPaths = {
    list: '/notifications',
    get: '/notifications/{notification_id}',
    getLogs: '/notifications/{notification_id}/logs',
    replay: '/notifications/{notification_id}/replay',
};
export * from './operations/index.js';
export class NotificationsResource extends BaseResource {
    list(queryParams) {
        const queryParameters = new QueryParameters(queryParams);
        return new NotificationCollection(this.client, NotificationPaths.list + queryParameters.toQueryString());
    }
    async get(notificationId) {
        const urlWithPathParams = new PathParameters(NotificationPaths.get, {
            notification_id: notificationId,
        }).deriveUrl();
        const response = await this.client.get(urlWithPathParams);
        const data = this.handleResponse(response);
        return new Notification(data);
    }
    async replay(notificationId) {
        const urlWithPathParams = new PathParameters(NotificationPaths.replay, {
            notification_id: notificationId,
        }).deriveUrl();
        const response = await this.client.post(urlWithPathParams, undefined);
        const data = this.handleResponse(response);
        return new ReplayNotification(data);
    }
    getLogs(notificationId, queryParams) {
        const queryParameters = new QueryParameters(queryParams);
        const urlWithPathParams = new PathParameters(NotificationPaths.getLogs, {
            notification_id: notificationId,
        }).deriveUrl();
        return new NotificationLogCollection(this.client, urlWithPathParams + queryParameters.toQueryString());
    }
}
