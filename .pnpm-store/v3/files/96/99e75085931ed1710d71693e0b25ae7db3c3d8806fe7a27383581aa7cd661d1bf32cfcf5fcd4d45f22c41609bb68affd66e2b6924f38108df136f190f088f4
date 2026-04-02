import { type PaymentType } from '../../enums/index.js';
import { PaymentCard } from './payment-card.js';
import { type IPaymentMethodDetails } from '../../types/index.js';
import { PaymentMethodUnderlyingDetails } from './payment-method-underlying-details.js';
import { SouthKoreaLocalCard } from './south-korea-local-card.js';
export declare class PaymentMethodDetails {
    readonly type: PaymentType;
    readonly card: PaymentCard | null;
    readonly southKoreaLocalCard: SouthKoreaLocalCard | null;
    readonly underlyingDetails: PaymentMethodUnderlyingDetails | null;
    constructor(paymentMethodDetails: IPaymentMethodDetails);
}
