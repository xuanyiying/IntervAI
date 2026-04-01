import { BaseResource } from '../../internal/base/index.js';
import { type CreateCustomerRequestBody, type GetCreditBalanceQueryParameters, type ListCustomerQueryParameters, type UpdateCustomerRequestBody } from './operations/index.js';
import { CreditBalance, Customer, CustomerCollection, AuthToken } from '../../entities/index.js';
export * from './operations/index.js';
export declare class CustomersResource extends BaseResource {
    list(queryParams?: ListCustomerQueryParameters): CustomerCollection;
    create(createCustomerParameters: CreateCustomerRequestBody): Promise<Customer>;
    get(customerId: string): Promise<Customer>;
    update(customerId: string, updateCustomer: UpdateCustomerRequestBody): Promise<Customer>;
    getCreditBalance(customerId: string, queryParams?: GetCreditBalanceQueryParameters): Promise<CreditBalance[]>;
    archive(customerId: string): Promise<Customer>;
    generateAuthToken(customerId: string): Promise<AuthToken>;
}
