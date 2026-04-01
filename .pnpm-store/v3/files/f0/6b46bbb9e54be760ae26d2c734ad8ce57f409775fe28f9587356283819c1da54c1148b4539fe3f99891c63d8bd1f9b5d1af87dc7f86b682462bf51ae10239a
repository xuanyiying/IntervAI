import { BaseResource } from '../../internal/base/index.js';
import { type CreateTransactionQueryParameters, type CreateTransactionRequestBody, type GetTransactionInvoicePdfQueryParameters, type GetTransactionQueryParameters, type ListTransactionQueryParameters, type ReviseTransactionRequestBody, type TransactionPreviewRequestBody, type UpdateTransactionQueryParameters, type UpdateTransactionRequestBody } from './operations/index.js';
import { Transaction, TransactionCollection, TransactionInvoicePDF, TransactionPreview } from '../../entities/index.js';
export * from './operations/index.js';
export declare class TransactionsResource extends BaseResource {
    list(queryParams?: ListTransactionQueryParameters): TransactionCollection;
    create(createTransactionParameters: CreateTransactionRequestBody, queryParams?: CreateTransactionQueryParameters): Promise<Transaction>;
    update(transactionId: string, updateTransaction: UpdateTransactionRequestBody, queryParams?: UpdateTransactionQueryParameters): Promise<Transaction>;
    get(transactionId: string, queryParams?: GetTransactionQueryParameters): Promise<Transaction>;
    getInvoicePDF(transactionId: string, queryParams?: GetTransactionInvoicePdfQueryParameters): Promise<TransactionInvoicePDF>;
    preview(previewTransactionParameters: TransactionPreviewRequestBody): Promise<TransactionPreview>;
    revise(transactionId: string, reviseTransaction: ReviseTransactionRequestBody): Promise<Transaction>;
}
