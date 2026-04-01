import { PaymentMethodDetailsNotification } from './payment-method-details-notification.js';
export class TransactionPaymentAttemptNotification {
    paymentAttemptId;
    paymentMethodId;
    storedPaymentMethodId;
    amount;
    status;
    errorCode;
    methodDetails;
    createdAt;
    capturedAt;
    constructor(transactionPaymentAttempt) {
        this.paymentAttemptId = transactionPaymentAttempt.payment_attempt_id;
        this.paymentMethodId = transactionPaymentAttempt.payment_method_id ?? null;
        this.storedPaymentMethodId = transactionPaymentAttempt.stored_payment_method_id;
        this.amount = transactionPaymentAttempt.amount;
        this.status = transactionPaymentAttempt.status;
        this.errorCode = transactionPaymentAttempt.error_code ? transactionPaymentAttempt.error_code : null;
        this.methodDetails = transactionPaymentAttempt.method_details
            ? new PaymentMethodDetailsNotification(transactionPaymentAttempt.method_details)
            : null;
        this.createdAt = transactionPaymentAttempt.created_at;
        this.capturedAt = transactionPaymentAttempt.captured_at ? transactionPaymentAttempt.captured_at : null;
    }
}
