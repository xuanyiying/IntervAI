import { BaseResource, PathParameters, QueryParameters } from '../../internal/base/index.js';
import { CreditBalance, Customer, CustomerCollection, AuthToken } from '../../entities/index.js';
const CustomerPaths = {
    list: '/customers',
    create: '/customers',
    get: '/customers/{customer_id}',
    update: '/customers/{customer_id}',
    getCustomerBalance: '/customers/{customer_id}/credit-balances',
    generate: '/customers/{customer_id}/auth-token',
};
export * from './operations/index.js';
export class CustomersResource extends BaseResource {
    list(queryParams) {
        const queryParameters = new QueryParameters(queryParams);
        return new CustomerCollection(this.client, CustomerPaths.list + queryParameters.toQueryString());
    }
    async create(createCustomerParameters) {
        const response = await this.client.post(CustomerPaths.create, createCustomerParameters);
        const data = this.handleResponse(response);
        return new Customer(data);
    }
    async get(customerId) {
        const urlWithPathParams = new PathParameters(CustomerPaths.get, {
            customer_id: customerId,
        }).deriveUrl();
        const response = await this.client.get(urlWithPathParams);
        const data = this.handleResponse(response);
        return new Customer(data);
    }
    async update(customerId, updateCustomer) {
        const urlWithPathParams = new PathParameters(CustomerPaths.update, {
            customer_id: customerId,
        }).deriveUrl();
        const response = await this.client.patch(urlWithPathParams, updateCustomer);
        const data = this.handleResponse(response);
        return new Customer(data);
    }
    async getCreditBalance(customerId, queryParams) {
        const urlWithPathParams = new PathParameters(CustomerPaths.getCustomerBalance, {
            customer_id: customerId,
        }).deriveUrl();
        const queryParameters = new QueryParameters(queryParams);
        const response = await this.client.get(urlWithPathParams, queryParameters);
        const data = this.handleResponse(response);
        return data.map((balance) => new CreditBalance(balance));
    }
    async archive(customerId) {
        return await this.update(customerId, { status: 'archived' });
    }
    async generateAuthToken(customerId) {
        const urlWithPathParams = new PathParameters(CustomerPaths.generate, {
            customer_id: customerId,
        }).deriveUrl();
        const response = await this.client.post(urlWithPathParams, undefined);
        const data = this.handleResponse(response);
        return new AuthToken(data);
    }
}
