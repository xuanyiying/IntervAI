import { BaseResource } from '../../internal/base/index.js';
import { type ListNotificationLogQueryParameters, type ListNotificationQueryParameters } from './operations/index.js';
import { Notification, NotificationCollection, NotificationLogCollection, ReplayNotification } from '../../entities/index.js';
export * from './operations/index.js';
export declare class NotificationsResource extends BaseResource {
    list(queryParams?: ListNotificationQueryParameters): NotificationCollection;
    get(notificationId: string): Promise<Notification>;
    replay(notificationId: string): Promise<ReplayNotification>;
    getLogs(notificationId: string, queryParams?: ListNotificationLogQueryParameters): NotificationLogCollection;
}
