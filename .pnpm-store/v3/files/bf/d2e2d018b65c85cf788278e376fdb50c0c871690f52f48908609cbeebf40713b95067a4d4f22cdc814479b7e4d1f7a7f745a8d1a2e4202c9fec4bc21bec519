import { ImportMeta } from '../index.js';
export class DiscountGroup {
    id;
    name;
    status;
    createdAt;
    updatedAt;
    importMeta;
    constructor(discountGroupResponse) {
        this.id = discountGroupResponse.id;
        this.name = discountGroupResponse.name;
        this.status = discountGroupResponse.status;
        this.createdAt = discountGroupResponse.created_at;
        this.updatedAt = discountGroupResponse.updated_at;
        this.importMeta = discountGroupResponse.import_meta ? new ImportMeta(discountGroupResponse.import_meta) : null;
    }
}
