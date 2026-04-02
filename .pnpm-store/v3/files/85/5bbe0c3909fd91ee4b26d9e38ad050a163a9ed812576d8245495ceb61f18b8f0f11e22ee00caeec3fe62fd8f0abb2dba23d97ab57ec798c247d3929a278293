"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimulationScenarioConfig = void 0;
const subscription_cancellation_details_js_1 = require("./subscription-cancellation-details.js");
const subscription_creation_details_js_1 = require("./subscription-creation-details.js");
const subscription_pause_details_js_1 = require("./subscription-pause-details.js");
const subscription_renewal_details_js_1 = require("./subscription-renewal-details.js");
const subscription_resume_details_js_1 = require("./subscription-resume-details.js");
class SimulationScenarioConfig {
    subscriptionCancellation;
    subscriptionCreation;
    subscriptionPause;
    subscriptionRenewal;
    subscriptionResume;
    constructor(response) {
        this.subscriptionCancellation = response.subscription_cancellation
            ? new subscription_cancellation_details_js_1.SubscriptionCancellationDetails(response.subscription_cancellation)
            : null;
        this.subscriptionCreation = response.subscription_creation
            ? new subscription_creation_details_js_1.SubscriptionCreationDetails(response.subscription_creation)
            : null;
        this.subscriptionPause = response.subscription_pause
            ? new subscription_pause_details_js_1.SubscriptionPauseDetails(response.subscription_pause)
            : null;
        this.subscriptionRenewal = response.subscription_renewal
            ? new subscription_renewal_details_js_1.SubscriptionRenewalDetails(response.subscription_renewal)
            : null;
        this.subscriptionResume = response.subscription_resume
            ? new subscription_resume_details_js_1.SubscriptionResumeDetails(response.subscription_resume)
            : null;
    }
}
exports.SimulationScenarioConfig = SimulationScenarioConfig;
