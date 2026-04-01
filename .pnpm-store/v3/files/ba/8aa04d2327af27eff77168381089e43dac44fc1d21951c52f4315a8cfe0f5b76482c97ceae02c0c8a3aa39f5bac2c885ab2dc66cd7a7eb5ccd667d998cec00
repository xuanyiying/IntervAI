import { type CreatePriceRequestBody, type CreateProductRequestBody } from '../../resources/index.js';
interface ISubscriptionUpdateItemCreateWithPriceBaseRequest extends Omit<CreatePriceRequestBody, 'type' | 'productId'> {
}
interface ISubscriptionUpdateItemCreateWithProductId extends ISubscriptionUpdateItemCreateWithPriceBaseRequest {
    productId: string;
    product?: never;
}
interface ISubscriptionUpdateItemCreateWithProduct extends ISubscriptionUpdateItemCreateWithPriceBaseRequest {
    productId?: never;
    product: Omit<CreateProductRequestBody, 'type'>;
}
export type ISubscriptionUpdateItemCreateWithPriceRequest = ISubscriptionUpdateItemCreateWithProductId | ISubscriptionUpdateItemCreateWithProduct;
export {};
