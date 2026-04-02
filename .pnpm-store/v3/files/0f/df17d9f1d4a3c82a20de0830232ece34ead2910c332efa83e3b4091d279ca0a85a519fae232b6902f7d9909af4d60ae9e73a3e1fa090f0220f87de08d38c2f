import { ImportMeta } from '../index.js';
export class Customer {
    id;
    name;
    email;
    marketingConsent;
    status;
    customData;
    locale;
    createdAt;
    updatedAt;
    importMeta;
    constructor(customer) {
        this.id = customer.id;
        this.name = customer.name ? customer.name : null;
        this.email = customer.email;
        this.marketingConsent = customer.marketing_consent;
        this.status = customer.status;
        this.customData = customer.custom_data ? customer.custom_data : null;
        this.locale = customer.locale;
        this.createdAt = customer.created_at;
        this.updatedAt = customer.updated_at;
        this.importMeta = customer.import_meta ? new ImportMeta(customer.import_meta) : null;
    }
}
