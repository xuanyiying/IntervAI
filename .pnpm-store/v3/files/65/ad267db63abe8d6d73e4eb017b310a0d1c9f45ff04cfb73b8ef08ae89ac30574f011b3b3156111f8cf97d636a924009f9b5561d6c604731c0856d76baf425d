import { type CatalogType, type Status, type TaxCategory } from '../../../enums/index.js';
import { type CustomData } from '../../../entities/index.js';
import { ImportMetaNotification } from '../shared/index.js';
import { type ISharedProductNotificationResponse } from '../../types/index.js';
export declare class ProductNotification {
    readonly id: string;
    readonly name: string;
    readonly type: CatalogType | null;
    readonly description: string | null;
    readonly taxCategory: TaxCategory;
    readonly imageUrl: string | null;
    readonly customData: CustomData | null;
    readonly status: Status;
    readonly createdAt: string;
    readonly updatedAt: string | null;
    readonly importMeta: ImportMetaNotification | null;
    constructor(product: ISharedProductNotificationResponse);
}
