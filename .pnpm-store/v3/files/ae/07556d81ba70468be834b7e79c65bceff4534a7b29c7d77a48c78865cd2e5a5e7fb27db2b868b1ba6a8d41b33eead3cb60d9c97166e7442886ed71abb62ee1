import type { SavedPaymentMethodType, SavedPaymentOrigin } from '../../enums/index.js';
import type { IPaymentMethodResponse } from '../../types/index.js';
import { PaymentCard, PaymentMethodUnderlyingDetails, PayPal, SouthKoreaLocalCard } from '../shared/index.js';
export declare class PaymentMethod {
    readonly id: string;
    readonly customerId: string;
    readonly addressId: string;
    readonly type: SavedPaymentMethodType;
    readonly card: PaymentCard | null;
    readonly paypal: PayPal | null;
    readonly southKoreaLocalCard: SouthKoreaLocalCard | null;
    readonly underlyingDetails: PaymentMethodUnderlyingDetails | null;
    readonly origin: SavedPaymentOrigin;
    readonly savedAt: string;
    readonly updatedAt: string;
    constructor(paymentMethodResponse: IPaymentMethodResponse);
}
