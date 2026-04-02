import { type ErrorCode, type PaymentAttemptStatus } from '../../../enums/index.js';
import { PaymentMethodDetailsNotification } from './payment-method-details-notification.js';
import { type ITransactionPaymentAttemptNotificationResponse } from '../../types/index.js';
export declare class TransactionPaymentAttemptNotification {
    readonly paymentAttemptId: string;
    readonly paymentMethodId: string | null;
    readonly storedPaymentMethodId: string;
    readonly amount: string;
    readonly status: PaymentAttemptStatus;
    readonly errorCode: ErrorCode | null;
    readonly methodDetails: PaymentMethodDetailsNotification | null;
    readonly createdAt: string;
    readonly capturedAt: string | null;
    constructor(transactionPaymentAttempt: ITransactionPaymentAttemptNotificationResponse);
}
