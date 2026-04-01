import { TransactionProration } from './transaction-proration.js';
import { Totals, UnitTotals } from '../shared/index.js';
import { Product } from '../product/index.js';
import { type ITransactionLineItemResponse } from '../../types/index.js';
export declare class TransactionLineItem {
    readonly id: string;
    readonly priceId: string;
    readonly quantity: number;
    readonly proration: TransactionProration | null;
    readonly taxRate: string;
    readonly unitTotals: UnitTotals | null;
    readonly totals: Totals | null;
    readonly product: Product | null;
    constructor(transactionLineItem: ITransactionLineItemResponse);
}
