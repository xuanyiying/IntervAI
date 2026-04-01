import { type CountryCode, type Status } from '../../../enums/index.js';
import { type CustomData, ImportMeta } from '../../../entities/index.js';
import { type IAddressNotificationResponse } from '../../types/index.js';
export declare class AddressNotification {
    readonly id: string;
    readonly customerId: string | null;
    readonly description: string | null;
    readonly firstLine: string | null;
    readonly secondLine: string | null;
    readonly city: string | null;
    readonly postalCode: string | null;
    readonly region: string | null;
    readonly countryCode: CountryCode;
    readonly customData: CustomData | null;
    readonly status: Status;
    readonly createdAt: string;
    readonly updatedAt: string;
    readonly importMeta: ImportMeta | null;
    constructor(address: IAddressNotificationResponse);
}
