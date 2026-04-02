import { BaseResource } from '../../internal/base/index.js';
import { EventType } from '../../entities/index.js';
const EventTypesPaths = {
    list: '/event-types',
};
export class EventTypesResource extends BaseResource {
    async list() {
        const response = await this.client.get(EventTypesPaths.list);
        const data = this.handleResponse(response);
        return data.map((eventType) => new EventType(eventType));
    }
}
