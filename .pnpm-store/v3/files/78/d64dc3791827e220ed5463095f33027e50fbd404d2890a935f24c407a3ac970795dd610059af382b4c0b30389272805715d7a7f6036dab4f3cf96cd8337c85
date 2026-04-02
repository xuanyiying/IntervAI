import { SubscriptionTimePeriod } from './subscription-time-period.js';
import { Price } from '../price/index.js';
import { Product } from '../product/index.js';
export class SubscriptionItem {
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
        this.trialDates = subscriptionItem.trial_dates ? new SubscriptionTimePeriod(subscriptionItem.trial_dates) : null;
        this.price = new Price(subscriptionItem.price);
        this.product = new Product(subscriptionItem.product);
    }
}
