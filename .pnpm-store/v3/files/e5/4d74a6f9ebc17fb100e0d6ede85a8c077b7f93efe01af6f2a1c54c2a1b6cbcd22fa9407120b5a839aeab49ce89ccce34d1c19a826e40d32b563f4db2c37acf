import { type TrafficSource, type NotificationSettingsType } from '../../enums/index.js';
import { EventType } from '../event-types/index.js';
import { type INotificationSettingsResponse } from '../../types/index.js';
export declare class NotificationSettings {
    readonly id: string;
    readonly description: string;
    readonly type: NotificationSettingsType;
    readonly destination: string;
    readonly active: boolean;
    readonly apiVersion: number;
    readonly includeSensitiveFields: boolean;
    readonly trafficSource: TrafficSource;
    readonly subscribedEvents: EventType[];
    readonly endpointSecretKey: string;
    constructor(notificationSettings: INotificationSettingsResponse);
}
