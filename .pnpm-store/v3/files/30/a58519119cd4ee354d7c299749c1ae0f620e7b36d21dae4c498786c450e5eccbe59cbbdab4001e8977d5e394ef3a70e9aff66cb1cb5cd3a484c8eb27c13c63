"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientTokensResource = void 0;
const index_js_1 = require("../../internal/base/index.js");
const index_js_2 = require("../../entities/client-token/index.js");
const ClientTokenPaths = {
    list: '/client-tokens',
    create: '/client-tokens',
    get: '/client-tokens/{client_token_id}',
    update: '/client-tokens/{client_token_id}',
};
__exportStar(require("./operations/index.js"), exports);
class ClientTokensResource extends index_js_1.BaseResource {
    list(queryParams) {
        const queryParameters = new index_js_1.QueryParameters(queryParams);
        return new index_js_2.ClientTokenCollection(this.client, ClientTokenPaths.list + queryParameters.toQueryString());
    }
    async create(createClientTokenRequestBody) {
        const response = await this.client.post(ClientTokenPaths.create, createClientTokenRequestBody);
        const data = this.handleResponse(response);
        return new index_js_2.ClientToken(data);
    }
    async get(clientTokenId) {
        const urlWithPathParams = new index_js_1.PathParameters(ClientTokenPaths.get, {
            client_token_id: clientTokenId,
        }).deriveUrl();
        const response = await this.client.get(urlWithPathParams);
        const data = this.handleResponse(response);
        return new index_js_2.ClientToken(data);
    }
    async update(clientTokenId, updateClientToken) {
        const urlWithPathParams = new index_js_1.PathParameters(ClientTokenPaths.update, {
            client_token_id: clientTokenId,
        }).deriveUrl();
        const response = await this.client.patch(urlWithPathParams, updateClientToken);
        const data = this.handleResponse(response);
        return new index_js_2.ClientToken(data);
    }
    async revoke(clientTokenId) {
        return await this.update(clientTokenId, { status: 'revoked' });
    }
}
exports.ClientTokensResource = ClientTokensResource;
