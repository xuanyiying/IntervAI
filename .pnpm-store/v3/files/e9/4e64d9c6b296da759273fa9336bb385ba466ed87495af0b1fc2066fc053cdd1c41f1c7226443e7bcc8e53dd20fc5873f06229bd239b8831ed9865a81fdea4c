import { SubscriptionCreationEntities } from './subscription-creation-entities.js';
import { SubscriptionCreationOptions } from './subscription-creation-options.js';
export class SubscriptionCreationDetails {
    entities;
    options;
    constructor(config) {
        this.entities = config.entities ? new SubscriptionCreationEntities(config.entities) : null;
        this.options = config.options ? new SubscriptionCreationOptions(config.options) : null;
    }
}
