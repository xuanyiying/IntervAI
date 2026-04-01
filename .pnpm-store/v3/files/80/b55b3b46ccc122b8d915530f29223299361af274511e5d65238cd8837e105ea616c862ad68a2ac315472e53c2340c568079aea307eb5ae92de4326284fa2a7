import { type Status } from '../../enums/index.js';
import { Contacts } from './contacts.js';
import { type CustomData, ImportMeta } from '../index.js';
import { type IBusinessResponse } from '../../types/index.js';
export declare class Business {
    readonly id: string;
    readonly customerId: string;
    readonly name: string;
    readonly companyNumber: string | null;
    readonly taxIdentifier: string | null;
    readonly status: Status;
    readonly contacts: Contacts[] | null;
    readonly createdAt: string;
    readonly updatedAt: string;
    readonly customData: CustomData | null;
    readonly importMeta: ImportMeta | null;
    constructor(business: IBusinessResponse);
}
