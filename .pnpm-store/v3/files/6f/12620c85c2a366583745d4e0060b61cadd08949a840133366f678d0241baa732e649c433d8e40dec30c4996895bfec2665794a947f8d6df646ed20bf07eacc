import { Totals, UnitTotals } from '../shared/index.js';
import { Product } from '../product/index.js';
import { type ITransactionLineItemPreviewResponse } from '../../types/index.js';
import { Proration } from '../transaction/proration.js';
export declare class TransactionLineItemPreview {
    readonly priceId: string;
    readonly quantity: number;
    readonly taxRate: string;
    readonly unitTotals: UnitTotals;
    readonly totals: Totals;
    readonly product: Product;
    readonly proration: Proration | null;
    constructor(transactionLineItemPreview: ITransactionLineItemPreviewResponse);
}
