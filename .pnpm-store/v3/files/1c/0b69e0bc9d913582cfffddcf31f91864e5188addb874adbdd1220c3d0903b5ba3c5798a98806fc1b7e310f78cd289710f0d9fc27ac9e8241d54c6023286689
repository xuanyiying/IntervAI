import { type CurrencyCode, type DiscountMode, type DiscountStatus, type DiscountType } from '../../../enums/index.js';
import { type CustomData } from '../../../entities/index.js';
import { ImportMetaNotification } from '../shared/index.js';
import { type IDiscountNotificationResponse } from '../../types/index.js';
export declare class DiscountNotification {
    readonly id: string;
    readonly status: DiscountStatus;
    readonly description: string;
    readonly enabledForCheckout: boolean;
    readonly code: string | null;
    readonly mode: DiscountMode | null;
    readonly type: DiscountType;
    readonly amount: string;
    readonly currencyCode: CurrencyCode | null;
    readonly recur: boolean;
    readonly maximumRecurringIntervals: number | null;
    readonly usageLimit: number | null;
    readonly restrictTo: string[] | null;
    readonly expiresAt: string | null;
    readonly customData: CustomData | null;
    readonly timesUsed: number | null;
    readonly createdAt: string;
    readonly updatedAt: string;
    readonly importMeta: ImportMetaNotification | null;
    readonly discountGroupId: string | null;
    constructor(discount: IDiscountNotificationResponse);
}
