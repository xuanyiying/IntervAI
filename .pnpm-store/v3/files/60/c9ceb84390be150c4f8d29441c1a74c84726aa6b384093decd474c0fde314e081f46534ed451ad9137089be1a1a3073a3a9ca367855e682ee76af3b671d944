import { PaymentCardNotification } from './payment-card-notification.js';
import { PaymentMethodUnderlyingDetailsNotification } from './payment-method-underlying-details-notification.js';
import { SouthKoreaLocalCardNotification } from './south-korea-local-card-notification.js';
export class PaymentMethodDetailsNotification {
    type;
    card;
    southKoreaLocalCard;
    underlyingDetails;
    constructor(paymentMethodDetails) {
        this.type = paymentMethodDetails.type;
        this.card = paymentMethodDetails.card ? new PaymentCardNotification(paymentMethodDetails.card) : null;
        this.southKoreaLocalCard = paymentMethodDetails.south_korea_local_card
            ? new SouthKoreaLocalCardNotification(paymentMethodDetails.south_korea_local_card)
            : null;
        this.underlyingDetails = paymentMethodDetails.underlying_details
            ? new PaymentMethodUnderlyingDetailsNotification(paymentMethodDetails.underlying_details)
            : null;
    }
}
