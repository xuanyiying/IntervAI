"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiscountGroupNotification = void 0;
const index_js_1 = require("../shared/index.js");
class DiscountGroupNotification {
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
        this.importMeta = discountGroupResponse.import_meta
            ? new index_js_1.ImportMetaNotification(discountGroupResponse.import_meta)
            : null;
    }
}
exports.DiscountGroupNotification = DiscountGroupNotification;
