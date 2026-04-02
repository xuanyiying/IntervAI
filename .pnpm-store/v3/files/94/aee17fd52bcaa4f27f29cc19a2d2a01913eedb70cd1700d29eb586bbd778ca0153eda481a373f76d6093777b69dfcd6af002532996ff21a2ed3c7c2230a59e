import { Urls } from './urls.js';
export class CustomerPortalSession {
    id;
    customerId;
    urls;
    createdAt;
    constructor(customerPortalSessionResponse) {
        this.id = customerPortalSessionResponse.id;
        this.customerId = customerPortalSessionResponse.customer_id;
        this.urls = new Urls(customerPortalSessionResponse.urls);
        this.createdAt = customerPortalSessionResponse.created_at;
    }
}
