import { SubscriptionPauseEntities } from './subscription-pause-entities.js';
import { SubscriptionPauseOptions } from './subscription-pause-options.js';
export class SubscriptionPauseDetails {
    entities;
    options;
    constructor(config) {
        this.entities = config.entities ? new SubscriptionPauseEntities(config.entities) : null;
        this.options = config.options ? new SubscriptionPauseOptions(config.options) : null;
    }
}
