import { type CurrencyCode } from '../../../enums/index.js';
import { type IAddressPreview } from '../../transactions/index.js';
interface IPricePreviewItem {
    priceId: string;
    quantity: number;
}
export interface PricingPreviewRequestBody {
    items: IPricePreviewItem[];
    customerId?: string | null;
    addressId?: string | null;
    businessId?: string | null;
    currencyCode?: CurrencyCode;
    discountId?: string | null;
    address?: IAddressPreview | null;
    customerIpAddress?: string | null;
}
export {};
