import { PaymentMethod, PaymentMethodCollection } from '../../entities/index.js';
import { BaseResource } from '../../internal/base/index.js';
import { type ListCustomerPaymentMethodQueryParameters } from './operations/index.js';
export * from './operations/index.js';
export declare class PaymentMethodsResource extends BaseResource {
    list(customerId: string, queryParams?: ListCustomerPaymentMethodQueryParameters): PaymentMethodCollection;
    get(customerId: string, paymentMethodId: string): Promise<PaymentMethod>;
    delete(customerId: string, paymentMethodId: string): Promise<undefined>;
}
