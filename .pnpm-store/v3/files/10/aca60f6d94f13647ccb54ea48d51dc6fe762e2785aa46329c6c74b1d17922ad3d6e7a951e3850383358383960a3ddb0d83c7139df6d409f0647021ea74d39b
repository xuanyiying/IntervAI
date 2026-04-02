"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerPortalSession = void 0;
const urls_js_1 = require("./urls.js");
class CustomerPortalSession {
    id;
    customerId;
    urls;
    createdAt;
    constructor(customerPortalSessionResponse) {
        this.id = customerPortalSessionResponse.id;
        this.customerId = customerPortalSessionResponse.customer_id;
        this.urls = new urls_js_1.Urls(customerPortalSessionResponse.urls);
        this.createdAt = customerPortalSessionResponse.created_at;
    }
}
exports.CustomerPortalSession = CustomerPortalSession;
