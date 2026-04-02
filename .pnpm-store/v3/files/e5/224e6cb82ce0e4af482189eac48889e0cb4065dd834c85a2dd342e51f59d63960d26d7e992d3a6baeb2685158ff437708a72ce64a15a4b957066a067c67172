import { BaseResource } from '../../internal/base/index.js';
import { type CreateDiscountRequestBody, type GetDiscountQueryParameters, type ListDiscountQueryParameters, type UpdateDiscountRequestBody } from './operations/index.js';
import { Discount, DiscountCollection } from '../../entities/index.js';
export * from './operations/index.js';
export declare class DiscountsResource extends BaseResource {
    list(queryParams?: ListDiscountQueryParameters): DiscountCollection;
    create(createDiscountParameters: CreateDiscountRequestBody): Promise<Discount>;
    get(discountId: string, queryParams?: GetDiscountQueryParameters): Promise<Discount>;
    update(discountId: string, updateDiscount: UpdateDiscountRequestBody): Promise<Discount>;
    archive(discountId: string): Promise<Discount>;
}
