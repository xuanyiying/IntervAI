import { type Status } from '../../../enums/index.js';
import { type CustomData } from '../../../entities/index.js';
import { ImportMetaNotification } from '../shared/index.js';
import { type ICustomerNotificationResponse } from '../../types/index.js';
export declare class CustomerNotification {
    readonly id: string;
    readonly name: string | null;
    readonly email: string;
    readonly marketingConsent: boolean;
    readonly status: Status;
    readonly customData: CustomData | null;
    readonly locale: string;
    readonly createdAt: string;
    readonly updatedAt: string;
    readonly importMeta: ImportMetaNotification | null;
    constructor(customer: ICustomerNotificationResponse);
}
