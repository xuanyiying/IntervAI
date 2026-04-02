import { type Status } from '../../../enums/index.js';
import { ContactsNotification } from './contacts-notification.js';
import { type CustomData } from '../../../entities/index.js';
import { ImportMetaNotification } from '../shared/index.js';
import { type IBusinessNotificationResponse } from '../../types/index.js';
export declare class BusinessNotification {
    readonly id: string;
    readonly customerId: string | null;
    readonly name: string;
    readonly companyNumber: string | null;
    readonly taxIdentifier: string | null;
    readonly status: Status;
    readonly contacts: ContactsNotification[] | null;
    readonly createdAt: string;
    readonly updatedAt: string;
    readonly customData: CustomData | null;
    readonly importMeta: ImportMetaNotification | null;
    constructor(business: IBusinessNotificationResponse);
}
