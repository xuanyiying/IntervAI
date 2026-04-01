import { type PaymentType } from '../../../enums/index.js';
import { type IPaymentCardNotificationResponse } from './payment-card-notification-response.js';
import { IPaymentMethodUnderlyingDetailsNotification } from './payment-method-underlying-details-notification.js';
import { type ISouthKoreaLocalCardNotificationResponse } from './south-korea-local-card-notification-response.js';
export interface IPaymentMethodDetailsNotification {
    type: PaymentType;
    card: IPaymentCardNotificationResponse | null;
    south_korea_local_card: ISouthKoreaLocalCardNotificationResponse | null;
    underlying_details: IPaymentMethodUnderlyingDetailsNotification | null;
}
