import { BaseResource, PathParameters, QueryParameters } from '../../internal/base/index.js';
import { Business, BusinessCollection } from '../../entities/index.js';
const BusinessPaths = {
    list: '/customers/{customer_id}/businesses',
    create: '/customers/{customer_id}/businesses',
    get: '/customers/{customer_id}/businesses/{business_id}',
    update: '/customers/{customer_id}/businesses/{business_id}',
};
export * from './operations/index.js';
export class BusinessesResource extends BaseResource {
    list(customerId, queryParams) {
        const queryParameters = new QueryParameters(queryParams);
        const urlWithPathParams = new PathParameters(BusinessPaths.list, {
            customer_id: customerId,
        }).deriveUrl();
        return new BusinessCollection(this.client, urlWithPathParams + queryParameters.toQueryString());
    }
    async create(customerId, createBusinessParameters) {
        const urlWithPathParams = new PathParameters(BusinessPaths.create, {
            customer_id: customerId,
        }).deriveUrl();
        const response = await this.client.post(urlWithPathParams, createBusinessParameters);
        const data = this.handleResponse(response);
        return new Business(data);
    }
    async get(customerId, businessId) {
        const urlWithPathParams = new PathParameters(BusinessPaths.get, {
            customer_id: customerId,
            business_id: businessId,
        }).deriveUrl();
        const response = await this.client.get(urlWithPathParams);
        const data = this.handleResponse(response);
        return new Business(data);
    }
    async update(customerId, businessId, updateBusiness) {
        const urlWithPathParams = new PathParameters(BusinessPaths.update, {
            customer_id: customerId,
            business_id: businessId,
        }).deriveUrl();
        const response = await this.client.patch(urlWithPathParams, updateBusiness);
        const data = this.handleResponse(response);
        return new Business(data);
    }
    async archive(customerId, businessId) {
        return await this.update(customerId, businessId, { status: 'archived' });
    }
}
