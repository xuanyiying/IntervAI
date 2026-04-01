import { BaseResource } from '../../internal/base/index.js';
import { type CreateProductRequestBody, type GetProductQueryParameters, type ListProductQueryParameters, type UpdateProductRequestBody } from './operations/index.js';
import { Product, ProductCollection } from '../../entities/index.js';
export * from './operations/index.js';
export declare class ProductsResource extends BaseResource {
    list(queryParams?: ListProductQueryParameters): ProductCollection;
    create(createProductParameters: CreateProductRequestBody): Promise<Product>;
    get(productId: string, queryParams?: GetProductQueryParameters): Promise<Product>;
    update(productId: string, updateProduct: UpdateProductRequestBody): Promise<Product>;
    archive(productId: string): Promise<Product>;
}
