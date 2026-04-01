import { BaseResource, PathParameters, QueryParameters } from '../../internal/base/index.js';
import { Product, ProductCollection } from '../../entities/index.js';
const ProductPaths = {
    list: '/products',
    create: '/products',
    get: '/products/{product_id}',
    update: '/products/{product_id}',
};
export * from './operations/index.js';
export class ProductsResource extends BaseResource {
    list(queryParams) {
        const queryParameters = new QueryParameters(queryParams);
        return new ProductCollection(this.client, ProductPaths.list + queryParameters.toQueryString());
    }
    async create(createProductParameters) {
        const response = await this.client.post(ProductPaths.create, createProductParameters);
        const data = this.handleResponse(response);
        return new Product(data);
    }
    async get(productId, queryParams) {
        const queryParameters = new QueryParameters(queryParams);
        const urlWithPathParams = new PathParameters(ProductPaths.get, {
            product_id: productId,
        }).deriveUrl();
        const response = await this.client.get(urlWithPathParams, queryParameters);
        const data = this.handleResponse(response);
        return new Product(data);
    }
    async update(productId, updateProduct) {
        const urlWithPathParams = new PathParameters(ProductPaths.update, {
            product_id: productId,
        }).deriveUrl();
        const response = await this.client.patch(urlWithPathParams, updateProduct);
        const data = this.handleResponse(response);
        return new Product(data);
    }
    async archive(productId) {
        return await this.update(productId, { status: 'archived' });
    }
}
