import { BaseResource, PathParameters, QueryParameters } from '../../internal/base/index.js';
import { Address, AddressCollection } from '../../entities/index.js';
const AddressPaths = {
    list: '/customers/{customer_id}/addresses',
    create: '/customers/{customer_id}/addresses',
    get: '/customers/{customer_id}/addresses/{address_id}',
    update: '/customers/{customer_id}/addresses/{address_id}',
};
export * from './operations/index.js';
export class AddressesResource extends BaseResource {
    list(customerId, queryParams) {
        const queryParameters = new QueryParameters(queryParams);
        const urlWithPathParams = new PathParameters(AddressPaths.list, {
            customer_id: customerId,
        }).deriveUrl();
        return new AddressCollection(this.client, urlWithPathParams + queryParameters.toQueryString());
    }
    async create(customerId, createAddressParameters) {
        const urlWithPathParams = new PathParameters(AddressPaths.create, {
            customer_id: customerId,
        }).deriveUrl();
        const response = await this.client.post(urlWithPathParams, createAddressParameters);
        const data = this.handleResponse(response);
        return new Address(data);
    }
    async get(customerId, addressId) {
        const urlWithPathParams = new PathParameters(AddressPaths.get, {
            customer_id: customerId,
            address_id: addressId,
        }).deriveUrl();
        const response = await this.client.get(urlWithPathParams);
        const data = this.handleResponse(response);
        return new Address(data);
    }
    async update(customerId, addressId, updateAddress) {
        const urlWithPathParams = new PathParameters(AddressPaths.update, {
            customer_id: customerId,
            address_id: addressId,
        }).deriveUrl();
        const response = await this.client.patch(urlWithPathParams, updateAddress);
        const data = this.handleResponse(response);
        return new Address(data);
    }
    async archive(customerId, addressId) {
        return await this.update(customerId, addressId, { status: 'archived' });
    }
}
