import { CustomerPortalSession } from '../../entities/index.js';
import { BaseResource, PathParameters } from '../../internal/base/index.js';
const CustomerPortalSessionPaths = {
    create: '/customers/{customer_id}/portal-sessions',
};
export class CustomerPortalSessionsResource extends BaseResource {
    async create(customerId, subscriptionIds) {
        const urlWithPathParams = new PathParameters(CustomerPortalSessionPaths.create, {
            customer_id: customerId,
        }).deriveUrl();
        const response = await this.client.post(urlWithPathParams, {
            subscriptionIds,
        });
        const data = this.handleResponse(response);
        return new CustomerPortalSession(data);
    }
}
