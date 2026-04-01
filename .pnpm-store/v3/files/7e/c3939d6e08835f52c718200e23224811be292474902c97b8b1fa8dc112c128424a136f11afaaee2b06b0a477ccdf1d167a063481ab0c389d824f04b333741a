import { type CatalogType, type Status, type TaxMode } from '../../../enums/index.js';
import { ImportMetaNotification, MoneyNotification, TimePeriodNotification, UnitPriceOverrideNotification } from '../shared/index.js';
import { PriceQuantityNotification } from '../price/index.js';
import { type CustomData } from '../../../entities/index.js';
import { type ISubscriptionPriceNotificationResponse } from '../../types/index.js';
export declare class SubscriptionPriceNotification {
    readonly id: string;
    readonly productId: string;
    readonly description: string;
    readonly name: string | null;
    readonly type: CatalogType | null;
    readonly billingCycle: TimePeriodNotification | null;
    readonly trialPeriod: TimePeriodNotification | null;
    readonly taxMode: TaxMode;
    readonly unitPrice: MoneyNotification | null;
    readonly unitPriceOverrides: UnitPriceOverrideNotification[] | null;
    readonly quantity: PriceQuantityNotification | null;
    readonly status: Status | null;
    readonly customData: CustomData | null;
    readonly importMeta: ImportMetaNotification | null;
    constructor(price: ISubscriptionPriceNotificationResponse);
}
