import { PaymentCard, PaymentMethodUnderlyingDetails, PayPal, SouthKoreaLocalCard } from '../shared/index.js';
export class PaymentMethod {
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
        this.card = paymentMethodResponse.card ? new PaymentCard(paymentMethodResponse.card) : null;
        this.paypal = paymentMethodResponse.paypal ? new PayPal(paymentMethodResponse.paypal) : null;
        this.southKoreaLocalCard = paymentMethodResponse.south_korea_local_card
            ? new SouthKoreaLocalCard(paymentMethodResponse.south_korea_local_card)
            : null;
        this.underlyingDetails = paymentMethodResponse.underlying_details
            ? new PaymentMethodUnderlyingDetails(paymentMethodResponse.underlying_details)
            : null;
        this.origin = paymentMethodResponse.origin;
        this.savedAt = paymentMethodResponse.saved_at;
        this.updatedAt = paymentMethodResponse.updated_at;
    }
}
