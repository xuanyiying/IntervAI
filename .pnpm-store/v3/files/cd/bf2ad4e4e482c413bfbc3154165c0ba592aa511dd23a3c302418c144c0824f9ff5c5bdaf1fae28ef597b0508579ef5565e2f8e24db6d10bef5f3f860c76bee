import { DiscountGroup, DiscountGroupCollection } from '../../entities/index.js';
import { BaseResource, PathParameters, QueryParameters } from '../../internal/base/index.js';
const DiscountGroupPaths = {
    list: '/discount-groups',
    create: '/discount-groups',
    get: '/discount-groups/{discount_group_id}',
    update: '/discount-groups/{discount_group_id}',
};
export * from './operations/index.js';
export class DiscountGroupsResource extends BaseResource {
    list(queryParams) {
        const queryParameters = new QueryParameters(queryParams);
        return new DiscountGroupCollection(this.client, DiscountGroupPaths.list + queryParameters.toQueryString());
    }
    async create(createDiscountGroupRequestBody) {
        const response = await this.client.post(DiscountGroupPaths.create, createDiscountGroupRequestBody);
        const data = this.handleResponse(response);
        return new DiscountGroup(data);
    }
    async get(discountGroupId) {
        const urlWithPathParams = new PathParameters(DiscountGroupPaths.get, {
            discount_group_id: discountGroupId,
        }).deriveUrl();
        const response = await this.client.get(urlWithPathParams);
        const data = this.handleResponse(response);
        return new DiscountGroup(data);
    }
    async update(discountGroupId, updateDiscountGroup) {
        const urlWithPathParams = new PathParameters(DiscountGroupPaths.update, {
            discount_group_id: discountGroupId,
        }).deriveUrl();
        const response = await this.client.patch(urlWithPathParams, updateDiscountGroup);
        const data = this.handleResponse(response);
        return new DiscountGroup(data);
    }
    async archive(discountGroupId) {
        return await this.update(discountGroupId, { status: 'archived' });
    }
}
