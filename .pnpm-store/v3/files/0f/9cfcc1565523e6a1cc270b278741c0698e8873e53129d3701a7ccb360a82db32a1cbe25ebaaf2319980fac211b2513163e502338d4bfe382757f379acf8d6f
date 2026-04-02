import { BaseResource } from '../../internal/base/index.js';
import { type CreateBusinessRequestBody, type ListBusinessQueryParameters, type UpdateBusinessRequestBody } from './operations/index.js';
import { Business, BusinessCollection } from '../../entities/index.js';
export * from './operations/index.js';
export declare class BusinessesResource extends BaseResource {
    list(customerId: string, queryParams?: ListBusinessQueryParameters): BusinessCollection;
    create(customerId: string, createBusinessParameters: CreateBusinessRequestBody): Promise<Business>;
    get(customerId: string, businessId: string): Promise<Business>;
    update(customerId: string, businessId: string, updateBusiness: UpdateBusinessRequestBody): Promise<Business>;
    archive(customerId: string, businessId: string): Promise<Business>;
}
