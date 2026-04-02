import { type IChargebackFee } from './chargeback-fee.js';
import { type PayoutCurrencyCode } from '../../enums/index.js';
export interface IPayoutTotalsAdjustmentResponse {
    subtotal: string;
    tax: string;
    total: string;
    fee: string;
    chargeback_fee?: IChargebackFee | null;
    earnings: string;
    currency_code: PayoutCurrencyCode;
    retained_fee: string;
}
