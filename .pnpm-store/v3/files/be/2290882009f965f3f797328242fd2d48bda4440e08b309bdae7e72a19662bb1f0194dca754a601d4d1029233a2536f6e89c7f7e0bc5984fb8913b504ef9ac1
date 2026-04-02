"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentMethodUnderlyingDetails = void 0;
const korean_market_underlying_details_js_1 = require("./korean-market-underlying-details.js");
class PaymentMethodUnderlyingDetails {
    koreaLocal;
    constructor(paymentMethodUnderlyingDetails) {
        this.koreaLocal = paymentMethodUnderlyingDetails.korea_local
            ? new korean_market_underlying_details_js_1.KoreanMarketUnderlyingDetails(paymentMethodUnderlyingDetails.korea_local)
            : null;
    }
}
exports.PaymentMethodUnderlyingDetails = PaymentMethodUnderlyingDetails;
