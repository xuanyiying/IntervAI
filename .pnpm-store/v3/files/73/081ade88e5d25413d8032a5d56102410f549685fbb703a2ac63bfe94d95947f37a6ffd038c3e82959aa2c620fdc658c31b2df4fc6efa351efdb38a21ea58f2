"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BusinessNotification = void 0;
const contacts_notification_js_1 = require("./contacts-notification.js");
const index_js_1 = require("../shared/index.js");
class BusinessNotification {
    id;
    customerId;
    name;
    companyNumber;
    taxIdentifier;
    status;
    contacts;
    createdAt;
    updatedAt;
    customData;
    importMeta;
    constructor(business) {
        this.id = business.id;
        this.customerId = business.customer_id ?? null;
        this.name = business.name;
        this.companyNumber = business.company_number ? business.company_number : null;
        this.taxIdentifier = business.tax_identifier ? business.tax_identifier : null;
        this.status = business.status;
        this.contacts = business.contacts ? business.contacts.map((contact) => new contacts_notification_js_1.ContactsNotification(contact)) : null;
        this.createdAt = business.created_at;
        this.updatedAt = business.updated_at;
        this.customData = business.custom_data ? business.custom_data : null;
        this.importMeta = business.import_meta ? new index_js_1.ImportMetaNotification(business.import_meta) : null;
    }
}
exports.BusinessNotification = BusinessNotification;
