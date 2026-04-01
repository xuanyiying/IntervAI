import { type SubscriptionItemStatus } from '../../../enums/index.js';
import { SubscriptionTimePeriodNotification } from './subscription-time-period-notification.js';
import { SubscriptionPriceNotification } from './subscription-price-notification.js';
import { type ISubscriptionItemNotificationResponse } from '../../types/index.js';
import { ProductNotification } from '../product/index.js';
export declare class SubscriptionItemNotification {
    readonly status: SubscriptionItemStatus;
    readonly quantity: number;
    readonly recurring: boolean;
    readonly createdAt: string;
    readonly updatedAt: string;
    readonly previouslyBilledAt: string | null;
    readonly nextBilledAt: string | null;
    readonly trialDates: SubscriptionTimePeriodNotification | null;
    readonly price: SubscriptionPriceNotification | null;
    readonly product: ProductNotification | null;
    constructor(subscriptionItem: ISubscriptionItemNotificationResponse);
}
