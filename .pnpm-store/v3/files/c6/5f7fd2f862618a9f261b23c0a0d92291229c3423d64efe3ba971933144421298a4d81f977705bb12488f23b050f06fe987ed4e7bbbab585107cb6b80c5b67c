import { type CatalogType, type Status, type TaxMode } from '../../../enums/index.js';
import { ImportMetaNotification, MoneyNotification, TimePeriodNotification, UnitPriceOverrideNotification } from '../shared/index.js';
import { PriceQuantityNotification } from './price-quantity-notification.js';
import { type ICustomData } from '../../../types/index.js';
import { type IPriceNotificationResponse } from '../../types/index.js';
export declare class PriceNotification {
    readonly id: string;
    readonly productId: string;
    readonly description: string;
    readonly name: string | null;
    readonly type: CatalogType | null;
    readonly billingCycle: TimePeriodNotification | null;
    readonly trialPeriod: TimePeriodNotification | null;
    readonly taxMode: TaxMode;
    readonly unitPrice: MoneyNotification;
    readonly unitPriceOverrides: UnitPriceOverrideNotification[];
    readonly quantity: PriceQuantityNotification;
    readonly status: Status;
    readonly createdAt: string | null;
    readonly updatedAt: string | null;
    readonly customData: ICustomData | null;
    readonly importMeta: ImportMetaNotification | null;
    constructor(price: IPriceNotificationResponse);
}
