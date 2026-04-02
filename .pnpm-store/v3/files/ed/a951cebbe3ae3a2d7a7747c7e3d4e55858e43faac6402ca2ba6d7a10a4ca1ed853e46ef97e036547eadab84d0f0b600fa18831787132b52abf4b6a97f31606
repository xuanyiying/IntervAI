import { General } from './general.js';
import { CustomerPortalSubscriptionUrl } from './customer-portal-subscription-url.js';
export class Urls {
    general;
    subscriptions;
    constructor(urlsResponse) {
        this.general = new General(urlsResponse.general);
        this.subscriptions =
            urlsResponse.subscriptions?.map((subscription) => new CustomerPortalSubscriptionUrl(subscription)) ?? [];
    }
}
