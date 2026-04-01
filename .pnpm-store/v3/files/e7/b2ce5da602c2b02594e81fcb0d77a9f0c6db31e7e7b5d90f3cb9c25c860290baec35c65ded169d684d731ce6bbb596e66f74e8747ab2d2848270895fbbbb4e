import { type AvailablePaymentMethod, type CurrencyCode } from '../../enums/index.js';
import { AddressPreview } from '../transaction/index.js';
import { PricingPreviewDetails } from './pricing-preview-details.js';
import { type IPricingPreviewResponse } from '../../types/index.js';
export declare class PricingPreview {
    readonly customerId: string | null;
    readonly addressId: string | null;
    readonly businessId: string | null;
    readonly currencyCode: CurrencyCode;
    readonly discountId: string | null;
    readonly address: AddressPreview | null;
    readonly customerIpAddress: string | null;
    readonly details: PricingPreviewDetails;
    readonly availablePaymentMethods: AvailablePaymentMethod[];
    constructor(pricePreview: IPricingPreviewResponse);
}
