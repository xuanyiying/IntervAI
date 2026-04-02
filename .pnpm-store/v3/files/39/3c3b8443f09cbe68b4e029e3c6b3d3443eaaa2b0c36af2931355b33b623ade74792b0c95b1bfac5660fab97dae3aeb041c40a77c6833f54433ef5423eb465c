import { type ErrorCode, type PaymentAttemptStatus } from '../../enums/index.js';
import { PaymentMethodDetails } from './payment-method-details.js';
import { type ITransactionPaymentAttemptResponse } from '../../types/index.js';
export declare class TransactionPaymentAttempt {
    readonly paymentAttemptId: string;
    readonly paymentMethodId: string | null;
    readonly storedPaymentMethodId: string;
    readonly amount: string;
    readonly status: PaymentAttemptStatus;
    readonly errorCode: ErrorCode | null;
    readonly methodDetails: PaymentMethodDetails | null;
    readonly createdAt: string;
    readonly capturedAt: string | null;
    constructor(transactionPaymentAttempt: ITransactionPaymentAttemptResponse);
}
