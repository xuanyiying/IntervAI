import { BaseResource } from '../../internal/base/index.js';
import { CreateClientTokenRequestBody, ListClientTokenQueryParameters, UpdateClientTokenRequestBody } from './operations/index.js';
import { ClientToken, ClientTokenCollection } from '../../entities/client-token/index.js';
export * from './operations/index.js';
export declare class ClientTokensResource extends BaseResource {
    list(queryParams?: ListClientTokenQueryParameters): ClientTokenCollection;
    create(createClientTokenRequestBody: CreateClientTokenRequestBody): Promise<ClientToken>;
    get(clientTokenId: string): Promise<ClientToken>;
    update(clientTokenId: string, updateClientToken: UpdateClientTokenRequestBody): Promise<ClientToken>;
    revoke(clientTokenId: string): Promise<ClientToken>;
}
