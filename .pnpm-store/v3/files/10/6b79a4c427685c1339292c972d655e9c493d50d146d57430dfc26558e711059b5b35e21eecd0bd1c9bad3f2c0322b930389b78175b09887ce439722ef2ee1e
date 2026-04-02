import { KoreanMarketUnderlyingDetailsNotification } from './korean-market-underlying-details-notification.js';
export class PaymentMethodUnderlyingDetailsNotification {
    koreaLocal;
    constructor(paymentMethodUnderlyingDetails) {
        this.koreaLocal = paymentMethodUnderlyingDetails.korea_local
            ? new KoreanMarketUnderlyingDetailsNotification(paymentMethodUnderlyingDetails.korea_local)
            : null;
    }
}
