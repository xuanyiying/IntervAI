import { PaymentMethod, PaymentMethodCollection } from '../../entities/index.js';
import { BaseResource, PathParameters, QueryParameters } from '../../internal/base/index.js';
export * from './operations/index.js';
const PaymentMethodPaths = {
    list: '/customers/{customer_id}/payment-methods',
    get: '/customers/{customer_id}/payment-methods/{payment_method_id}',
    delete: '/customers/{customer_id}/payment-methods/{payment_method_id}',
};
export class PaymentMethodsResource extends BaseResource {
    list(customerId, queryParams) {
        const queryParameters = new QueryParameters(queryParams);
        const urlWithPathParams = new PathParameters(PaymentMethodPaths.list, {
            customer_id: customerId,
        }).deriveUrl();
        return new PaymentMethodCollection(this.client, urlWithPathParams + queryParameters.toQueryString());
    }
    async get(customerId, paymentMethodId) {
        const urlWithPathParams = new PathParameters(PaymentMethodPaths.get, {
            customer_id: customerId,
            payment_method_id: paymentMethodId,
        }).deriveUrl();
        const response = await this.client.get(urlWithPathParams);
        const data = this.handleResponse(response);
        return new PaymentMethod(data);
    }
    async delete(customerId, paymentMethodId) {
        const urlWithPathParams = new PathParameters(PaymentMethodPaths.delete, {
            customer_id: customerId,
            payment_method_id: paymentMethodId,
        }).deriveUrl();
        const response = await this.client.delete(urlWithPathParams);
        if (response) {
            this.handleResponse(response);
        }
    }
}
