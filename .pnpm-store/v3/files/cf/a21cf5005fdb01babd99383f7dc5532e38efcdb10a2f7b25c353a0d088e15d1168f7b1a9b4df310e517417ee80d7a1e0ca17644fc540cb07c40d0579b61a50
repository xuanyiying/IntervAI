import { DiscountGroup, DiscountGroupCollection } from '../../entities/index.js';
import { BaseResource } from '../../internal/base/index.js';
import { type CreateDiscountGroupRequestBody, type ListDiscountGroupQueryParameters, type UpdateDiscountGroupRequestBody } from './operations/index.js';
export * from './operations/index.js';
export declare class DiscountGroupsResource extends BaseResource {
    list(queryParams?: ListDiscountGroupQueryParameters): DiscountGroupCollection;
    create(createDiscountGroupRequestBody: CreateDiscountGroupRequestBody): Promise<DiscountGroup>;
    get(discountGroupId: string): Promise<DiscountGroup>;
    update(discountGroupId: string, updateDiscountGroup: UpdateDiscountGroupRequestBody): Promise<DiscountGroup>;
    archive(discountGroupId: string): Promise<DiscountGroup>;
}
