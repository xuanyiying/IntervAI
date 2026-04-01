import { type AvailablePaymentMethod, type CurrencyCode } from '../../enums/index.js';
import { AddressPreview } from './address-preview.js';
import { TransactionItemPreview } from './transaction-item-preview.js';
import { TransactionDetailsPreview } from '../subscription/index.js';
import { type ITransactionPreviewResponse } from '../../types/index.js';
export declare class TransactionPreview {
    readonly customerId: string | null;
    readonly addressId: string | null;
    readonly businessId: string | null;
    readonly currencyCode: CurrencyCode;
    readonly discountId: string | null;
    readonly customerIpAddress: string | null;
    readonly address: AddressPreview | null;
    readonly ignoreTrials: boolean | null;
    readonly items: TransactionItemPreview[];
    readonly details: TransactionDetailsPreview;
    readonly availablePaymentMethods: AvailablePaymentMethod | null;
    constructor(transactionPreview: ITransactionPreviewResponse);
}
