import type { useNotificationType, XNotificationOpenArgs } from './interface';
declare class XNotification {
    private static permissionMap;
    static permissible: boolean;
    constructor();
    get permission(): NotificationPermission;
    open(arg: XNotificationOpenArgs): void;
    requestPermission(): Promise<NotificationPermission>;
    private _requestPermission;
    useNotification(): useNotificationType;
    close(tags?: string[]): void;
}
export type { XNotificationOpenArgs };
declare const _default: XNotification;
export default _default;
export { XNotification };
