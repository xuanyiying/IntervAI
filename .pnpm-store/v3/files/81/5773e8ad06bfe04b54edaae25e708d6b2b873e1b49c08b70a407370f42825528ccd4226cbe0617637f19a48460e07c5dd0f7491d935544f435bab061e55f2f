import { BaseResource, PathParameters, QueryParameters } from '../../internal/base/index.js';
import { Transaction, TransactionCollection, TransactionInvoicePDF, TransactionPreview } from '../../entities/index.js';
const TransactionPaths = {
    list: '/transactions',
    create: '/transactions',
    get: '/transactions/{transaction_id}',
    update: '/transactions/{transaction_id}',
    getInvoicePDF: '/transactions/{transaction_id}/invoice',
    preview: '/transactions/preview',
    revise: '/transactions/{transaction_id}/revise',
};
export * from './operations/index.js';
export class TransactionsResource extends BaseResource {
    list(queryParams) {
        const queryParameters = new QueryParameters(queryParams);
        return new TransactionCollection(this.client, TransactionPaths.list + queryParameters.toQueryString());
    }
    async create(createTransactionParameters, queryParams) {
        const queryParameters = new QueryParameters(queryParams);
        const response = await this.client.post(TransactionPaths.create + queryParameters.toQueryString(), createTransactionParameters);
        const data = this.handleResponse(response);
        return new Transaction(data);
    }
    async update(transactionId, updateTransaction, queryParams) {
        const queryParameters = new QueryParameters(queryParams);
        const urlWithPathParams = new PathParameters(TransactionPaths.update, {
            transaction_id: transactionId,
        }).deriveUrl();
        const response = await this.client.patch(urlWithPathParams + queryParameters.toQueryString(), updateTransaction);
        const data = this.handleResponse(response);
        return new Transaction(data);
    }
    async get(transactionId, queryParams) {
        const queryParameters = new QueryParameters(queryParams);
        const urlWithPathParams = new PathParameters(TransactionPaths.get, {
            transaction_id: transactionId,
        }).deriveUrl();
        const response = await this.client.get(urlWithPathParams, queryParameters);
        const data = this.handleResponse(response);
        return new Transaction(data);
    }
    async getInvoicePDF(transactionId, queryParams) {
        const queryParameters = new QueryParameters(queryParams);
        const urlWithPathParams = new PathParameters(TransactionPaths.getInvoicePDF, {
            transaction_id: transactionId,
        }).deriveUrl();
        const response = await this.client.get(urlWithPathParams + queryParameters.toQueryString());
        const data = this.handleResponse(response);
        return new TransactionInvoicePDF(data);
    }
    async preview(previewTransactionParameters) {
        const response = await this.client.post(TransactionPaths.preview, previewTransactionParameters);
        const data = this.handleResponse(response);
        return new TransactionPreview(data);
    }
    async revise(transactionId, reviseTransaction) {
        const urlWithPathParams = new PathParameters(TransactionPaths.revise, {
            transaction_id: transactionId,
        }).deriveUrl();
        const response = await this.client.post(urlWithPathParams, reviseTransaction);
        const data = this.handleResponse(response);
        return new Transaction(data);
    }
}
