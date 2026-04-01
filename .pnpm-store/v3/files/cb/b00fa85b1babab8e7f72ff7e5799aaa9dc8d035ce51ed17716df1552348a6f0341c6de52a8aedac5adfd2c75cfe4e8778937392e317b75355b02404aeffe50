import { type SubscriptionItemStatus } from '../../enums/index.js';
import { SubscriptionTimePeriod } from './subscription-time-period.js';
import { Price } from '../price/index.js';
import { type ISubscriptionItemResponse } from '../../types/index.js';
import { Product } from '../product/index.js';
export declare class SubscriptionItem {
    readonly status: SubscriptionItemStatus;
    readonly quantity: number;
    readonly recurring: boolean;
    readonly createdAt: string;
    readonly updatedAt: string;
    readonly previouslyBilledAt: string | null;
    readonly nextBilledAt: string | null;
    readonly trialDates: SubscriptionTimePeriod | null;
    readonly price: Price;
    readonly product: Product;
    constructor(subscriptionItem: ISubscriptionItemResponse);
}
