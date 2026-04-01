import { PaymentCard } from './payment-card.js';
import { PaymentMethodUnderlyingDetails } from './payment-method-underlying-details.js';
import { SouthKoreaLocalCard } from './south-korea-local-card.js';
export class PaymentMethodDetails {
    type;
    card;
    southKoreaLocalCard;
    underlyingDetails;
    constructor(paymentMethodDetails) {
        this.type = paymentMethodDetails.type;
        this.card = paymentMethodDetails.card ? new PaymentCard(paymentMethodDetails.card) : null;
        this.southKoreaLocalCard = paymentMethodDetails.south_korea_local_card
            ? new SouthKoreaLocalCard(paymentMethodDetails.south_korea_local_card)
            : null;
        this.underlyingDetails = paymentMethodDetails.underlying_details
            ? new PaymentMethodUnderlyingDetails(paymentMethodDetails.underlying_details)
            : null;
    }
}
