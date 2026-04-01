import { ContactsNotification } from './contacts-notification.js';
import { ImportMetaNotification } from '../shared/index.js';
export class BusinessNotification {
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
        this.contacts = business.contacts ? business.contacts.map((contact) => new ContactsNotification(contact)) : null;
        this.createdAt = business.created_at;
        this.updatedAt = business.updated_at;
        this.customData = business.custom_data ? business.custom_data : null;
        this.importMeta = business.import_meta ? new ImportMetaNotification(business.import_meta) : null;
    }
}
