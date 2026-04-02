"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionCreationDetails = void 0;
const subscription_creation_entities_js_1 = require("./subscription-creation-entities.js");
const subscription_creation_options_js_1 = require("./subscription-creation-options.js");
class SubscriptionCreationDetails {
    entities;
    options;
    constructor(config) {
        this.entities = config.entities ? new subscription_creation_entities_js_1.SubscriptionCreationEntities(config.entities) : null;
        this.options = config.options ? new subscription_creation_options_js_1.SubscriptionCreationOptions(config.options) : null;
    }
}
exports.SubscriptionCreationDetails = SubscriptionCreationDetails;
