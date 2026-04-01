"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Urls = void 0;
const general_js_1 = require("./general.js");
const customer_portal_subscription_url_js_1 = require("./customer-portal-subscription-url.js");
class Urls {
    general;
    subscriptions;
    constructor(urlsResponse) {
        this.general = new general_js_1.General(urlsResponse.general);
        this.subscriptions =
            urlsResponse.subscriptions?.map((subscription) => new customer_portal_subscription_url_js_1.CustomerPortalSubscriptionUrl(subscription)) ?? [];
    }
}
exports.Urls = Urls;
