import { type CatalogType, type Status, type TaxCategory } from '../../enums/index.js';
import { type CustomData, ImportMeta, Price } from '../index.js';
import { type IProductResponse } from '../../types/index.js';
export declare class Product {
    readonly id: string;
    readonly name: string;
    readonly type: CatalogType | null;
    readonly description: string | null;
    readonly taxCategory: TaxCategory;
    readonly imageUrl: string | null;
    readonly customData: CustomData | null;
    readonly status: Status;
    readonly createdAt: string;
    readonly updatedAt: string;
    readonly importMeta: ImportMeta | null;
    readonly prices: Price[] | null;
    constructor(product: IProductResponse);
}
