import { TransactionProrationNotification } from './transaction-proration-notification.js';
import { TotalsNotification, UnitTotalsNotification } from '../shared/index.js';
import { ProductNotification } from '../product/index.js';
import { type ITransactionLineItemNotificationResponse } from '../../types/index.js';
export declare class TransactionLineItemNotification {
    readonly id: string;
    readonly priceId: string;
    readonly quantity: number;
    readonly proration: TransactionProrationNotification | null;
    readonly taxRate: string;
    readonly unitTotals: UnitTotalsNotification | null;
    readonly totals: TotalsNotification | null;
    readonly product: ProductNotification | null;
    constructor(transactionLineItem: ITransactionLineItemNotificationResponse);
}
