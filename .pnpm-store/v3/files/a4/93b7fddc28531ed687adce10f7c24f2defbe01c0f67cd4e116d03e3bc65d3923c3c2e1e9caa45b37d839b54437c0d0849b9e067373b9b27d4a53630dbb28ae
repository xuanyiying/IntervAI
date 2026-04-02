"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductNotification = void 0;
const index_js_1 = require("../shared/index.js");
class ProductNotification {
    id;
    name;
    type;
    description;
    taxCategory;
    imageUrl;
    customData;
    status;
    createdAt;
    updatedAt;
    importMeta;
    constructor(product) {
        this.id = product.id;
        this.name = product.name;
        this.type = product.type ?? null;
        this.description = product.description ? product.description : null;
        this.taxCategory = product.tax_category;
        this.imageUrl = product.image_url ? product.image_url : null;
        this.customData = product.custom_data ? product.custom_data : null;
        this.status = product.status;
        this.createdAt = product.created_at;
        this.updatedAt = product.updated_at ?? null;
        this.importMeta = product.import_meta ? new index_js_1.ImportMetaNotification(product.import_meta) : null;
    }
}
exports.ProductNotification = ProductNotification;
