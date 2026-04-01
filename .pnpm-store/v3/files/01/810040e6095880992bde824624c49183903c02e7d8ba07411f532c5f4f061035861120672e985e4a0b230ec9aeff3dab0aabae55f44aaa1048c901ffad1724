import { BaseResource } from '../../internal/base/index.js';
import { type CreateAddressRequestBody, type ListAddressQueryParameters, type UpdateAddressRequestBody } from './operations/index.js';
import { Address, AddressCollection } from '../../entities/index.js';
export * from './operations/index.js';
export declare class AddressesResource extends BaseResource {
    list(customerId: string, queryParams?: ListAddressQueryParameters): AddressCollection;
    create(customerId: string, createAddressParameters: CreateAddressRequestBody): Promise<Address>;
    get(customerId: string, addressId: string): Promise<Address>;
    update(customerId: string, addressId: string, updateAddress: UpdateAddressRequestBody): Promise<Address>;
    archive(customerId: string, addressId: string): Promise<Address>;
}
