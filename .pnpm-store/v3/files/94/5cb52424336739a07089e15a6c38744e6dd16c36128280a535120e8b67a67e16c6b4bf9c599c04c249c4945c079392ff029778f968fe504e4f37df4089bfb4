import { SubscriptionResumeEntities } from './subscription-resume-entities.js';
import { SubscriptionResumeOptions } from './subscription-resume-options.js';
export class SubscriptionResumeDetails {
    entities;
    options;
    constructor(config) {
        this.entities = config.entities ? new SubscriptionResumeEntities(config.entities) : null;
        this.options = config.options ? new SubscriptionResumeOptions(config.options) : null;
    }
}
