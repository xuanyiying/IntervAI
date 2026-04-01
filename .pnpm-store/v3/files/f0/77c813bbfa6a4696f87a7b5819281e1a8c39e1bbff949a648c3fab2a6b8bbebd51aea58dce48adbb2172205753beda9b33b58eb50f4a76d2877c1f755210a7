import { KoreanMarketUnderlyingDetails } from './korean-market-underlying-details.js';
export class PaymentMethodUnderlyingDetails {
    koreaLocal;
    constructor(paymentMethodUnderlyingDetails) {
        this.koreaLocal = paymentMethodUnderlyingDetails.korea_local
            ? new KoreanMarketUnderlyingDetails(paymentMethodUnderlyingDetails.korea_local)
            : null;
    }
}
