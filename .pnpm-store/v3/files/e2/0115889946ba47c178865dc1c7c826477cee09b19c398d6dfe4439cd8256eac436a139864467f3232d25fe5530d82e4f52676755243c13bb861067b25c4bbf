import { BaseResource } from '../../internal/base/index.js';
import { type CreatePriceRequestBody, type GetPriceQueryParameters, type ListPriceQueryParameters, type UpdatePriceRequestBody } from './operations/index.js';
import { Price, PriceCollection } from '../../entities/index.js';
export * from './operations/index.js';
export declare class PricesResource extends BaseResource {
    list(queryParams?: ListPriceQueryParameters): PriceCollection;
    create(createPriceParameters: CreatePriceRequestBody): Promise<Price>;
    get(priceId: string, queryParams?: GetPriceQueryParameters): Promise<Price>;
    update(priceId: string, updatePrice: UpdatePriceRequestBody): Promise<Price>;
    archive(priceId: string): Promise<Price>;
}
