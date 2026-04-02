import { BaseResource } from '../../internal/base/index.js';
import { NotificationSettings } from '../../entities/index.js';
import { type CreateNotificationSettingsRequestBody, type ListNotificationSettingsQueryParameters, type UpdateNotificationSettingsRequestBody } from './operations/index.js';
export * from './operations/index.js';
export declare class NotificationSettingsResource extends BaseResource {
    list(queryParams?: ListNotificationSettingsQueryParameters): Promise<NotificationSettings[]>;
    create(createNotificationSettings: CreateNotificationSettingsRequestBody): Promise<NotificationSettings>;
    get(notificationId: string): Promise<NotificationSettings>;
    update(notificationId: string, updateNotificationSettings: UpdateNotificationSettingsRequestBody): Promise<NotificationSettings>;
    delete(notificationId: string): Promise<undefined>;
}
