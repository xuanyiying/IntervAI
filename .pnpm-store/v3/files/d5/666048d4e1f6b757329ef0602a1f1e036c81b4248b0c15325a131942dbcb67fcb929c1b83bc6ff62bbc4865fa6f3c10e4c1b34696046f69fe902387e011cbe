"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Business = void 0;
const contacts_js_1 = require("./contacts.js");
const index_js_1 = require("../index.js");
class Business {
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
        this.customerId = business.customer_id;
        this.name = business.name;
        this.companyNumber = business.company_number ? business.company_number : null;
        this.taxIdentifier = business.tax_identifier ? business.tax_identifier : null;
        this.status = business.status;
        this.contacts = business.contacts ? business.contacts.map((contact) => new contacts_js_1.Contacts(contact)) : null;
        this.createdAt = business.created_at;
        this.updatedAt = business.updated_at;
        this.customData = business.custom_data ? business.custom_data : null;
        this.importMeta = business.import_meta ? new index_js_1.ImportMeta(business.import_meta) : null;
    }
}
exports.Business = Business;
