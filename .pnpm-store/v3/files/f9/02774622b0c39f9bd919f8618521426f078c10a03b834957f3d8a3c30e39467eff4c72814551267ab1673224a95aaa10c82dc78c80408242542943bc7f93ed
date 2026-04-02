"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentMethodDetailsNotification = void 0;
const payment_card_notification_js_1 = require("./payment-card-notification.js");
const payment_method_underlying_details_notification_js_1 = require("./payment-method-underlying-details-notification.js");
const south_korea_local_card_notification_js_1 = require("./south-korea-local-card-notification.js");
class PaymentMethodDetailsNotification {
    type;
    card;
    southKoreaLocalCard;
    underlyingDetails;
    constructor(paymentMethodDetails) {
        this.type = paymentMethodDetails.type;
        this.card = paymentMethodDetails.card ? new payment_card_notification_js_1.PaymentCardNotification(paymentMethodDetails.card) : null;
        this.southKoreaLocalCard = paymentMethodDetails.south_korea_local_card
            ? new south_korea_local_card_notification_js_1.SouthKoreaLocalCardNotification(paymentMethodDetails.south_korea_local_card)
            : null;
        this.underlyingDetails = paymentMethodDetails.underlying_details
            ? new payment_method_underlying_details_notification_js_1.PaymentMethodUnderlyingDetailsNotification(paymentMethodDetails.underlying_details)
            : null;
    }
}
exports.PaymentMethodDetailsNotification = PaymentMethodDetailsNotification;
