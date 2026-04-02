import { ImportMeta, Price } from '../index.js';
export class Product {
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
    prices;
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
        this.updatedAt = product.updated_at;
        this.importMeta = product.import_meta ? new ImportMeta(product.import_meta) : null;
        this.prices = product.prices ? product.prices.map((price) => new Price(price)) : null;
    }
}
