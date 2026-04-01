import { type ISubscriptionUpdateItemCreateWithPriceRequest } from './subscription-update-non-catalog-price-request.js';
interface ISubscriptionUpdateBaseItem {
    quantity: number;
}
interface ISubscriptionUpdateItemFromCatalog extends ISubscriptionUpdateBaseItem {
    priceId: string;
    price?: never;
}
interface ISubscriptionUpdateItemCreateWithPrice extends ISubscriptionUpdateBaseItem {
    priceId?: never;
    price: ISubscriptionUpdateItemCreateWithPriceRequest;
}
export type ISubscriptionUpdateItem = ISubscriptionUpdateItemFromCatalog | ISubscriptionUpdateItemCreateWithPrice;
export {};
