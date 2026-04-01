"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentMethodDetails = void 0;
const payment_card_js_1 = require("./payment-card.js");
const payment_method_underlying_details_js_1 = require("./payment-method-underlying-details.js");
const south_korea_local_card_js_1 = require("./south-korea-local-card.js");
class PaymentMethodDetails {
    type;
    card;
    southKoreaLocalCard;
    underlyingDetails;
    constructor(paymentMethodDetails) {
        this.type = paymentMethodDetails.type;
        this.card = paymentMethodDetails.card ? new payment_card_js_1.PaymentCard(paymentMethodDetails.card) : null;
        this.southKoreaLocalCard = paymentMethodDetails.south_korea_local_card
            ? new south_korea_local_card_js_1.SouthKoreaLocalCard(paymentMethodDetails.south_korea_local_card)
            : null;
        this.underlyingDetails = paymentMethodDetails.underlying_details
            ? new payment_method_underlying_details_js_1.PaymentMethodUnderlyingDetails(paymentMethodDetails.underlying_details)
            : null;
    }
}
exports.PaymentMethodDetails = PaymentMethodDetails;
