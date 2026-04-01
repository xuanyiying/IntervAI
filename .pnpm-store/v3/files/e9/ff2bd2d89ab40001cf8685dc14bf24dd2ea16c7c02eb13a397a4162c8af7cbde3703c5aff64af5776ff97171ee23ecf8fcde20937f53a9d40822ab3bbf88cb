import { BaseResource, PathParameters, QueryParameters } from '../../internal/base/index.js';
import { ClientToken, ClientTokenCollection } from '../../entities/client-token/index.js';
const ClientTokenPaths = {
    list: '/client-tokens',
    create: '/client-tokens',
    get: '/client-tokens/{client_token_id}',
    update: '/client-tokens/{client_token_id}',
};
export * from './operations/index.js';
export class ClientTokensResource extends BaseResource {
    list(queryParams) {
        const queryParameters = new QueryParameters(queryParams);
        return new ClientTokenCollection(this.client, ClientTokenPaths.list + queryParameters.toQueryString());
    }
    async create(createClientTokenRequestBody) {
        const response = await this.client.post(ClientTokenPaths.create, createClientTokenRequestBody);
        const data = this.handleResponse(response);
        return new ClientToken(data);
    }
    async get(clientTokenId) {
        const urlWithPathParams = new PathParameters(ClientTokenPaths.get, {
            client_token_id: clientTokenId,
        }).deriveUrl();
        const response = await this.client.get(urlWithPathParams);
        const data = this.handleResponse(response);
        return new ClientToken(data);
    }
    async update(clientTokenId, updateClientToken) {
        const urlWithPathParams = new PathParameters(ClientTokenPaths.update, {
            client_token_id: clientTokenId,
        }).deriveUrl();
        const response = await this.client.patch(urlWithPathParams, updateClientToken);
        const data = this.handleResponse(response);
        return new ClientToken(data);
    }
    async revoke(clientTokenId) {
        return await this.update(clientTokenId, { status: 'revoked' });
    }
}
