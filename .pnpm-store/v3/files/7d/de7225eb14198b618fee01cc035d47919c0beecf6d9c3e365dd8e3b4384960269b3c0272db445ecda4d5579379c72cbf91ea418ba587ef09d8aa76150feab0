"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentMethod = void 0;
const index_js_1 = require("../shared/index.js");
class PaymentMethod {
    id;
    customerId;
    addressId;
    type;
    card;
    paypal;
    southKoreaLocalCard;
    underlyingDetails;
    origin;
    savedAt;
    updatedAt;
    constructor(paymentMethodResponse) {
        this.id = paymentMethodResponse.id;
        this.customerId = paymentMethodResponse.customer_id;
        this.addressId = paymentMethodResponse.address_id;
        this.type = paymentMethodResponse.type;
        this.card = paymentMethodResponse.card ? new index_js_1.PaymentCard(paymentMethodResponse.card) : null;
        this.paypal = paymentMethodResponse.paypal ? new index_js_1.PayPal(paymentMethodResponse.paypal) : null;
        this.southKoreaLocalCard = paymentMethodResponse.south_korea_local_card
            ? new index_js_1.SouthKoreaLocalCard(paymentMethodResponse.south_korea_local_card)
            : null;
        this.underlyingDetails = paymentMethodResponse.underlying_details
            ? new index_js_1.PaymentMethodUnderlyingDetails(paymentMethodResponse.underlying_details)
            : null;
        this.origin = paymentMethodResponse.origin;
        this.savedAt = paymentMethodResponse.saved_at;
        this.updatedAt = paymentMethodResponse.updated_at;
    }
}
exports.PaymentMethod = PaymentMethod;
