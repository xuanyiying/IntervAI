import { type CatalogType, type Status, type TaxMode } from '../../enums/index.js';
import { ImportMeta, Money, TimePeriod, UnitPriceOverride } from '../shared/index.js';
import { PriceQuantity } from './price-quantity.js';
import { type ICustomData, type IPriceResponse } from '../../types/index.js';
import { Product } from '../product/index.js';
export declare class Price {
    readonly id: string;
    readonly productId: string;
    readonly description: string;
    readonly name: string | null;
    readonly type: CatalogType;
    readonly billingCycle: TimePeriod | null;
    readonly trialPeriod: TimePeriod | null;
    readonly taxMode: TaxMode;
    readonly unitPrice: Money;
    readonly unitPriceOverrides: UnitPriceOverride[];
    readonly quantity: PriceQuantity;
    readonly status: Status;
    readonly createdAt: string;
    readonly updatedAt: string;
    readonly customData: ICustomData | null;
    readonly importMeta: ImportMeta | null;
    readonly product: Product | null;
    constructor(price: IPriceResponse);
}
