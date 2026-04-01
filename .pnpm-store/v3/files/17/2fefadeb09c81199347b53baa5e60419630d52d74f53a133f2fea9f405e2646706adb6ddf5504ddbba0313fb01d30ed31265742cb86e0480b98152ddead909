import { type PaymentType } from '../../../enums/index.js';
import { PaymentCardNotification } from './payment-card-notification.js';
import { type IPaymentMethodDetailsNotification } from '../../types/index.js';
import { PaymentMethodUnderlyingDetailsNotification } from './payment-method-underlying-details-notification.js';
import { SouthKoreaLocalCardNotification } from './south-korea-local-card-notification.js';
export declare class PaymentMethodDetailsNotification {
    readonly type: PaymentType;
    readonly card: PaymentCardNotification | null;
    readonly southKoreaLocalCard: SouthKoreaLocalCardNotification | null;
    readonly underlyingDetails: PaymentMethodUnderlyingDetailsNotification | null;
    constructor(paymentMethodDetails: IPaymentMethodDetailsNotification);
}
