"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionPaymentAttemptNotification = void 0;
const payment_method_details_notification_js_1 = require("./payment-method-details-notification.js");
class TransactionPaymentAttemptNotification {
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
            ? new payment_method_details_notification_js_1.PaymentMethodDetailsNotification(transactionPaymentAttempt.method_details)
            : null;
        this.createdAt = transactionPaymentAttempt.created_at;
        this.capturedAt = transactionPaymentAttempt.captured_at ? transactionPaymentAttempt.captured_at : null;
    }
}
exports.TransactionPaymentAttemptNotification = TransactionPaymentAttemptNotification;
