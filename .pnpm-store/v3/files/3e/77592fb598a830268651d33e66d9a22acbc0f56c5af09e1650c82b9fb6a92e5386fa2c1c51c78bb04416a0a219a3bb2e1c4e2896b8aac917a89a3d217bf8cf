import { SubscriptionCancellationEntities } from './subscription-cancellation-entities.js';
import { SubscriptionCancellationOptions } from './subscription-cancellation-options.js';
export class SubscriptionCancellationDetails {
    entities;
    options;
    constructor(config) {
        this.entities = config.entities ? new SubscriptionCancellationEntities(config.entities) : null;
        this.options = config.options ? new SubscriptionCancellationOptions(config.options) : null;
    }
}
