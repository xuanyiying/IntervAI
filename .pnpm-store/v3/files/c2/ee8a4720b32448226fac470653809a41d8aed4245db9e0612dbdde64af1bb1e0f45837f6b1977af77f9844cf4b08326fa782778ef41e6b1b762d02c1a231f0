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
exports.AddressesResource = void 0;
const index_js_1 = require("../../internal/base/index.js");
const index_js_2 = require("../../entities/index.js");
const AddressPaths = {
    list: '/customers/{customer_id}/addresses',
    create: '/customers/{customer_id}/addresses',
    get: '/customers/{customer_id}/addresses/{address_id}',
    update: '/customers/{customer_id}/addresses/{address_id}',
};
__exportStar(require("./operations/index.js"), exports);
class AddressesResource extends index_js_1.BaseResource {
    list(customerId, queryParams) {
        const queryParameters = new index_js_1.QueryParameters(queryParams);
        const urlWithPathParams = new index_js_1.PathParameters(AddressPaths.list, {
            customer_id: customerId,
        }).deriveUrl();
        return new index_js_2.AddressCollection(this.client, urlWithPathParams + queryParameters.toQueryString());
    }
    async create(customerId, createAddressParameters) {
        const urlWithPathParams = new index_js_1.PathParameters(AddressPaths.create, {
            customer_id: customerId,
        }).deriveUrl();
        const response = await this.client.post(urlWithPathParams, createAddressParameters);
        const data = this.handleResponse(response);
        return new index_js_2.Address(data);
    }
    async get(customerId, addressId) {
        const urlWithPathParams = new index_js_1.PathParameters(AddressPaths.get, {
            customer_id: customerId,
            address_id: addressId,
        }).deriveUrl();
        const response = await this.client.get(urlWithPathParams);
        const data = this.handleResponse(response);
        return new index_js_2.Address(data);
    }
    async update(customerId, addressId, updateAddress) {
        const urlWithPathParams = new index_js_1.PathParameters(AddressPaths.update, {
            customer_id: customerId,
            address_id: addressId,
        }).deriveUrl();
        const response = await this.client.patch(urlWithPathParams, updateAddress);
        const data = this.handleResponse(response);
        return new index_js_2.Address(data);
    }
    async archive(customerId, addressId) {
        return await this.update(customerId, addressId, { status: 'archived' });
    }
}
exports.AddressesResource = AddressesResource;
