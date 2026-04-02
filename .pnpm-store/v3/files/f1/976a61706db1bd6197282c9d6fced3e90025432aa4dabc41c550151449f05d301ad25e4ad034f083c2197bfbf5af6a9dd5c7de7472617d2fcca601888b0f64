import { type CountryCode, type Status } from '../../enums/index.js';
import { type CustomData, ImportMeta } from '../index.js';
import { type IAddressResponse } from '../../types/index.js';
export declare class Address {
    readonly id: string;
    readonly customerId: string;
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
    constructor(address: IAddressResponse);
}
