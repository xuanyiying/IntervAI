import { type PaymentType } from '../../enums/index.js';
import { type IPaymentCardResponse } from './payment-card-response.js';
import { IPaymentMethodUnderlyingDetails } from './payment-method-underlying-details.js';
import { type ISouthKoreaLocalCardResponse } from './south-korea-local-card-response.js';
export interface IPaymentMethodDetails {
    type: PaymentType;
    card: IPaymentCardResponse | null;
    south_korea_local_card: ISouthKoreaLocalCardResponse | null;
    underlying_details: IPaymentMethodUnderlyingDetails | null;
}
