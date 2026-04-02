import { BaseResource, QueryParameters } from '../../internal/base/index.js';
import { EventCollection } from '../../entities/index.js';
const EventPaths = {
    list: '/events',
};
export * from './operations/index.js';
export class EventsResource extends BaseResource {
    list(queryParams) {
        const queryParameters = new QueryParameters(queryParams);
        return new EventCollection(this.client, EventPaths.list + queryParameters.toQueryString());
    }
}
