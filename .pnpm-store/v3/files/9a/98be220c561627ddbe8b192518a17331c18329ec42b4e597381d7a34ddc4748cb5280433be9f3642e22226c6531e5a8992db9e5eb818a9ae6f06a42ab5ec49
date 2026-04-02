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
exports.TransactionsResource = void 0;
const index_js_1 = require("../../internal/base/index.js");
const index_js_2 = require("../../entities/index.js");
const TransactionPaths = {
    list: '/transactions',
    create: '/transactions',
    get: '/transactions/{transaction_id}',
    update: '/transactions/{transaction_id}',
    getInvoicePDF: '/transactions/{transaction_id}/invoice',
    preview: '/transactions/preview',
    revise: '/transactions/{transaction_id}/revise',
};
__exportStar(require("./operations/index.js"), exports);
class TransactionsResource extends index_js_1.BaseResource {
    list(queryParams) {
        const queryParameters = new index_js_1.QueryParameters(queryParams);
        return new index_js_2.TransactionCollection(this.client, TransactionPaths.list + queryParameters.toQueryString());
    }
    async create(createTransactionParameters, queryParams) {
        const queryParameters = new index_js_1.QueryParameters(queryParams);
        const response = await this.client.post(TransactionPaths.create + queryParameters.toQueryString(), createTransactionParameters);
        const data = this.handleResponse(response);
        return new index_js_2.Transaction(data);
    }
    async update(transactionId, updateTransaction, queryParams) {
        const queryParameters = new index_js_1.QueryParameters(queryParams);
        const urlWithPathParams = new index_js_1.PathParameters(TransactionPaths.update, {
            transaction_id: transactionId,
        }).deriveUrl();
        const response = await this.client.patch(urlWithPathParams + queryParameters.toQueryString(), updateTransaction);
        const data = this.handleResponse(response);
        return new index_js_2.Transaction(data);
    }
    async get(transactionId, queryParams) {
        const queryParameters = new index_js_1.QueryParameters(queryParams);
        const urlWithPathParams = new index_js_1.PathParameters(TransactionPaths.get, {
            transaction_id: transactionId,
        }).deriveUrl();
        const response = await this.client.get(urlWithPathParams, queryParameters);
        const data = this.handleResponse(response);
        return new index_js_2.Transaction(data);
    }
    async getInvoicePDF(transactionId, queryParams) {
        const queryParameters = new index_js_1.QueryParameters(queryParams);
        const urlWithPathParams = new index_js_1.PathParameters(TransactionPaths.getInvoicePDF, {
            transaction_id: transactionId,
        }).deriveUrl();
        const response = await this.client.get(urlWithPathParams + queryParameters.toQueryString());
        const data = this.handleResponse(response);
        return new index_js_2.TransactionInvoicePDF(data);
    }
    async preview(previewTransactionParameters) {
        const response = await this.client.post(TransactionPaths.preview, previewTransactionParameters);
        const data = this.handleResponse(response);
        return new index_js_2.TransactionPreview(data);
    }
    async revise(transactionId, reviseTransaction) {
        const urlWithPathParams = new index_js_1.PathParameters(TransactionPaths.revise, {
            transaction_id: transactionId,
        }).deriveUrl();
        const response = await this.client.post(urlWithPathParams, reviseTransaction);
        const data = this.handleResponse(response);
        return new index_js_2.Transaction(data);
    }
}
exports.TransactionsResource = TransactionsResource;
