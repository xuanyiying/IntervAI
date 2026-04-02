import { Contacts } from './contacts.js';
import { ImportMeta } from '../index.js';
export class Business {
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
        this.contacts = business.contacts ? business.contacts.map((contact) => new Contacts(contact)) : null;
        this.createdAt = business.created_at;
        this.updatedAt = business.updated_at;
        this.customData = business.custom_data ? business.custom_data : null;
        this.importMeta = business.import_meta ? new ImportMeta(business.import_meta) : null;
    }
}
