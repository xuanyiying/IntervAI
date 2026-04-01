import { BaseResource, PathParameters, QueryParameters } from '../../internal/base/index.js';
import { Discount, DiscountCollection } from '../../entities/index.js';
const DiscountPaths = {
    list: '/discounts',
    create: '/discounts',
    get: '/discounts/{discount_id}',
    update: '/discounts/{discount_id}',
};
export * from './operations/index.js';
export class DiscountsResource extends BaseResource {
    list(queryParams) {
        const queryParameters = new QueryParameters(queryParams);
        return new DiscountCollection(this.client, DiscountPaths.list + queryParameters.toQueryString());
    }
    async create(createDiscountParameters) {
        const response = await this.client.post(DiscountPaths.create, createDiscountParameters);
        const data = this.handleResponse(response);
        return new Discount(data);
    }
    async get(discountId, queryParams) {
        const queryParameters = new QueryParameters(queryParams);
        const urlWithPathParams = new PathParameters(DiscountPaths.get, {
            discount_id: discountId,
        }).deriveUrl();
        const response = await this.client.get(urlWithPathParams + queryParameters.toQueryString());
        const data = this.handleResponse(response);
        return new Discount(data);
    }
    async update(discountId, updateDiscount) {
        const urlWithPathParams = new PathParameters(DiscountPaths.update, {
            discount_id: discountId,
        }).deriveUrl();
        const response = await this.client.patch(urlWithPathParams, updateDiscount);
        const data = this.handleResponse(response);
        return new Discount(data);
    }
    async archive(discountId) {
        return await this.update(discountId, { status: 'archived' });
    }
}
