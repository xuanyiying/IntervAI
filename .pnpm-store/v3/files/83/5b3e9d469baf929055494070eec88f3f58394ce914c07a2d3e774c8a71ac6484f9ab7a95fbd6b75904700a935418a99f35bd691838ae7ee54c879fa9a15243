import { BaseResource, PathParameters, QueryParameters } from '../../internal/base/index.js';
import { Price, PriceCollection } from '../../entities/index.js';
const PricePaths = {
    list: '/prices',
    create: '/prices',
    get: '/prices/{price_id}',
    update: '/prices/{price_id}',
};
export * from './operations/index.js';
export class PricesResource extends BaseResource {
    list(queryParams) {
        const queryParameters = new QueryParameters(queryParams);
        return new PriceCollection(this.client, PricePaths.list + queryParameters.toQueryString());
    }
    async create(createPriceParameters) {
        const response = await this.client.post(PricePaths.create, createPriceParameters);
        const data = this.handleResponse(response);
        return new Price(data);
    }
    async get(priceId, queryParams) {
        const queryParameters = new QueryParameters(queryParams);
        const urlWithPathParams = new PathParameters(PricePaths.get, {
            price_id: priceId,
        }).deriveUrl();
        const response = await this.client.get(urlWithPathParams, queryParameters);
        const data = this.handleResponse(response);
        return new Price(data);
    }
    async update(priceId, updatePrice) {
        const urlWithPathParams = new PathParameters(PricePaths.update, {
            price_id: priceId,
        }).deriveUrl();
        const response = await this.client.patch(urlWithPathParams, updatePrice);
        const data = this.handleResponse(response);
        return new Price(data);
    }
    async archive(priceId) {
        return await this.update(priceId, { status: 'archived' });
    }
}
