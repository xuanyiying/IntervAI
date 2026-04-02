import { SubscriptionTimePeriodNotification } from './subscription-time-period-notification.js';
import { SubscriptionPriceNotification } from './subscription-price-notification.js';
import { ProductNotification } from '../product/index.js';
export class SubscriptionItemNotification {
    status;
    quantity;
    recurring;
    createdAt;
    updatedAt;
    previouslyBilledAt;
    nextBilledAt;
    trialDates;
    price;
    product;
    constructor(subscriptionItem) {
        this.status = subscriptionItem.status;
        this.quantity = subscriptionItem.quantity;
        this.recurring = subscriptionItem.recurring;
        this.createdAt = subscriptionItem.created_at;
        this.updatedAt = subscriptionItem.updated_at;
        this.previouslyBilledAt = subscriptionItem.previously_billed_at ? subscriptionItem.previously_billed_at : null;
        this.nextBilledAt = subscriptionItem.next_billed_at ? subscriptionItem.next_billed_at : null;
        this.trialDates = subscriptionItem.trial_dates
            ? new SubscriptionTimePeriodNotification(subscriptionItem.trial_dates)
            : null;
        this.price = subscriptionItem.price ? new SubscriptionPriceNotification(subscriptionItem.price) : null;
        this.product = subscriptionItem.product ? new ProductNotification(subscriptionItem.product) : null;
    }
}
